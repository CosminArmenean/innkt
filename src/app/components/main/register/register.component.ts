import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { Register } from 'src/app/models/account/register';
import { RegisterJoint } from 'src/app/models/account/register-joint';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { UserService } from 'src/app/services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorsStateMatcher } from 'src/app/errorsStateMatcher';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from 'src/app/services/language.service';
import { countries } from 'src/assets/countries/svg/countries';



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
  isSameCredentialsChecked: boolean = true;
  // check the form is submitted or not yet
  isSubmited: boolean = false;
  // hide attribute for the password input
  hide: boolean = true;
  //form group
  registrationForm: FormGroup;
  minDate = 'Jun 15, 2005, 21:43:11 UTC'; //You'll want to change this to UTC or it can mess up your date.
  genders: string[] = [];
  welcome = '';
  months: string[] = [];
  days: number[] = [];
  years: number[] = [];
  countries: any[] = countries;
  selectedCountry: any = null;
  selectedCountryJoint: any = null;


  constructor(
    private authService: AuthenticationService,
    private userService: UserService,
    private _snackBar: MatSnackBar,
    private formBuilder: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private languageService: LanguageService) {
     


    this.registrationForm = new FormGroup(
      {
        firstname: new FormControl('', [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(30),
          Validators.pattern(/^[A-Za-z]+$/),
        ]),
        lastname: new FormControl('', [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(30),
          Validators.pattern(/^[A-Za-z]+$/),
        ]),
        birthMonth: new FormControl(6, [Validators.required]),
        birthDay: new FormControl(15, [Validators.required]),
        birthYear: new FormControl(1990, [Validators.required]),
        selectedCountry: new FormControl('', [
          Validators.required,
        ]),
        mobilePhone: new FormControl('', [
          Validators.required,
          Validators.minLength(7),
          Validators.maxLength(16),
          Validators.pattern(/^\+?\d{1,4}[-.\s]?\d{1,14}$/), // Define your phone number pattern here
        ]),
        email: new FormControl('', [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(50),
          Validators.email,
          Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$'),
        ]),
        gender: new FormControl('male', [Validators.required]),
        password: new FormControl('', [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(100),
          Validators.pattern('(?=.*d)(?=.*[a-z])(?=.*[A-Z]).{8,}'),
        ]),
        confirmPassword: new FormControl('', [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(100),
          Validators.pattern('(?=.*d)(?=.*[a-z])(?=.*[A-Z]).{8,}'),
        ]),
        firstnameJoint: new FormControl('', this.getValidatorsForName()),
        lastnameJoint: new FormControl('', this.getValidatorsForName()),
        emailJoint: new FormControl('', this.getValidatorsForEmail()),
        birthMonthJoint: new FormControl(6, this.getValidatorsForBirthDate()),
        birthDayJoint: new FormControl(15, this.getValidatorsForBirthDate()),
        birthYearJoint: new FormControl(1990, this.getValidatorsForBirthDate()),
        selectedCountryJoint: new FormControl('', this.getValidatorsForBirthDate()),
        mobilePhoneJoint: new FormControl('', this.getValidatorsForMobile()),
        genderJoint: new FormControl('male', this.getValidatorsForBirthDate()),
        passwordJoint: new FormControl('', this.getValidatorsForPassword()),
        confirmPasswordJoint: new FormControl('', this.getValidatorsForPassword()),

        age: new FormControl(),
        ageJoint: new FormControl(),
        birthdateJoint: new FormControl(new Date(this.minDate).toISOString().slice(0, -1)),

        countries: new FormControl(),
        isSameCredentialsChecked: new FormControl(false),

      },
      {
        validators: Validators.compose([
          this.checkPasswordMatch('password', 'confirmPassword'),
          //this.validateForm(),
        ])
        //validators: this.validateForm()       

        //validators: this.passwordMatch('password', 'confirmPassword'),
      }
    );


  }


  // Custom function to get validators for firstnameJoint control
  getValidatorsForName() {
    const validators = [
      Validators.minLength(2),
      Validators.maxLength(30),
      Validators.pattern(/^[A-Za-z]+$/),
    ];

    if (this.registrationType === 'joint') {
      validators.unshift(Validators.required);
    }

    return validators;
  }

  getValidatorsForBirthDate() {
    const validators = [

    ];

    if (this.registrationType === 'joint') {

      validators.unshift(Validators.required);
    }

    return validators;
  }
  getValidatorsForControlRequired() {
    const validators = [

    ];


    if (this.registrationType === 'joint') {


      validators.unshift(Validators.required);
    }

    return validators;
  }

  getValidatorsForEmail() {
    const validators = [
      Validators.minLength(4),
      Validators.maxLength(50),
      Validators.email,
      Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$'),
    ];

    if (this.registrationType === 'joint') {
      if (this.isSameCredentialsChecked === true) {

        return validators;
      }
      validators.unshift(Validators.required);
    }

    return validators;
  }
  getValidatorsForMobile() {
    const validators = [
      Validators.minLength(7),
      Validators.maxLength(16),
      Validators.pattern(/^\+?\d{1,4}[-.\s]?\d{1,14}$/),
    ];

    if (this.registrationType === 'joint') {
      validators.unshift(Validators.required);
    }


    return validators;
  }

  getValidatorsForPassword() {
    const validators = [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(100),
      Validators.pattern('(?=.*d)(?=.*[a-z])(?=.*[A-Z]).{8,}'),
    ];

    if (this.registrationType === 'single') {
      validators.shift();
    }
    if (this.registrationType === 'joint') {
      if (this.isSameCredentialsChecked === true) {

        return validators;
      }
      validators.unshift(Validators.required);
    }

    return validators;
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
    // Fetch the months data in the user's language
    this.languageService.getMonths().subscribe((data) => {
      // Convert the object into an array of key-value pairs
      let monthsArray = Object.entries(data);
      // Custom sorting function to sort by key (index)  
      this.months = data;
      monthsArray.sort((a, b) => this.compareNumericKeys(a[0], b[0]));
      this.months = monthsArray.map((entry) => entry[1]);

      this.days = Array.from({ length: 31 }, (_, i) => i + 1);
      const currentYear = new Date().getFullYear();
      this.years = Array.from({ length: 100 }, (_, i) => currentYear - i);

      console.log(this.months);
      console.log(this.days);
      console.log(this.years);
    });

    // Fetch the months data in the user's language
    this.languageService.getGenders().subscribe((data) => {

      const gendersArray = Object.entries(data);
      this.genders = data;
      console.log(this.genders);

      this.isSameCredentialsChecked = true;

    });




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

  onCheckboxChange() {
    this.isSameCredentialsChecked = !this.isSameCredentialsChecked;

    // Trigger a new change detection cycle
    this.cdRef.detectChanges();
    // Enable or disable required validator based on the condition
    if (!this.isSameCredentialsChecked) {
      this.registrationForm.get('selectedCountryJoint')?.clearValidators();
      this.registrationForm.get('mobilePhoneJoint')?.clearValidators();
      this.registrationForm.get('emailJoint')?.clearValidators();
      this.registrationForm.get('passwordJoint')?.clearValidators();
      this.registrationForm.get('confirmPasswordJoint')?.clearValidators();
    } else {
      this.registrationForm.get('selectedCountryJoint')?.setValidators(this.getValidatorsForBirthDate());
      this.registrationForm.get('mobilePhoneJoint')?.setValidators(this.getValidatorsForMobile());
      this.registrationForm.get('emailJoint')?.setValidators(this.getValidatorsForEmail());
      this.registrationForm.get('passwordJoint')?.setValidators(this.getValidatorsForPassword());
      this.registrationForm.get('confirmPasswordJoint')?.setValidators(this.getValidatorsForPassword());
    }

    // Update the form controls
    this.registrationForm.get('selectedCountryJoint')?.updateValueAndValidity();
    this.registrationForm.get('mobilePhoneJoint')?.updateValueAndValidity();
    this.registrationForm.get('emailJoint')?.updateValueAndValidity();
    this.registrationForm.get('passwordJoint')?.updateValueAndValidity();
    this.registrationForm.get('confirmPasswordJoint')?.updateValueAndValidity();
  }

  // Define a custom sorting function to sort by numeric key
  compareNumericKeys(a: string, b: string): number {
    const keyA = parseInt(a, 10);
    const keyB = parseInt(b, 10);

    return keyA - keyB;
  }
  onCountrySelectionChange(event: any): void {
    this.selectedCountry = event.value;
  }
  onCountryJointSelectionChange(event: any): void {
    this.selectedCountryJoint = event.value;
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
  get birthMonth() {
    return this.registrationForm.get('birthMonth');
  }
  get birthDay() {
    return this.registrationForm.get('birthDay');
  }
  get birthYear() {
    return this.registrationForm.get('birthYear');
  }
  get birthMonthJoint() {
    return this.registrationForm.get('birthMonth');
  }
  get birthDayJoint() {
    return this.registrationForm.get('birthDay');
  }
  get birthYearJoint() {
    return this.registrationForm.get('birthYear');
  }
  get birthdateJoint() {
    return this.registrationForm.get('birthdateJoint');
  }
  get gender() {
    return this.registrationForm.get('gender');
  }
  get country() {
    return this.registrationForm.get('country');
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

    if (this.registrationType === 'single') {
      console.log(this.registrationType);
      if (this.registrationForm.valid) {
        this.registerDto.firstname = this.registrationForm.value.firstname;
        this.registerDto.lastname = this.registrationForm.value.lastname;
        this.registerDto.birthdate.parse = this.getBirthDate().getUTCDate;
        console.log(this.registerDto.birthdate);

      }


      this.userService.Create(this.registerDto).subscribe(() => {
        this._snackBar.open('Your account has been created successfully', '✔️');
        setTimeout(() => (window.location.href = '/SignIn'), 2000);
      });
    }
    else if (this.registrationType === 'joint') {
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

  private checkPasswordMatch(password: string, confirmPassword: string): ValidatorFn {
    return (formGroup: AbstractControl) => {
      const control = formGroup.get(password);
      const matchingControl = formGroup.get(confirmPassword);

      if (!control || !matchingControl) {
        return null;
      }

      const controlValue = control.value;
      const matchingControlValue = matchingControl.value;

      if (controlValue !== matchingControlValue) {
        matchingControl.setErrors({ passwordMismatch: true });
      } else {
        matchingControl.setErrors(null);
      }
      return null;
    };
  }

  passwordStrengthValidator = (control: AbstractControl): ValidationErrors | null => {
    const passwordtyped = this.registrationForm.get('password');

    if (passwordtyped != null && passwordtyped.value.length < 8) {
      return { passwordStrength: true };
    }

    return null;
  };


  conditionalRequiredValidator(controlName: string): ValidatorFn {
    return (control: AbstractControl) => {
      if (this.registrationType === 'single') {
        const controlForm = control.get(controlName);






      }

      return null;
    }
  }




  getBirthDate(): Date {
    // Handle the selected date
    if (this.registrationForm.valid) {
      const birthdate = new Date(this.registrationForm.value.birthYear, this.months.indexOf(this.registrationForm.value.birthMonth), this.registrationForm.value.birthDay);
      console.log('Selected Date:', birthdate);
      return birthdate;
    } else {
      this._snackBar.open('Birth Date information not valid!', '❌');
      return new Date;
    }
  }


  calculateAge(): number {
    const birthDate = new Date(
      this.registrationForm.get('birthYear')?.value,
      this.registrationForm.get('birthMonth')?.value - 1, // Month is 0-based
      this.registrationForm.get('birthDay')?.value
    );
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }

    return age;
  }

}


function compareStrings(a: string, b: string): number {
  throw new Error('Function not implemented.');
}



