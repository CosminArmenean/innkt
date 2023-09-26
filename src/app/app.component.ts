import { Component } from '@angular/core';
import { AuthenticationService } from './services/authentication.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'innkt';
  isLoggedIn!: boolean;
  constructor(private authService : AuthenticationService){}

  ngOnInit(): void {
    // check if the token exist in session storage
    this.isLoggedIn = !!this.authService.getToken();
  }

  //get user Email Method
  getUserName() {
    return this.authService.getUser();
  }
  //Method to logout
  signOut() {
    this.authService.signOut();
  }
}
