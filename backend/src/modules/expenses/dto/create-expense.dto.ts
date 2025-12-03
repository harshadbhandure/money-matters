import { IsNotEmpty, IsNumber, IsString, IsUUID, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ExpenseSplitDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  share: number;
}

export class CreateExpenseDto {
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  paidBy: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseSplitDto)
  @IsNotEmpty()
  splits: ExpenseSplitDto[];
}
