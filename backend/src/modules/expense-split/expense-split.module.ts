import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseSplit } from './expense-split.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExpenseSplit])],
  exports: [TypeOrmModule],
})
export class ExpenseSplitModule {}
