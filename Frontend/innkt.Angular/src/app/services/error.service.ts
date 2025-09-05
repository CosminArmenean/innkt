import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiError } from '../interceptors/error.interceptor';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  constructor(private snackBar: MatSnackBar) {}

  handleError(error: ApiError | string, duration: number = 5000): void {
    let message: string;
    let action: string = 'Close';

    if (typeof error === 'string') {
      message = error;
    } else {
      message = error.message;
      
      // Customize action based on error type
      if (error.statusCode === 401) {
        action = 'Login';
      } else if (error.statusCode === 403) {
        action = 'OK';
      } else if (error.statusCode >= 500) {
        action = 'Retry';
      }
    }

    this.snackBar.open(message, action, {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: this.getPanelClass(error)
    });
  }

  showSuccess(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['success-snackbar']
    });
  }

  showWarning(message: string, duration: number = 4000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['warning-snackbar']
    });
  }

  showInfo(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['info-snackbar']
    });
  }

  private getPanelClass(error: ApiError | string): string[] {
    if (typeof error === 'string') {
      return ['info-snackbar'];
    }

    const baseClass = 'error-snackbar';
    const statusClass = `status-${error.statusCode}`;
    
    return [baseClass, statusClass];
  }

  // Handle specific error types
  handleAuthError(error: ApiError): void {
    if (error.statusCode === 401) {
      this.handleError('Session expired. Please log in again.', 8000);
    } else if (error.statusCode === 403) {
      this.handleError('Access denied. You don\'t have permission to perform this action.', 6000);
    } else {
      this.handleError(error);
    }
  }

  handleValidationError(error: ApiError): void {
    if (error.errors && error.errors.length > 0) {
      const errorMessage = error.errors.join('\n');
      this.handleError(`Validation errors:\n${errorMessage}`, 8000);
    } else {
      this.handleError(error);
    }
  }

  handleNetworkError(error: ApiError): void {
    if (error.statusCode === 0 || error.statusCode >= 500) {
      this.handleError('Network error. Please check your connection and try again.', 6000);
    } else {
      this.handleError(error);
    }
  }
}






