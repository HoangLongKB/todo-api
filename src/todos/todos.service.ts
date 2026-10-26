import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '../cache/cache.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { ListTodosQuery } from './dto/list-todos.query';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo } from './todo.entity';

export interface ImportItem {
  id?: string;
  title: string;
  done?: boolean;
}

export interface ImportResult {
  created: number;
  updated: number;
  notFound: string[];
}

export interface PagedTodos {
  items: Todo[];
  total: number;
  page: number;
  limit: number;
}

const LIST_TTL_SECONDS = 30;

/**
 * Cache-aside cho danh sách:
 *  đọc: có trong cache -> trả; không -> hỏi DB, bỏ vào cache.
 *  ghi: tăng "phiên bản" của owner, mọi key danh sách cũ tự thành rác (hết TTL thì mất).
 * Không dùng SCAN/DEL theo pattern vì chậm và chặn Redis.
 */
@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo) private readonly repo: Repository<Todo>,
    private readonly cache: CacheService,
  ) {}

  async list(ownerUid: string, query: ListTodosQuery): Promise<PagedTodos> {
    const ver = (await this.cache.get<number>(this.verKey(ownerUid))) ?? 0;
    const key = `todos:${ownerUid}:v${ver}:p${query.page}:l${query.limit}`;

    const cached = await this.cache.get<PagedTodos>(key);
    if (cached) return cached;

    const [items, total] = await this.repo.findAndCount({
      where: { ownerUid },
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    const result: PagedTodos = {
      items,
      total,
      page: query.page,
      limit: query.limit,
    };
    await this.cache.set(key, result, LIST_TTL_SECONDS);
    return result;
  }

  async findOne(ownerUid: string, id: string): Promise<Todo> {
    // Lọc theo ownerUid luôn: người A không đọc được todo của người B
    const todo = await this.repo.findOne({ where: { id, ownerUid } });
    if (!todo) throw new NotFoundException(`Không có todo ${id}`);
    return todo;
  }

  async create(ownerUid: string, dto: CreateTodoDto): Promise<Todo> {
    const todo = this.repo.create({ ...dto, ownerUid });
    const saved = await this.repo.save(todo);
    await this.invalidate(ownerUid);
    return saved;
  }

  async update(
    ownerUid: string,
    id: string,
    dto: UpdateTodoDto,
  ): Promise<Todo> {
    const todo = await this.findOne(ownerUid, id);
    Object.assign(todo, dto);
    const saved = await this.repo.save(todo);
    await this.invalidate(ownerUid);
    return saved;
  }

  async remove(ownerUid: string, id: string): Promise<void> {
    const todo = await this.findOne(ownerUid, id);
    await this.repo.remove(todo);
    await this.invalidate(ownerUid);
  }

  /**
   * Nhập hàng loạt từ sheet (gọi nền bởi WebhookController).
   * Có id và tìm thấy -> cập nhật; có id mà không thấy -> ghi vào notFound, bỏ qua;
   * không id -> tạo mới. Vô hiệu cache MỘT lần ở cuối thay vì mỗi dòng.
   */
  async importMany(
    ownerUid: string,
    items: ImportItem[],
  ): Promise<ImportResult> {
    const result: ImportResult = { created: 0, updated: 0, notFound: [] };
    for (const item of items) {
      if (item.id) {
        const existing = await this.repo.findOne({
          where: { id: item.id, ownerUid },
        });
        if (!existing) {
          result.notFound.push(item.id);
          continue;
        }
        existing.title = item.title;
        if (item.done !== undefined) existing.done = item.done;
        await this.repo.save(existing);
        result.updated += 1;
      } else {
        await this.repo.save(
          this.repo.create({ title: item.title, done: item.done, ownerUid }),
        );
        result.created += 1;
      }
    }
    if (items.length > 0) await this.invalidate(ownerUid);
    return result;
  }

  private verKey(ownerUid: string): string {
    return `todos:ver:${ownerUid}`;
  }

  private async invalidate(ownerUid: string): Promise<void> {
    await this.cache.incr(this.verKey(ownerUid));
  }
}
