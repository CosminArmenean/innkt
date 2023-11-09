import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { OidcSecurityService } from 'angular-auth-oidc-client';

const APIUrlUser = "http://localhost:8080/api/users";
const loginEndPoint = "Identity/login";
@Injectable({
  providedIn: 'root'
})
export class UserService extends DataService {

  constructor(
    http: HttpClient, 
    private httpPrivate: HttpClient,
    private oidcSecurityService: OidcSecurityService) {
    super(APIUrlUser, http);
  }
 
  // Login Method
  signIn(data: { email: string, password: string }): Observable<any> {
    console.log(data)
    // Set username and password for ROPC flow
    const body = {
      grant_type: 'password',
      username: data.email,
      password: data.password,
    };

    return this.httpPrivate.post(`${`${environment.identityApiUrl}`}/${loginEndPoint}`, body);
  }
}
