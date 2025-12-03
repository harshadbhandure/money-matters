import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { GroupsComponent } from './components/groups/groups.component';
import { GroupDetailComponent } from './components/group-detail/group-detail.component';
import { ExpensesComponent } from './components/expenses/expenses.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'groups',
    component: GroupsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'groups/:id',
    component: GroupDetailComponent,
    canActivate: [authGuard],
  },
  {
    path: 'groups/:id/expenses',
    component: ExpensesComponent,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
