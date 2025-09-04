import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: string[];
  timestamp?: string;
}

export const ErrorInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      let apiError: ApiError;

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        apiError = {
          message: 'A client-side error occurred',
          statusCode: 0,
          errors: [error.error.message]
        };
      } else {
        // Server-side error
        const errorResponse = error.error;
        apiError = {
          message: errorResponse?.message || error.message || 'An error occurred',
          statusCode: error.status,
          errors: errorResponse?.errors || [],
          timestamp: new Date().toISOString()
        };

        // Handle specific HTTP status codes
        switch (error.status) {
          case 400:
            apiError.message = 'Bad request. Please check your input.';
            break;
          case 401:
            apiError.message = 'Unauthorized. Please log in again.';
            break;
          case 403:
            apiError.message = 'Access forbidden. You don\'t have permission to perform this action.';
            break;
          case 404:
            apiError.message = 'Resource not found.';
            break;
          case 409:
            apiError.message = 'Conflict. The resource already exists or cannot be created.';
            break;
          case 422:
            apiError.message = 'Validation failed. Please check your input.';
            break;
          case 429:
            apiError.message = 'Too many requests. Please try again later.';
            break;
          case 500:
            apiError.message = 'Internal server error. Please try again later.';
            break;
          case 502:
            apiError.message = 'Bad gateway. Service temporarily unavailable.';
            break;
          case 503:
            apiError.message = 'Service unavailable. Please try again later.';
            break;
          default:
            apiError.message = 'An unexpected error occurred.';
        }
      }

      // Log error for debugging (in production, this would go to a logging service)
      console.error('API Error:', apiError);

      // You could also emit this error to a global error service
      // this.errorService.handleError(apiError);

      return throwError(() => apiError);
    })
  );
};
