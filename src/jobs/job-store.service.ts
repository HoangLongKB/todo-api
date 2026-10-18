import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export type JobStatus = 'pending' | 'running' | 'done' | 'failed';

export interface JobRecord {
  id: string;
  type: string;
  status: JobStatus;
  createdAt: string;
  finishedAt?: string;
  result?: unknown;
  error?: string;
}

const MAX_JOBS = 1000;

/**
 * Kho job TRONG BỘ NHỚ của một instance. Đủ cho bài học 202 + jobId.
 * Giới hạn thật (ghi để đề xuất cải tiến): Cloud Run chạy 2 instance thì jobId tạo ở
 * instance A, hỏi trúng instance B là 404; instance tắt là mất hết. Bản thật lưu job
 * vào DB/Redis và chạy bằng worker riêng.
 */
@Injectable()
export class JobStore {
  private readonly logger = new Logger(JobStore.name);
  private readonly jobs = new Map<string, JobRecord>();

  create(type: string): JobRecord {
    const job: JobRecord = {
      id: randomUUID(),
      type,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.jobs.set(job.id, job);
    this.prune();
    return job;
  }

  get(id: string): JobRecord | undefined {
    return this.jobs.get(id);
  }

  /** Chạy fn ở vòng lặp sự kiện kế tiếp, để request hiện tại trả 202 ngay. */
  run(job: JobRecord, fn: () => Promise<unknown>): void {
    setImmediate(() => {
      job.status = 'running';
      fn()
        .then((result) => {
          job.status = 'done';
          job.result = result;
        })
        .catch((err: unknown) => {
          job.status = 'failed';
          job.error = err instanceof Error ? err.message : String(err);
          this.logger.warn(`job ${job.id} (${job.type}) lỗi: ${job.error}`);
        })
        .finally(() => {
          job.finishedAt = new Date().toISOString();
        });
    });
  }

  /** Giữ tối đa MAX_JOBS bản ghi, xóa cái cũ nhất (Map giữ thứ tự chèn). */
  private prune(): void {
    for (const key of this.jobs.keys()) {
      if (this.jobs.size <= MAX_JOBS) break;
      this.jobs.delete(key); // xóa trong lúc duyệt Map là an toàn theo chuẩn JS
    }
  }
}
