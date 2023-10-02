import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Register } from 'src/app/models/account/register';
import { RegisterJoint } from 'src/app/models/account/register-joint';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { UserService } from 'src/app/services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorsStateMatcher } from 'src/app/errorsStateMatcher';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from 'src/app/services/language.service'; 

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  isContainerLayout = true;
  isRtlLayout: boolean = false;
  registrationType: 'single' | 'joint' = 'single'; // Default to single registration
  registerDto: Register = new Register;
  registerJointDto: RegisterJoint = new RegisterJoint;
  isSameCredentialsChecked: boolean = false;
  // check the form is submitted or not yet
  isSubmited: boolean = false;
  // hide attribute for the password input
  hide: boolean = true;
  //form group
  registrationForm : FormGroup;
  minDate = 'Jun 15, 2005, 21:43:11 UTC'; //You'll want to change this to UTC or it can mess up your date.
  genders = ['male', 'female']; 
  welcome = '';


  constructor(
    private authService: AuthenticationService, 
    private userService:UserService, 
    private _snackBar:MatSnackBar, 
    private formBuilder: FormBuilder, 
    private translateService: TranslateService, 
    private languageService: LanguageService) {  
    
    this.registrationForm = new FormGroup(
      {
        firstname: new FormControl('', [
          Validators.required,
          Validators.minLength(4),
        ]),
        lastname: new FormControl('', [
          Validators.required,
          Validators.minLength(4),
        ]),
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern('(?=.*d)(?=.*[a-z])(?=.*[A-Z]).{8,}'),
        ]),
        confirmPassword: new FormControl('', [Validators.required]),
        firstnameJoint: new FormControl('', [
          Validators.required,
          Validators.minLength(4),
        ]),
        lastnameJoint: new FormControl('', [
          Validators.required,
          Validators.minLength(4),
        ]),
        emailJoint: new FormControl('', [Validators.required, Validators.email]),
        passwordJoint: new FormControl('', [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern('(?=.*d)(?=.*[a-z])(?=.*[A-Z]).{8,}'),
        ]),
        confirmPasswordJoint: new FormControl('', [Validators.required]),    
        birthdate: new FormControl<string>(new Date(this.minDate).toISOString().slice(0, -1)),
        birthdateJoint: new FormControl(new Date(this.minDate).toISOString().slice(0, -1)),
        gender: new FormControl<string>('male', [Validators.required]),
        genderJoint: new FormControl<string>('male',[Validators.required]),
        mobilePhone : new FormControl('', [
          Validators.required,
          Validators.pattern(/^\+?\d{1,4}[-.\s]?\d{1,14}$/), // Define your phone number pattern here
        ]),
        mobilePhoneJoint : new FormControl('', [
          Validators.required,
          Validators.pattern(/^\+?\d{1,4}[-.\s]?\d{1,14}$/), // Define your phone number pattern here
        ]),
      },
      {
        validators: this.passwordMatch('password', 'confirmPassword'),
      }
    );
  
     this.translateService.use('ar-AR');
  }

  ngOnInit(): void {
    this.translateService.get('welcome').subscribe(translation => {
      this.welcome = translation;
  });
  // Subscribe to language changes
  this.languageService.selectedLanguage$.subscribe((language) => {
    // Check if the language is RTL (you can implement this logic)
    this.isRtlLayout = this.languageService.isRtlLanguage();
  });
    this.translateService.use('ar-AR');
  }
  //Register<T extends Register | RegisterJoint>(dto:T){
  //  if(this.registrationType === 'single'){
  //    this.authService.register(dto).subscribe((response) => {
  //      //handle response
  //    });
  //  } else if(this.registrationType === 'joint'){
  //    this.authService.register(dto).subscribe((response) => {
  //      //handle response
  //    });
  //  }
  //}
  setRegistrationType(type: 'single' | 'joint') {
    this.registrationType = type;
  }  

  onCheckboxChange(event: any) {
    this.isSameCredentialsChecked = event.target.checked; // Update the property with the checkbox state
  }

  


  //get all Form Fields
  get firstname() {
    return this.registrationForm.get('firstname');
  }
  get lastname() {
    return this.registrationForm.get('lastname');
  }
  get email() {
    return this.registrationForm.get('email');
  }
  get password() {
    return this.registrationForm.get('password');
  }
  get confirmPassword() {
    return this.registrationForm.get('confirmPassword');
  }
  get firstnameJoint() {
    return this.registrationForm.get('firstnameJoint');
  }
  get lastnameJoint() {
    return this.registrationForm.get('lastnameJoint');
  }
  get emailJoint() {
    return this.registrationForm.get('emailJoint');
  }
  get passwordJoint() {
    return this.registrationForm.get('passwordJoint');
  }
  get confirmPasswordJoint() {
    return this.registrationForm.get('confirmPasswordJoint');
  }
  get birthdate() {
    return this.registrationForm.get('birthdate');
  }
  get birthdateJoint() {
    return this.registrationForm.get('birthdateJoint');
  }
  get gender() {
    return this.registrationForm.get('gender');
  }
  get genderJoint() {
    return this.registrationForm.get('genderJoint');
  }
  get mobilePhone() {
    return this.registrationForm.get('mobilePhone');
  }
  get mobilePhoneJoint() {
    return this.registrationForm.get('mobilePhoneJoint');
  }
  
  // match errors in the submition of form
  matcher = new ErrorsStateMatcher();
  // submit fntc
  onSubmit() {

    
    if(this.registrationType === 'single'){
      console.log(this.registrationType);
      this.userService.Create(this.registerDto).subscribe(() => {
        this._snackBar.open('Your account has been created successfully', '✔️');
        setTimeout(() => (window.location.href = '/SignIn'), 2000);
      });
    }
    else if(this.registrationType === 'joint'){
      this.userService.Create(this.registerJointDto).subscribe(() => {
        this._snackBar.open('Your account has been created successfully', '✔️');
        setTimeout(() => (window.location.href = '/SignIn'), 2000);
      });
    }
    // TODO: Use EventEmitter with form value
    this.isSubmited = true;
    if (!this.registrationForm.invalid) {
      const user = {
        firstname: this.firstname?.value,
        lastname: this.lastname?.value,
        email: this.email?.value,
        password: this.password?.value,
        admin: false,
      };
      console.log(user);
      console.log(this.registerDto);
      console.log(this.registerJointDto);
      
    } else {
      console.log(this.registrationForm);
      this._snackBar.open('Enter valid informations !!!', '❌');
    }
  }

  // check the password and confirm password are matched or not
  passwordMatch(password: string, confirmPassword: string) {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const passwordControl = formGroup.get(password);
      const confirmPasswordControl = formGroup.get(confirmPassword);
      if (!passwordControl || !confirmPasswordControl) {
        return null;
      }
      if (
        confirmPasswordControl.errors &&
        !confirmPasswordControl.errors['passwordMismatch']
      ) {
        return null;
      }
      if (passwordControl.value !== confirmPasswordControl.value) {
        confirmPasswordControl.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        confirmPasswordControl.setErrors(null);
        return null;
      }
    };
  }
}
