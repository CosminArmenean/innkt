import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { JwtAuth } from 'src/app/models/account/jwt-auth';
import { Login } from 'src/app/models/account/login';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { HttpClient } from '@angular/common/http';
import { UserService } from 'src/app/services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ErrorsStateMatcher } from 'src/app/errorsStateMatcher';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginDto: Login = new Login;
  jwtDto: JwtAuth = new JwtAuth;

  constructor(private authService: AuthenticationService, private userService: UserService, private _snackBar: MatSnackBar, private router: Router) {}




//login(loginDto: Login ) {
 // this.authService.login(loginDto).subscribe((jwtDto) => {
 //   // Store the JWT token in local storage
 //   localStorage.setItem('jwtToken', this.jwtDto.token);
//
 //   // Redirect to a protected route
 //   this.router.navigate(['/profile']);
 // });
//}
//Declaration
  //Check the form is submitted or not yet
  isSubmited: boolean = false;
  //Hide attribute for the password input
  hide: boolean = true;
  //Login is failed case
  isLoginFailed = false;
  //To display Login Error in case of failure
  errorMessage = '';

  //form validators
  form: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),
  });

  //get all Form Fields
  get email() {
    return this.form.get('email');
  }
  get password() {
    return this.form.get('password');
  }
  // match errors in the submition of form
  matcher = new ErrorsStateMatcher();
  // submit fntc
  onSubmit() {
    const LoginInfo = {
      email: this.email?.value,
      password: this.password?.value,
    };
    if (this.form.valid) {
      this.userService.signIn(LoginInfo).subscribe({
        next: (data: any) => {
          this.authService.saveToken(data.token);
          this.isLoginFailed = false;
          window.location.reload();
        },
        error: (err: Error) => {
          this.errorMessage = err.message;
          this.isLoginFailed = true;
          this._snackBar.open(this.errorMessage, '❌');
        },
      });
    } else {
      this._snackBar.open('Enter a valid informations !!!', '❌');
    }
  }
}