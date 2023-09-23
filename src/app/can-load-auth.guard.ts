import { Injectable } from '@angular/core';
import { CanLoad, CanMatchFn, Route, UrlSegment } from '@angular/router';
import { AuthenticationService } from './services/authentication.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CanLoadAuthGuard implements CanLoad {
  constructor(private authService: AuthenticationService) {}

  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (this.authService.isLoggedIn()) {
      return true; // Module can be loaded
    } else {
      // User is not logged in, prevent module loading
      return false;
    }
  }
}