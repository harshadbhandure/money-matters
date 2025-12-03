export class ExpenseSplitResponseDto {
  id: string;
  userId: string;
  userName: string;
  share: number;
  paid: boolean;
}

export class ExpenseResponseDto {
  id: string;
  groupId: string;
  paidById: string;
  paidByName: string;
  amount: number;
  description: string;
  date: string;
  createdAt: Date;
  splits: ExpenseSplitResponseDto[];
}
