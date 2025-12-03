import { IsNotEmpty, IsNumber, IsString, IsUUID, IsDateString, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsUUID()
  @IsNotEmpty()
  paidById: string;

  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;
}
