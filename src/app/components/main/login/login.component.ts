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
import { TranslateService } from '@ngx-translate/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  isContainerLayout = true;
  loginForm: FormGroup;
  loginDto: Login = new Login;
  jwtDto: JwtAuth = new JwtAuth;

  constructor(
    private authService: AuthenticationService,
    private userService: UserService,
    private translateService: TranslateService,
    private _snackBar: MatSnackBar,
    private router: Router) {
    //form validators
    this.loginForm = new FormGroup({
      emailPhone: new FormControl('', [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(50),
        Validators.pattern(/^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$|^[0-9]{7,15}$/)
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100),
        Validators.pattern('(?=.*d)(?=.*[a-z])(?=.*[A-Z]).{8,}'),
      ]),
    });

  }




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



  //get all Form Fields
  get emailPhone() {
    return this.loginForm.get('emailPhone');
  }
  get password() {
    return this.loginForm.get('password');
  }


  ngOnInit(): void {

  }
  // match errors in the submition of form
  matcher = new ErrorsStateMatcher();
  // submit fntc
  onSubmit() {
    // Clear existing tokens (optional)   
    const loginInfo = {
      email: this.emailPhone?.value,
      password: this.password?.value,
    };
   
    if (this.loginForm.valid) {
      this.userService.signIn(loginInfo).subscribe({
        next: (data: any) => {
          this.authService.saveToken(data.token);
          console.log(data.token);
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
      const messageInvalid = this.translateService.instant('snackbar.invalidInformations');
      this._snackBar.open(messageInvalid, '❌');
    }
  }
}