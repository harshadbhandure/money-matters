export interface Group {
  id: string;
  name: string;
  createdById: string;
  createdAt: string;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
}

export interface CreateGroupRequest {
  name: string;
}

export interface Expense {
  id: string;
  groupId: string;
  paidById: string;
  paidByName: string;
  amount: number;
  description: string;
  date: string;
  createdAt: Date;
  splits: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  userId: string;
  userName: string;
  share: number;
  paid: boolean;
}

export interface CreateExpenseRequest {
  paidById: string;
  amount: number;
  description: string;
  date: string;
}

export interface Balance {
  userId: string;
  name: string;
  balance: number;
}
