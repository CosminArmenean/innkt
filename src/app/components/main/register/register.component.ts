import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Register } from 'src/app/models/account/register';
import { RegisterJoint } from 'src/app/models/account/registerJoint';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registrationForm: FormGroup;
  registrationType: 'single' | 'joint' = 'single'; // Default to single registration
  registerDto: Register = new Register;
  registerJointDto: RegisterJoint = new RegisterJoint;


  constructor(private authService: AuthenticationService, private router: Router, public registerForm:FormBuilder) {
    this.registrationForm = this.registerForm.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

  }

  ngOnInit(): void {}

  Register<T extends Register | RegisterJoint>(dto:T){
    if(this.registrationType === 'single'){
      this.authService.register(dto).subscribe((response) => {
        //handle response
      });
    } else if(this.registrationType === 'joint'){
      this.authService.register(dto).subscribe((response) => {
        //handle response
      });
    }
  }
    

}
