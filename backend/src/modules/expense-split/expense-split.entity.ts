import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Expense } from '../expense/expense.entity';
import { User } from '../user/user.entity';

@Entity('expense_splits')
export class ExpenseSplit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Expense, (expense) => expense.splits, { nullable: false })
  @JoinColumn({ name: 'expenseId' })
  expense: Expense;

  @Column()
  expenseId: string;

  @ManyToOne(() => User, (user) => user.expenseSplits, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: false })
  share: number;

  @Column({ default: false })
  paid: boolean;
}
