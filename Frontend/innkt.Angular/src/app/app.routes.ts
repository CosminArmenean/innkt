import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'posts',
    loadComponent: () => import('./components/posts/post-list/post-list.component').then(m => m.PostListComponent)
  },
  {
    path: 'posts/create',
    loadComponent: () => import('./components/posts/post-create/post-create.component').then(m => m.PostCreateComponent)
  },
  {
    path: 'search',
    loadComponent: () => import('./components/search/search.component').then(m => m.SearchComponent)
  },
  {
    path: 'chat',
    loadComponent: () => import('./components/chat/chat.component').then(m => m.ChatComponent)
  },
  {
    path: 'security',
    loadComponent: () => import('./components/security/security-dashboard/security-dashboard.component').then(m => m.SecurityDashboardComponent)
  },
  {
    path: 'security-test',
    loadComponent: () => import('./components/security/security-test/security-test.component').then(m => m.SecurityTestComponent)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
