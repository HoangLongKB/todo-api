import { Test } from '@nestjs/testing';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';

describe('TodosController', () => {
  let controller: TodosController;
  const serviceMock = { list: jest.fn(), create: jest.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TodosController],
      providers: [{ provide: TodosService, useValue: serviceMock }],
    }).compile();
    controller = moduleRef.get(TodosController);
  });

  it('list chuyển uid và query xuống service', async () => {
    serviceMock.list.mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      limit: 5,
    });
    const res = await controller.list('u1', { page: 2, limit: 5 });
    expect(serviceMock.list).toHaveBeenCalledWith('u1', { page: 2, limit: 5 });
    expect(res.page).toBe(2);
  });
});
