import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CacheService } from '../cache/cache.service';
import { Todo } from './todo.entity';
import { TodosService } from './todos.service';

/** Repository và CacheService giả: không cần Postgres hay Redis để chạy unit test. */
const repoMock = {
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};
const cacheMock = {
  get: jest.fn(),
  set: jest.fn(),
  incr: jest.fn(),
};

describe('TodosService', () => {
  let service: TodosService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        TodosService,
        { provide: getRepositoryToken(Todo), useValue: repoMock },
        { provide: CacheService, useValue: cacheMock },
      ],
    }).compile();
    service = moduleRef.get(TodosService);
  });

  it('list: cache miss thì hỏi DB rồi set cache', async () => {
    cacheMock.get.mockResolvedValue(null);
    repoMock.findAndCount.mockResolvedValue([[{ id: '1' }], 1]);

    const res = await service.list('u1', { page: 1, limit: 20 });

    expect(res.total).toBe(1);
    expect(repoMock.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerUid: 'u1' }, skip: 0, take: 20 }),
    );
    expect(cacheMock.set).toHaveBeenCalledTimes(1);
  });

  it('list: cache hit thì không đụng DB', async () => {
    cacheMock.get
      .mockResolvedValueOnce(3) // version
      .mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 20 });

    await service.list('u1', { page: 1, limit: 20 });

    expect(repoMock.findAndCount).not.toHaveBeenCalled();
  });

  it('create: lưu kèm ownerUid và tăng version cache', async () => {
    repoMock.create.mockImplementation((x: Partial<Todo>) => x);
    repoMock.save.mockImplementation((x: Todo) =>
      Promise.resolve({ ...x, id: 'new' }),
    );

    const res = await service.create('u1', { title: 'Mua sữa' });

    expect(res.ownerUid).toBe('u1');
    expect(cacheMock.incr).toHaveBeenCalledWith('todos:ver:u1');
  });

  it('findOne: todo của người khác thì 404', async () => {
    repoMock.findOne.mockResolvedValue(null);
    await expect(service.findOne('u2', 'id-cua-u1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repoMock.findOne).toHaveBeenCalledWith({
      where: { id: 'id-cua-u1', ownerUid: 'u2' },
    });
  });
});
