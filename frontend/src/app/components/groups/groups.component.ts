import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { GroupService } from '../../services/group.service';
import { Group } from '../../models/group.models';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css'],
})
export class GroupsComponent implements OnInit {
  currentUser$;
  groups: Group[] = [];
  isLoading = false;
  showCreateDialog = false;
  newGroupName = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private groupService: GroupService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.isLoading = true;
    this.groupService.getGroups().subscribe({
      next: (groups) => {
        this.groups = groups;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading groups:', error);
        this.isLoading = false;
      },
    });
  }

  openCreateDialog(): void {
    this.showCreateDialog = true;
    this.newGroupName = '';
    this.errorMessage = '';
  }

  closeCreateDialog(): void {
    this.showCreateDialog = false;
    this.newGroupName = '';
    this.errorMessage = '';
  }

  createGroup(): void {
    if (!this.newGroupName.trim()) {
      this.errorMessage = 'Group name is required';
      return;
    }

    this.isLoading = true;
    this.groupService.createGroup({ name: this.newGroupName.trim() }).subscribe({
      next: (group) => {
        this.groups.push(group);
        this.closeCreateDialog();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to create group';
        this.isLoading = false;
      },
    });
  }

  viewGroup(groupId: string): void {
    this.router.navigate(['/groups', groupId]);
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
