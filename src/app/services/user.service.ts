import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { OidcSecurityService } from 'angular-auth-oidc-client';

const APIUrlUser = "http://localhost:8080/api/users";
const loginEndPoint = "Identity/Login";
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
    console.log('Data sign in: ' + data)
    // Set username and password for ROPC flow
    const body = {
      grant_type: 'password',
      username: data.email,
      password: data.password,
    };

    return this.httpPrivate.post(`${`${environment.identityApiUrl}`}/${loginEndPoint}`, body);
  }

  // Login Method
  signInIdentity(data: { email: string, password: string }){
    // Replace 'your_identity_server_url' with the actual URL of your IdentityServer4 instance
    const url = `${environment.identityAuthority}/connect/token`;

    const body = new HttpParams()
      .set('grant_type', 'client_credentials')
      .set('client_id', 'interactive')
      .set('client_secret', 'ClientSecret1')
      .set('scope', 'innkt.read');
      const options = {
        headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
      };
    // Send a request to your IdentityServer4 for authentication
    this.httpPrivate.post(url, body.toString(), options).subscribe(
      (response: any) => {
        // Handle successful authentication
        const accessToken = response.access_token;
        console.log('access: ', accessToken);
        // Store the access token as needed
      },
      (error) => {
        // Handle authentication error
        console.error('Authentication failed:', error);
      }
    ); 
  }
}
