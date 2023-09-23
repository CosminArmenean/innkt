import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Register } from '../models/account/register';
import { RegisterJoint } from '../models/account/registerJoint';
import { Observable } from 'rxjs';
import { JwtAuth } from '../models/account/jwtAuth';
import { Login } from '../models/account/login';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService{
  registerUrl = "Identity/Registration"
  loginUrl = "Identity/Login"


  constructor(private http: HttpClient, private router: Router) { }

  public register<T extends Register | RegisterJoint>(user: T): Observable<JwtAuth>{
    return this.http.post<JwtAuth>(`${`${environment.identityApiUrl}`}/${this.registerUrl}`,user);
  }

  public login(user: Login): Observable<JwtAuth>{
    return this.http.post<JwtAuth>(`${`${environment.identityApiUrl}`}/${this.loginUrl}`,user);
  }


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

  getUserProfile(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.get(`${"https://localhost:44383/api/v1.0"}/profile`, { headers });
  }
}
