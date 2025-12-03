import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ExpensesService } from './expenses.service';
import { Expense } from '../expense/expense.entity';
import { ExpenseSplit } from '../expense-split/expense-split.entity';
import { Group } from '../group/group.entity';
import { User } from '../user/user.entity';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let expenseRepository: Repository<Expense>;
  let groupRepository: Repository<Group>;
  let dataSource: DataSource;

  const mockUser1 = {
    id: 'user-1',
    email: 'user1@example.com',
    name: 'User One',
    passwordHash: 'hash',
    createdAt: new Date(),
  };

  const mockUser2 = {
    id: 'user-2',
    email: 'user2@example.com',
    name: 'User Two',
    passwordHash: 'hash',
    createdAt: new Date(),
  };

  const mockGroup = {
    id: 'group-1',
    name: 'Test Group',
    createdById: 'user-1',
    createdAt: new Date(),
    members: [mockUser1, mockUser2],
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn(),
      save: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        {
          provide: getRepositoryToken(Expense),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ExpenseSplit),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Group),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
    expenseRepository = module.get<Repository<Expense>>(
      getRepositoryToken(Expense),
    );
    groupRepository = module.get<Repository<Group>>(getRepositoryToken(Group));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createExpense', () => {
    it('should create an expense with equal splits', async () => {
      const createExpenseDto = {
        paidById: 'user-1',
        amount: 100,
        description: 'Test expense',
        date: '2024-01-15',
      };

      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(mockGroup as any);

      const mockExpense = {
        id: 'expense-1',
        groupId: 'group-1',
        paidById: 'user-1',
        amount: 100,
        description: 'Test expense',
        date: new Date('2024-01-15'),
        createdAt: new Date(),
      };

      mockQueryRunner.manager.create.mockReturnValueOnce(mockExpense);
      mockQueryRunner.manager.save.mockResolvedValueOnce(mockExpense);
      mockQueryRunner.manager.save.mockResolvedValueOnce([]);

      const mockExpenseWithRelations = {
        ...mockExpense,
        paidBy: mockUser1,
        splits: [
          {
            id: 'split-1',
            expenseId: 'expense-1',
            userId: 'user-1',
            user: mockUser1,
            share: 50,
            paid: true,
          },
          {
            id: 'split-2',
            expenseId: 'expense-1',
            userId: 'user-2',
            user: mockUser2,
            share: 50,
            paid: false,
          },
        ],
      };

      jest
        .spyOn(expenseRepository, 'findOne')
        .mockResolvedValue(mockExpenseWithRelations as any);

      const result = await service.createExpense(
        'group-1',
        createExpenseDto,
        'user-1',
      );

      expect(result).toEqual({
        id: 'expense-1',
        groupId: 'group-1',
        paidById: 'user-1',
        paidByName: 'User One',
        amount: 100,
        description: 'Test expense',
        date: '2024-01-15',
        createdAt: mockExpense.createdAt,
        splits: [
          {
            id: 'split-1',
            userId: 'user-1',
            userName: 'User One',
            share: 50,
            paid: true,
          },
          {
            id: 'split-2',
            userId: 'user-2',
            userName: 'User Two',
            share: 50,
            paid: false,
          },
        ],
      });

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException if group does not exist', async () => {
      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.createExpense(
          'non-existent-group',
          {
            paidById: 'user-1',
            amount: 100,
            description: 'Test',
            date: '2024-01-15',
          },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if current user is not a group member', async () => {
      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(mockGroup as any);

      await expect(
        service.createExpense(
          'group-1',
          {
            paidById: 'user-1',
            amount: 100,
            description: 'Test',
            date: '2024-01-15',
          },
          'non-member-user',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if paidById user is not a group member', async () => {
      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(mockGroup as any);

      await expect(
        service.createExpense(
          'group-1',
          {
            paidById: 'non-member-user',
            amount: 100,
            description: 'Test',
            date: '2024-01-15',
          },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should rollback transaction on error', async () => {
      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(mockGroup as any);
      mockQueryRunner.manager.save.mockRejectedValueOnce(
        new Error('Database error'),
      );

      await expect(
        service.createExpense(
          'group-1',
          {
            paidById: 'user-1',
            amount: 100,
            description: 'Test',
            date: '2024-01-15',
          },
          'user-1',
        ),
      ).rejects.toThrow('Database error');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('getGroupExpenses', () => {
    it('should return expenses for a group', async () => {
      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(mockGroup as any);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 'expense-1',
            groupId: 'group-1',
            paidById: 'user-1',
            paidBy: mockUser1,
            amount: 100,
            description: 'Test expense',
            date: new Date('2024-01-15'),
            createdAt: new Date(),
            splits: [],
          },
        ]),
      };

      jest
        .spyOn(expenseRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getGroupExpenses('group-1', 'user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('expense-1');
      expect(result[0].paidByName).toBe('User One');
    });

    it('should throw NotFoundException if group does not exist', async () => {
      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getGroupExpenses('non-existent-group', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a group member', async () => {
      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(mockGroup as any);

      await expect(
        service.getGroupExpenses('group-1', 'non-member-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getGroupBalances', () => {
    it('should calculate balances correctly', async () => {
      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(mockGroup as any);

      const mockBalances = [
        {
          userId: 'user-1',
          name: 'User One',
          totalPaid: '100',
          totalOwed: '50',
        },
        {
          userId: 'user-2',
          name: 'User Two',
          totalPaid: '0',
          totalOwed: '50',
        },
      ];

      mockDataSource.createQueryBuilder().getRawMany.mockResolvedValue(
        mockBalances,
      );

      const result = await service.getGroupBalances('group-1', 'user-1');

      expect(result).toEqual([
        { userId: 'user-1', name: 'User One', balance: 50 },
        { userId: 'user-2', name: 'User Two', balance: -50 },
      ]);
    });

    it('should throw NotFoundException if group does not exist', async () => {
      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getGroupBalances('non-existent-group', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a group member', async () => {
      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(mockGroup as any);

      await expect(
        service.getGroupBalances('group-1', 'non-member-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
