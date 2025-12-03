import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { GroupService } from '../../services/group.service';
import { Group, Expense, Balance, CreateExpenseRequest } from '../../models/group.models';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './group-detail.component.html',
  styleUrls: ['./group-detail.component.css'],
})
export class GroupDetailComponent implements OnInit {
  groupId: string | null = null;
  currentUser$;
  group: Group | null = null;
  expenses: Expense[] = [];
  balances: Balance[] = [];
  isLoading = false;
  showAddExpenseDialog = false;
  showAddMemberDialog = false;
  
  // Form fields
  newExpense = {
    paidById: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  };
  
  // Add member fields
  searchEmail = '';
  searchResults: { id: string; name: string; email: string }[] = [];
  isSearching = false;
  
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
      this.loadGroupData();
    }
  }

  loadGroupData(): void {
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
    this.groupService.getGroupExpenses(this.groupId).subscribe({
      next: (expenses) => {
        this.expenses = expenses;
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
      },
    });

    // Load balances
    this.groupService.getGroupBalances(this.groupId).subscribe({
      next: (balances) => {
        this.balances = balances;
      },
      error: (error) => {
        console.error('Error loading balances:', error);
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
        this.loadGroupData(); // Reload to update balances
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to add expense';
        this.isLoading = false;
      },
    });
  }

  getBalanceClass(balance: number): string {
    if (balance > 0) return 'balance-positive';
    if (balance < 0) return 'balance-negative';
    return 'balance-zero';
  }

  formatBalance(balance: number): string {
    const abs = Math.abs(balance);
    if (balance > 0) return `gets back $${abs.toFixed(2)}`;
    if (balance < 0) return `owes $${abs.toFixed(2)}`;
    return 'settled up';
  }

  openAddMemberDialog(): void {
    this.showAddMemberDialog = true;
    this.searchEmail = '';
    this.searchResults = [];
    this.errorMessage = '';
  }

  closeAddMemberDialog(): void {
    this.showAddMemberDialog = false;
    this.searchEmail = '';
    this.searchResults = [];
    this.errorMessage = '';
  }

  searchUsers(): void {
    if (!this.searchEmail || this.searchEmail.length < 3) {
      this.searchResults = [];
      return;
    }

    this.isSearching = true;
    this.groupService.searchUsers(this.searchEmail).subscribe({
      next: (users) => {
        // Filter out users who are already members
        const memberIds = this.group?.members?.map(m => m.id) || [];
        this.searchResults = users.filter(u => !memberIds.includes(u.id));
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Error searching users:', error);
        this.errorMessage = 'Failed to search users';
        this.isSearching = false;
      },
    });
  }

  addMember(userId: string): void {
    if (!this.groupId) return;

    this.isLoading = true;
    this.groupService.addMember(this.groupId, userId).subscribe({
      next: (group) => {
        this.group = group;
        this.closeAddMemberDialog();
        this.loadGroupData(); // Reload to get updated data
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to add member';
        this.isLoading = false;
      },
    });
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
