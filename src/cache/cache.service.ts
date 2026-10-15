import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Bọc Redis theo kiểu FAIL-OPEN: Redis chết hay chậm thì mọi hàm trả null / không làm gì,
 * chỉ log cảnh báo. App vẫn chạy, chỉ mất lợi ích cache. Ngược lại là fail-closed:
 * Redis chết là request lỗi theo. Hệ thống công ty chọn fail-open.
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis | null = null;

  onModuleInit(): void {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.warn('Không có REDIS_URL, chạy không cache');
      return;
    }
    this.client = new Redis(url, {
      lazyConnect: true, // không nối ngay lúc tạo, nối ở lệnh đầu tiên
      enableOfflineQueue: false, // Redis chưa nối thì lệnh fail ngay, không xếp hàng chờ
      maxRetriesPerRequest: 0, // không thử lại, trả lỗi nhanh để fail-open
      connectTimeout: 500,
      commandTimeout: 300,
    });
    // ioredis phát 'error' liên tục khi mất kết nối; không bắt là crash process
    this.client.on('error', (err: Error) =>
      this.logger.warn(`Redis lỗi (bỏ qua, fail-open): ${err.message}`),
    );
    this.client.connect().catch(() => undefined);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit().catch(() => undefined);
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      this.warn('get', key, err);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      this.warn('set', key, err);
    }
  }

  /** Tăng một số đếm, dùng làm "phiên bản" để vô hiệu hóa nhóm key. */
  async incr(key: string): Promise<number | null> {
    if (!this.client) return null;
    try {
      return await this.client.incr(key);
    } catch (err) {
      this.warn('incr', key, err);
      return null;
    }
  }

  private warn(op: string, key: string, err: unknown): void {
    const msg = err instanceof Error ? err.message : String(err);
    this.logger.warn(`cache ${op} ${key} thất bại, bỏ qua: ${msg}`);
  }
}
