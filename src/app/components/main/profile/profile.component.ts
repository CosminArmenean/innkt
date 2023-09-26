import { Component } from '@angular/core';
import { User } from 'src/app/models/user/user';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
 //save userId in a varibale
 userId: string = '';
 userInfo: User = new User();
 constructor(
   private userService: UserService,
   private authService: AuthenticationService
 ) {
   this.userId = this.authService.getUserId() as string;
   this.refreshProfile();
 }

 //get User Info
 refreshProfile() {
   this.userService.get(this.userId).subscribe((response: User) => {
     this.userInfo = response;
   });
 }
}
