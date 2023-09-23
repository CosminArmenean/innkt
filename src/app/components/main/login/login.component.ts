import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { JwtAuth } from 'src/app/models/account/jwtAuth';
import { Login } from 'src/app/models/account/login';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit{
  loginDto: Login = new Login;
  jwtDto: JwtAuth = new JwtAuth;

  constructor(private authService: AuthenticationService, private router: Router) {}

ngOnInit(): void {
  
}


login(loginDto: Login ) {
  this.authService.login(loginDto).subscribe((jwtDto) => {
    // Store the JWT token in local storage
    localStorage.setItem('jwtToken', this.jwtDto.token);

    // Redirect to a protected route
    this.router.navigate(['/profile']);
  });
}
}
