import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { GroupService } from '../../services/group.service';
import { Expense, Group, CreateExpenseRequest } from '../../models/group.models';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css'],
})
export class ExpensesComponent implements OnInit {
  groupId: string | null = null;
  currentUser$;
  group: Group | null = null;
  expenses: Expense[] = [];
  isLoading = false;
  showAddExpenseDialog = false;

  // Form fields
  newExpense = {
    paidById: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  };
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private groupService: GroupService
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('id');
    if (this.groupId) {
      this.loadData();
    }
  }

  loadData(): void {
    if (!this.groupId) return;

    this.isLoading = true;

    // Load group details
    this.groupService.getGroup(this.groupId).subscribe({
      next: (group) => {
        this.group = group;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading group:', error);
        this.isLoading = false;
      },
    });

    // Load expenses
    this.loadExpenses();
  }

  loadExpenses(): void {
    if (!this.groupId) return;

    this.groupService.getGroupExpenses(this.groupId).subscribe({
      next: (expenses) => {
        this.expenses = expenses;
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
      },
    });
  }

  openAddExpenseDialog(): void {
    this.showAddExpenseDialog = true;
    this.newExpense = {
      paidById: '',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
    };
    this.errorMessage = '';
  }

  closeAddExpenseDialog(): void {
    this.showAddExpenseDialog = false;
    this.errorMessage = '';
  }

  addExpense(): void {
    if (!this.groupId) return;

    if (!this.newExpense.paidById || !this.newExpense.amount || !this.newExpense.description) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    if (this.newExpense.amount <= 0) {
      this.errorMessage = 'Amount must be greater than 0';
      return;
    }

    // Calculate equal splits for all members
    const members = this.group?.members || [];
    if (members.length === 0) {
      this.errorMessage = 'Group has no members';
      return;
    }

    const sharePerMember = Number((this.newExpense.amount / members.length).toFixed(2));
    const splits = members.map(member => ({
      userId: member.id,
      share: sharePerMember
    }));

    // Adjust for rounding differences
    const totalSplits = splits.reduce((sum, split) => sum + split.share, 0);
    const difference = Number((this.newExpense.amount - totalSplits).toFixed(2));
    if (difference !== 0 && splits.length > 0) {
      splits[0].share = Number((splits[0].share + difference).toFixed(2));
    }

    const expenseData: CreateExpenseRequest = {
      paidBy: this.newExpense.paidById,
      amount: this.newExpense.amount,
      description: this.newExpense.description,
      splits: splits
    };

    this.isLoading = true;
    this.groupService.createExpense(this.groupId, expenseData).subscribe({
      next: (expense) => {
        this.expenses.unshift(expense);
        this.closeAddExpenseDialog();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to add expense';
        this.isLoading = false;
      },
    });
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
