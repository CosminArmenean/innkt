import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/main/login/login.component';
import { RegisterComponent } from './components/main/register/register.component';
import { ProfileComponent } from './components/main/profile/profile.component';
import { AuthGuard } from './auth.guard';
import { PostsComponent } from './components/main/profile/posts/posts/posts.component';
import { AuthChildGuard } from './auth-child.guard';

const routes: Routes = [
  { path: 'login',  component: LoginComponent},
  { path: 'register', component: RegisterComponent},
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard], 
    children: [
     {
      path: 'posts' , component: PostsComponent, canActivateChild: [AuthChildGuard]
     } 
    ]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
