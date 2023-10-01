import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RegisterJoint } from '../models/account/register-joint';
import { Register } from '../models/account/register';
import { JwtAuth } from '../models/account/jwt-auth';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(@Inject(String) private APIUrl: string, private http: HttpClient) { }

  // Get Method
  getAll(): Observable<any> {
    return this.http.get<any>(this.APIUrl);
  }
  // Get with id Method
  get(id: any): Observable<any> {
    return this.http.get(`${this.APIUrl}/${id}`);
  }
  // Update Method
  Update(data: any): Observable<any> {
    return this.http.put(`${this.APIUrl}`, data);
  }
  // Create Method
  Create(data: any): Observable<any> {
    return this.http.post(this.APIUrl, data);
  }
  register<T extends Register | RegisterJoint>(user: T): Observable<JwtAuth>{
     return this.http.post<JwtAuth>(`${`${environment.identityApiUrl}`}/${this.APIUrl}`,user);
   }

  // Delete Method
  Delete(id: any): Observable<any> {
    return this.http.delete(`${this.APIUrl}/${id}`);
  }
}
