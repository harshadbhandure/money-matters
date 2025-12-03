import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Group,
  CreateGroupRequest,
  Expense,
  CreateExpenseRequest,
  Balance,
} from '../models/group.models';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // Group APIs
  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.apiUrl}/groups`);
  }

  getGroup(groupId: string): Observable<Group> {
    return this.http.get<Group>(`${this.apiUrl}/groups/${groupId}`);
  }

  createGroup(data: CreateGroupRequest): Observable<Group> {
    return this.http.post<Group>(`${this.apiUrl}/groups`, data);
  }

  addMember(groupId: string, userId: string): Observable<Group> {
    return this.http.post<Group>(`${this.apiUrl}/groups/${groupId}/members`, {
      userId,
    });
  }

  // Expense APIs
  getGroupExpenses(groupId: string): Observable<Expense[]> {
    return this.http.get<Expense[]>(
      `${this.apiUrl}/groups/${groupId}/expenses`
    );
  }

  createExpense(
    groupId: string,
    data: CreateExpenseRequest
  ): Observable<Expense> {
    return this.http.post<Expense>(
      `${this.apiUrl}/groups/${groupId}/expenses`,
      data
    );
  }

  // Balance API
  getGroupBalances(groupId: string): Observable<Balance[]> {
    return this.http.get<Balance[]>(
      `${this.apiUrl}/groups/${groupId}/balances`
    );
  }
}
