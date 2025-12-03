import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Group } from '../group/group.entity';
import { Expense } from '../expense/expense.entity';
import { ExpenseSplit } from '../expense-split/expense-split.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false })
  passwordHash: string;

  @Column({ nullable: false })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(() => Group, (group) => group.members)
  groups: Group[];

  @OneToMany(() => Group, (group) => group.createdBy)
  createdGroups: Group[];

  @OneToMany(() => Expense, (expense) => expense.paidBy)
  expenses: Expense[];

  @OneToMany(() => ExpenseSplit, (split) => split.user)
  expenseSplits: ExpenseSplit[];
}
