import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AuthService, RegisterRequest, JointAccountRequest } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatCheckboxModule,
    MatExpansionModule,
    TranslateModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  jointAccountForm: FormGroup;
  isLoading = false;
  showJointAccount = false;

  languages = [
    { code: 'en', name: 'English' },
    { code: 'he', name: 'עברית' },
    { code: 'ar', name: 'العربية' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      emailConfirmation: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirmation: ['', [Validators.required]],
      language: ['en', Validators.required],
      isJointAccount: [false],
      acceptTerms: [false, Validators.requiredTrue],
      acceptPrivacyPolicy: [false, Validators.requiredTrue],
      acceptMarketing: [false],
      acceptCookies: [false]
    }, { validators: this.passwordMatchValidator });

    this.jointAccountForm = this.fb.group({
      secondUserFirstName: ['', [Validators.required, Validators.minLength(2)]],
      secondUserLastName: ['', [Validators.required, Validators.minLength(2)]],
      secondUserPassword: ['', [Validators.required, Validators.minLength(8)]],
      secondUserPasswordConfirmation: ['', [Validators.required]],
      secondUserCountryCode: [''],
      secondUserMobilePhone: [''],
      secondUserBirthDate: [''],
      secondUserGender: ['']
    }, { validators: this.jointPasswordMatchValidator });

    // Watch for joint account checkbox changes
    this.registerForm.get('isJointAccount')?.valueChanges.subscribe(show => {
      this.showJointAccount = show;
      if (show) {
        this.jointAccountForm.enable();
      } else {
        this.jointAccountForm.disable();
      }
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const passwordConfirmation = form.get('passwordConfirmation');
    
    if (password && passwordConfirmation && password.value !== passwordConfirmation.value) {
      passwordConfirmation.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  private jointPasswordMatchValidator(form: FormGroup) {
    const password = form.get('secondUserPassword');
    const passwordConfirmation = form.get('secondUserPasswordConfirmation');
    
    if (password && passwordConfirmation && password.value !== passwordConfirmation.value) {
      passwordConfirmation.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onSubmit() {
    if (this.registerForm.valid && (!this.showJointAccount || this.jointAccountForm.valid)) {
      this.isLoading = true;

      const registerData: RegisterRequest = {
        firstName: this.registerForm.get('firstName')?.value,
        lastName: this.registerForm.get('lastName')?.value,
        email: this.registerForm.get('email')?.value,
        password: this.registerForm.get('password')?.value,
        language: this.registerForm.get('language')?.value,
        isJointAccount: this.registerForm.get('isJointAccount')?.value,
        acceptTerms: this.registerForm.get('acceptTerms')?.value,
        acceptPrivacyPolicy: this.registerForm.get('acceptPrivacyPolicy')?.value,
        acceptMarketing: this.registerForm.get('acceptMarketing')?.value,
        acceptCookies: this.registerForm.get('acceptCookies')?.value
      };

      if (this.showJointAccount) {
        registerData.jointAccount = {
          secondUserFirstName: this.jointAccountForm.get('secondUserFirstName')?.value,
          secondUserLastName: this.jointAccountForm.get('secondUserLastName')?.value,
          secondUserPassword: this.jointAccountForm.get('secondUserPassword')?.value,
          secondUserPasswordConfirmation: this.jointAccountForm.get('secondUserPasswordConfirmation')?.value,
          secondUserCountryCode: this.jointAccountForm.get('secondUserCountryCode')?.value,
          secondUserMobilePhone: this.jointAccountForm.get('secondUserMobilePhone')?.value,
          secondUserBirthDate: this.jointAccountForm.get('secondUserBirthDate')?.value,
          secondUserGender: this.jointAccountForm.get('secondUserGender')?.value
        };
      }

      this.authService.register(registerData).then(success => {
        this.isLoading = false;
        if (success) {
          this.router.navigate(['/dashboard']);
        } else {
          console.error('Registration failed');
        }
      }).catch(error => {
        this.isLoading = false;
        console.error('Registration error:', error);
      });
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('minlength')) {
      return `Minimum length is ${control.errors?.['minlength'].requiredLength} characters`;
    }
    if (control?.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }

  getJointAccountErrorMessage(controlName: string): string {
    const control = this.jointAccountForm.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('minlength')) {
      return `Minimum length is ${control.errors?.['minlength'].requiredLength} characters`;
    }
    if (control?.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }
}
