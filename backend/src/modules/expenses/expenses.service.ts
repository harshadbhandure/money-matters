import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Expense } from '../expense/expense.entity';
import { ExpenseSplit } from '../expense-split/expense-split.entity';
import { Group } from '../group/group.entity';
import { User } from '../user/user.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseResponseDto, ExpenseSplitResponseDto } from './dto/expense-response.dto';
import { BalanceResponseDto } from './dto/balance-response.dto';
import { GroupService } from '../group/group.service';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(ExpenseSplit)
    private expenseSplitRepository: Repository<ExpenseSplit>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private groupService: GroupService,
  ) {}

  async createExpense(
    groupId: string,
    createExpenseDto: CreateExpenseDto,
    currentUserId: string,
  ): Promise<ExpenseResponseDto> {
    // Validate current user is a member of the group
    const isCurrentUserMember = await this.groupService.isMember(
      currentUserId,
      groupId,
    );

    if (!isCurrentUserMember) {
      throw new ForbiddenException(
        'You must be a member of the group to add expenses',
      );
    }

    // Validate paidBy user is a group member
    const isPaidByMember = await this.groupService.isMember(
      createExpenseDto.paidBy,
      groupId,
    );

    if (!isPaidByMember) {
      throw new BadRequestException(
        `User with ID ${createExpenseDto.paidBy} is not a member of this group`,
      );
    }

    // Validate all split users are group members
    for (const split of createExpenseDto.splits) {
      const isMember = await this.groupService.isMember(split.userId, groupId);
      if (!isMember) {
        throw new BadRequestException(
          `User with ID ${split.userId} is not a member of this group`,
        );
      }
    }

    // Validate total split shares equal the expense amount
    const totalSplitAmount = createExpenseDto.splits.reduce(
      (sum, split) => sum + split.share,
      0,
    );

    if (Math.abs(totalSplitAmount - createExpenseDto.amount) > 0.01) {
      throw new BadRequestException(
        `Total split amount (${totalSplitAmount}) must equal expense amount (${createExpenseDto.amount})`,
      );
    }

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create expense
      const expense = queryRunner.manager.create(Expense, {
        groupId: groupId,
        paidById: createExpenseDto.paidBy,
        amount: createExpenseDto.amount,
        description: createExpenseDto.description || '',
        date: new Date(),
      });

      const savedExpense = await queryRunner.manager.save(Expense, expense);

      // Create expense splits from DTO
      const splits: ExpenseSplit[] = [];
      for (const splitDto of createExpenseDto.splits) {
        const split = queryRunner.manager.create(ExpenseSplit, {
          expenseId: savedExpense.id,
          userId: splitDto.userId,
          share: splitDto.share,
          paid: splitDto.userId === createExpenseDto.paidBy, // Mark as paid if they're the one who paid
        });
        splits.push(split);
      }

      await queryRunner.manager.save(ExpenseSplit, splits);

      await queryRunner.commitTransaction();

      // Fetch the complete expense with relations
      const completeExpense = await this.expenseRepository.findOne({
        where: { id: savedExpense.id },
        relations: ['paidBy', 'splits', 'splits.user'],
      });

      if (!completeExpense) {
        throw new Error('Failed to retrieve created expense');
      }

      return this.mapToExpenseResponse(completeExpense);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getGroupExpenses(
    groupId: string,
    currentUserId: string,
  ): Promise<ExpenseResponseDto[]> {
    // Validate group exists and user is a member
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['members'],
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const isMember = group.members.some(
      (member) => member.id === currentUserId,
    );

    if (!isMember) {
      throw new ForbiddenException(
        'You must be a member of the group to view expenses',
      );
    }

    // Fetch expenses with relations
    const expenses = await this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.paidBy', 'paidBy')
      .leftJoinAndSelect('expense.splits', 'splits')
      .leftJoinAndSelect('splits.user', 'user')
      .where('expense.groupId = :groupId', { groupId })
      .orderBy('expense.date', 'DESC')
      .addOrderBy('expense.createdAt', 'DESC')
      .getMany();

    return expenses.map((expense) => this.mapToExpenseResponse(expense));
  }

  async getGroupBalances(
    groupId: string,
    currentUserId: string,
  ): Promise<BalanceResponseDto[]> {
    // Validate group exists and user is a member
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['members'],
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const isMember = group.members.some(
      (member) => member.id === currentUserId,
    );

    if (!isMember) {
      throw new ForbiddenException(
        'You must be a member of the group to view balances',
      );
    }

    // Calculate balances using QueryBuilder
    // Balance = Total Paid - Total Owed
    const balances = await this.dataSource
      .createQueryBuilder()
      .select('user.id', 'userId')
      .addSelect('user.name', 'name')
      .addSelect(
        'COALESCE(SUM(CASE WHEN expense.paidById = user.id THEN expense.amount ELSE 0 END), 0)',
        'totalPaid',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN split.userId = user.id THEN split.share ELSE 0 END), 0)',
        'totalOwed',
      )
      .from(User, 'user')
      .innerJoin('group_members', 'gm', 'gm.userId = user.id')
      .leftJoin(
        Expense,
        'expense',
        'expense.groupId = :groupId AND expense.paidById = user.id',
        { groupId },
      )
      .leftJoin(
        ExpenseSplit,
        'split',
        'split.userId = user.id AND split.expenseId IN (SELECT e.id FROM expenses e WHERE e.groupId = :groupId)',
        { groupId },
      )
      .where('gm.groupId = :groupId', { groupId })
      .groupBy('user.id')
      .addGroupBy('user.name')
      .getRawMany();

    return balances.map((balance) => ({
      userId: balance.userId,
      name: balance.name,
      balance: Number(
        (Number(balance.totalPaid) - Number(balance.totalOwed)).toFixed(2),
      ),
    }));
  }

  private mapToExpenseResponse(expense: Expense): ExpenseResponseDto {
    return {
      id: expense.id,
      groupId: expense.groupId,
      paidById: expense.paidById,
      paidByName: expense.paidBy.name,
      amount: Number(expense.amount),
      description: expense.description,
      date: String(expense.date),
      createdAt: expense.createdAt,
      splits: expense.splits.map((split) => this.mapToSplitResponse(split)),
    };
  }

  private mapToSplitResponse(split: ExpenseSplit): ExpenseSplitResponseDto {
    return {
      id: split.id,
      userId: split.userId,
      userName: split.user.name,
      share: Number(split.share),
      paid: split.paid,
    };
  }
}
