import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';
import { BalanceResponseDto } from './dto/balance-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('groups/:groupId/expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  async createExpense(
    @Param('groupId') groupId: string,
    @Body() createExpenseDto: CreateExpenseDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.createExpense(
      groupId,
      createExpenseDto,
      user.id,
    );
  }

  @Get()
  async getGroupExpenses(
    @Param('groupId') groupId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ExpenseResponseDto[]> {
    return this.expensesService.getGroupExpenses(groupId, user.id);
  }
}

@Controller('groups/:groupId/balances')
@UseGuards(JwtAuthGuard)
export class BalancesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  async getGroupBalances(
    @Param('groupId') groupId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<BalanceResponseDto[]> {
    return this.expensesService.getGroupBalances(groupId, user.id);
  }
}
