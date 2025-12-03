import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesController, BalancesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { Expense } from '../expense/expense.entity';
import { ExpenseSplit } from '../expense-split/expense-split.entity';
import { Group } from '../group/group.entity';
import { User } from '../user/user.entity';
import { GroupModule } from '../group/group.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, ExpenseSplit, Group, User]),
    GroupModule,
  ],
  controllers: [ExpensesController, BalancesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
