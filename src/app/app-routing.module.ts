import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/main/login/login.component';
import { RegisterComponent } from './components/main/register/register.component';
import { ProfileComponent } from './components/main/profile/profile.component';
import { AuthGuard } from './auth.guard';
import { PostsComponent } from './components/main/profile/posts/posts/posts.component';
import { SecureInnerPagesGuard } from './secure-inner-pages.guard';
import { AdminComponent } from './components/features/admin/admin.component';
import { HomeComponent } from './components/features/home/home.component';

const routes: Routes = [
  { 
    path: 'SignIn',  
    component: LoginComponent, 
    canActivate: [SecureInnerPagesGuard],
  },
  { 
    path: 'SignUp', 
    component: RegisterComponent,
    canActivate: [SecureInnerPagesGuard],
  },
  { 
    path: 'profile', 
    component: ProfileComponent, 
    canActivate: [AuthGuard], 
    data: {
      role: ['User', 'Admin'],
    },
    children: [
     {
      path: 'posts' , component: PostsComponent
     } 
    ],
  },
  {
    path: 'Admin',
    component: AdminComponent,
    canActivate: [AuthGuard],
    data: {
      role: ['Admin'],
    },
  },
  {
    path: 'Home', component: HomeComponent
  },
  { path: '', redirectTo: '/Home', pathMatch: 'full' }, // redirect to Home component on root path

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
