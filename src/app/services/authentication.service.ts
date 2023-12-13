import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import jwt_decode from 'jwt-decode';

import { Register } from '../models/account/register';
import { RegisterJoint } from '../models/account/register-joint';
import { Observable, catchError, from, map } from 'rxjs';
import { JwtAuth } from '../models/account/jwt-auth';
import { Login } from '../models/account/login';
import { environment } from 'src/environments/environment';
import { OidcSecurityService } from 'angular-auth-oidc-client';

const TOKEN_KEY = 'TOKEN_KEY';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService{
  registerUrl = "Identity/Registration"
  loginUrl = "Identity/Login"


  constructor(private router: Router, private oidcSecurityService: OidcSecurityService ) { }

  initAuth(): void {
    this.oidcSecurityService.checkAuth().subscribe((auth) => {
      if (!auth) {
        this.oidcSecurityService.authorize();
      }
    });
  }
 
 
  getAccessToken(): Observable<string> {
    return from(this.oidcSecurityService.getAccessToken()).pipe(
      map((token: string | null) => {
        if(token){
          sessionStorage.setItem(TOKEN_KEY, token);
          console.log('Token' + token);
        } else {
          console.warn('Token is null or undefined.');
        }
        return token  || '';
      }),
      catchError((error) => {
        console.error('Error getting access token:', error);
        throw error;
      })
    );        
  }

  clearSessionStorage(): void {
    // Clear the token from session storage
    sessionStorage.removeItem(TOKEN_KEY);
  }

  public saveToken(token : string): void {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.setItem(TOKEN_KEY, token);
  }

  public getToken(): string | null {
    return window.sessionStorage.getItem(TOKEN_KEY) !== null ? window.sessionStorage.getItem(TOKEN_KEY) : null;
  }

  public getUser():string | null{
    const jwtToken = this.getToken();
      const decodedToken: any = this.getToken() != null ? jwt_decode(jwtToken as string) : null;
      const userId = decodedToken != null ? decodedToken?.sub : null;
    return userId;
  }
  public getUserId():string | null{
    const jwtToken = this.getToken();
      const decodedToken: any = this.getToken() != null ? jwt_decode(jwtToken as string) : null;
      const userId = decodedToken != null ? decodedToken?.id : null;
    return userId;
  }
  public getRole(){
    const jwtToken = this.getToken();
      const decodedToken: any = this.getToken() != null ? jwt_decode(jwtToken as string) : null;
      const userRole = decodedToken != null ? decodedToken?.Role : null;
    return userRole;
  }

  signOut(): void {
    window.sessionStorage.clear();
    this.router.navigate(['/Home'])
    .then(() => {
      window.location.reload();
    });
  }



  //public register<T extends Register | RegisterJoint>(user: T): Observable<JwtAuth>{
   // return this.http.post<JwtAuth>(`${`${environment.identityApiUrl}`}/${this.registerUrl}`,user);
  //}

  //public login(user: Login): Observable<JwtAuth>{
  //  return this.http.post<JwtAuth>(`${`${environment.identityApiUrl}`}/${this.loginUrl}`,user);
  //}


  public isLoggedIn(): boolean {
    // Check if the user has a valid JWT token
    const token = localStorage.getItem('token');
    if (token) {
      return true;
    } else {
      return false;
    }
  }

  public redirectToLogin() {
    this.router.navigate(['/login']);
  }

 // getUserProfile(): Observable<any> {
  //  const token = localStorage.getItem('token');
  //  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
 //   return this.http.get(`${"https://localhost:44383/api/v1.0"}/profile`, { headers });
 // }
}
