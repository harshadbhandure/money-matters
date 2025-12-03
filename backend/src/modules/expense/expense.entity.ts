import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Group } from '../group/group.entity';
import { ExpenseSplit } from '../expense-split/expense-split.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Group, (group) => group.expenses, { nullable: false })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @Column()
  groupId: string;

  @ManyToOne(() => User, (user) => user.expenses, { nullable: false })
  @JoinColumn({ name: 'paidById' })
  paidBy: User;

  @Column()
  paidById: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: false })
  amount: number;

  @Column({ nullable: false })
  description: string;

  @Column({ type: 'date', nullable: false })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ExpenseSplit, (split) => split.expense, { cascade: true })
  splits: ExpenseSplit[];
}
