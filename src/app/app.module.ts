import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClient, HttpClientModule, provideHttpClient } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { authInterceptorProviders } from './interceptor/auth.interceptor';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegisterComponent } from './components/main/register/register.component';
import { LoginComponent } from './components/main/login/login.component';
import { ProfileComponent } from './components/main/profile/profile.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PostsComponent } from './components/main/profile/posts/posts/posts.component';
import { AuthenticationService } from './services/authentication.service';
import { AuthGuard } from './guards/auth.guard';
import { MaterialModule } from './material.module';
import { JwtModule } from '@auth0/angular-jwt'; 
import { DataService } from './services/data.service';
import { UserService } from './services/user.service';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { SecureInnerPagesGuard } from './guards/secure-inner-pages.guard';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './components/features/home/home.component';
import { AdminComponent } from './components/features/admin/admin.component';


export function tokenGetter() {
  return sessionStorage.getItem("TOKEN_KEY");
}

@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    LoginComponent,
    ProfileComponent,
    HomeComponent,
    AdminComponent,
    PostsComponent,
  ],
  imports: [
    BrowserModule,    
    AppRoutingModule,  
    BrowserAnimationsModule,    
    ReactiveFormsModule,
    HttpClientModule,
    MaterialModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        allowedDomains: ["localhost:8081"],
        disallowedRoutes: [],
      },
    }),
  ],
  providers: [
    authInterceptorProviders,  
    AuthenticationService,
    DataService,
    UserService,
    {provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher},
    {provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: {duration: 3500}},
  ],
  bootstrap: [AppComponent],
  schemas:[
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class AppModule { }
