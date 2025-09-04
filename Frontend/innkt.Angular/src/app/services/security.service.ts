import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SecurityConfig {
  enableTwoFactor: boolean;
  requireStrongPassword: boolean;
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  enableAuditLog: boolean;
  enableRateLimiting: boolean;
  allowedOrigins: string[];
}

export interface SecurityEvent {
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'permission_denied' | 'suspicious_activity';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  name: string;
  permissions: Permission[];
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private securityConfig: SecurityConfig = {
    enableTwoFactor: true,
    requireStrongPassword: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    enableAuditLog: true,
    enableRateLimiting: true,
    allowedOrigins: ['localhost', '127.0.0.1']
  };

  private securityEventsSubject = new BehaviorSubject<SecurityEvent[]>([]);
  private rolesSubject = new BehaviorSubject<Role[]>([]);
  private currentUserPermissionsSubject = new BehaviorSubject<Permission[]>([]);
  private loginAttemptsSubject = new BehaviorSubject<Map<string, number>>(new Map());

  public securityEvents$ = this.securityEventsSubject.asObservable();
  public roles$ = this.rolesSubject.asObservable();
  public currentUserPermissions$ = this.currentUserPermissionsSubject.asObservable();

  constructor() {
    this.initializeSecurity();
  }

  // Initialize security
  private initializeSecurity() {
    this.loadDefaultRoles();
    this.startSessionMonitoring();
    this.startSecurityMonitoring();
  }

  // Load default roles
  private loadDefaultRoles() {
    const defaultRoles: Role[] = [
      {
        name: 'admin',
        permissions: [
          { resource: '*', action: '*' },
          { resource: 'users', action: 'manage' },
          { resource: 'posts', action: 'moderate' },
          { resource: 'analytics', action: 'view' }
        ],
        description: 'Full system access'
      },
      {
        name: 'moderator',
        permissions: [
          { resource: 'posts', action: 'moderate' },
          { resource: 'users', action: 'view' },
          { resource: 'reports', action: 'handle' }
        ],
        description: 'Content moderation access'
      },
      {
        name: 'user',
        permissions: [
          { resource: 'posts', action: 'create' },
          { resource: 'posts', action: 'read' },
          { resource: 'profile', action: 'manage' },
          { resource: 'chat', action: 'use' }
        ],
        description: 'Standard user access'
      },
      {
        name: 'guest',
        permissions: [
          { resource: 'posts', action: 'read' },
          { resource: 'search', action: 'use' }
        ],
        description: 'Limited read-only access'
      }
    ];

    this.rolesSubject.next(defaultRoles);
  }

  // Start session monitoring
  private startSessionMonitoring() {
    setInterval(() => {
      this.checkSessionTimeout();
    }, 60000); // Check every minute
  }

  // Start security monitoring
  private startSecurityMonitoring() {
    // Monitor for suspicious activity
    this.monitorSuspiciousActivity();
    
    // Monitor for rate limiting violations
    this.monitorRateLimiting();
  }

  // Check session timeout
  private checkSessionTimeout() {
    const lastActivity = localStorage.getItem('lastActivity');
    if (lastActivity) {
      const lastActivityTime = new Date(lastActivity).getTime();
      const currentTime = Date.now();
      const timeoutMs = this.securityConfig.sessionTimeout * 60 * 1000;
      
      if (currentTime - lastActivityTime > timeoutMs) {
        this.handleSessionTimeout();
      }
    }
  }

  // Handle session timeout
  private handleSessionTimeout() {
    this.logSecurityEvent({
      type: 'logout',
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      details: 'Session timeout',
      severity: 'medium'
    });
    
    // Clear user session
    this.clearUserSession();
    
    // Redirect to login
    window.location.href = '/login?timeout=true';
  }

  // Monitor suspicious activity
  private monitorSuspiciousActivity() {
    // Monitor for multiple failed login attempts
    this.loginAttempts$.subscribe(attempts => {
      attempts.forEach((count, userId) => {
        if (count >= this.securityConfig.maxLoginAttempts) {
          this.handleSuspiciousActivity(userId, 'Multiple failed login attempts');
        }
      });
    });
  }

  // Monitor rate limiting
  private monitorRateLimiting() {
    if (!this.securityConfig.enableRateLimiting) return;
    
    // Implement rate limiting logic here
    // This would typically track API calls per user/IP and block excessive requests
  }

  // Handle suspicious activity
  private handleSuspiciousActivity(userId: string, details: string) {
    this.logSecurityEvent({
      type: 'suspicious_activity',
      userId,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      details,
      severity: 'high'
    });
    
    // Block user account temporarily
    this.blockUserAccount(userId);
  }

  // Block user account
  private blockUserAccount(userId: string) {
    // This would typically call the backend to block the account
    console.warn(`User account ${userId} has been blocked due to suspicious activity`);
  }

  // Log security event
  logSecurityEvent(event: SecurityEvent) {
    if (!this.securityConfig.enableAuditLog) return;
    
    const currentEvents = this.securityEventsSubject.value;
    this.securityEventsSubject.next([...currentEvents, event]);
    
    // Send to security backend
    this.sendToSecurityBackend(event);
    
    // Log to console in development
    if (event.severity === 'critical' || event.severity === 'high') {
      console.warn('Security Event:', event);
    }
  }

  // Send to security backend
  private async sendToSecurityBackend(event: SecurityEvent) {
    try {
      await fetch('/api/security/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.warn('Failed to send security event:', error);
    }
  }

  // Check permission
  hasPermission(resource: string, action: string, userId?: string): boolean {
    const permissions = this.currentUserPermissionsSubject.value;
    
    return permissions.some(permission => {
      // Check wildcard permissions
      if (permission.resource === '*' && permission.action === '*') {
        return true;
      }
      
      if (permission.resource === '*' && permission.action === action) {
        return true;
      }
      
      if (permission.resource === resource && permission.action === '*') {
        return true;
      }
      
      // Check exact match
      if (permission.resource === resource && permission.action === action) {
        return true;
      }
      
      return false;
    });
  }

  // Check role
  hasRole(roleName: string): boolean {
    const roles = this.rolesSubject.value;
    return roles.some(role => role.name === roleName);
  }

  // Assign role to user
  assignRoleToUser(userId: string, roleName: string): void {
    const roles = this.rolesSubject.value;
    const role = roles.find(r => r.name === roleName);
    
    if (role) {
      // This would typically call the backend to assign the role
      console.log(`Role ${roleName} assigned to user ${userId}`);
      
      // Update current user permissions if it's the current user
      if (userId === this.getCurrentUserId()) {
        this.currentUserPermissionsSubject.next(role.permissions);
      }
    }
  }

  // Validate password strength
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    if (!this.securityConfig.requireStrongPassword) {
      return { isValid: true, score: 100, feedback: [] };
    }
    
    const feedback: string[] = [];
    let score = 0;
    
    // Length check
    if (password.length >= 8) {
      score += 20;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }
    
    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 20;
    } else {
      feedback.push('Password must contain at least one uppercase letter');
    }
    
    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 20;
    } else {
      feedback.push('Password must contain at least one lowercase letter');
    }
    
    // Number check
    if (/\d/.test(password)) {
      score += 20;
    } else {
      feedback.push('Password must contain at least one number');
    }
    
    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 20;
    } else {
      feedback.push('Password must contain at least one special character');
    }
    
    const isValid = score >= 80;
    
    return { isValid, score, feedback };
  }

  // Track login attempt
  trackLoginAttempt(userId: string, success: boolean): void {
    const currentAttempts = this.loginAttemptsSubject.value;
    
    if (success) {
      // Reset attempts on successful login
      currentAttempts.delete(userId);
      this.logSecurityEvent({
        type: 'login',
        userId,
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent,
        timestamp: new Date(),
        details: 'Successful login',
        severity: 'low'
      });
    } else {
      // Increment failed attempts
      const currentCount = currentAttempts.get(userId) || 0;
      currentAttempts.set(userId, currentCount + 1);
      
      this.logSecurityEvent({
        type: 'failed_login',
        userId,
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent,
        timestamp: new Date(),
        details: `Failed login attempt ${currentCount + 1}`,
        severity: currentCount + 1 >= this.securityConfig.maxLoginAttempts ? 'high' : 'medium'
      });
    }
    
    this.loginAttemptsSubject.next(new Map(currentAttempts));
  }

  // Get client IP address
  private getClientIP(): string {
    // This is a simplified version - in production, you'd get this from the server
    return '127.0.0.1';
  }

  // Get current user ID
  private getCurrentUserId(): string | undefined {
    // This would typically come from your auth service
    return localStorage.getItem('userId') || undefined;
  }

  // Clear user session
  private clearUserSession(): void {
    localStorage.removeItem('userId');
    localStorage.removeItem('lastActivity');
    localStorage.removeItem('accessToken');
    this.currentUserPermissionsSubject.next([]);
  }

  // Update last activity
  updateLastActivity(): void {
    localStorage.setItem('lastActivity', new Date().toISOString());
  }

  // Get security configuration
  getSecurityConfig(): SecurityConfig {
    return { ...this.securityConfig };
  }

  // Update security configuration
  updateSecurityConfig(config: Partial<SecurityConfig>): void {
    this.securityConfig = { ...this.securityConfig, ...config };
  }

  // Get security events
  getSecurityEvents(): Observable<SecurityEvent[]> {
    return this.securityEvents$;
  }

  // Get security events by severity
  getSecurityEventsBySeverity(severity: SecurityEvent['severity']): Observable<SecurityEvent[]> {
    return this.securityEvents$.pipe(
      map(events => events.filter(event => event.severity === severity))
    );
  }

  // Get login attempts
  get loginAttempts$(): Observable<Map<string, number>> {
    return this.loginAttemptsSubject.asObservable();
  }

  // Check if user is blocked
  isUserBlocked(userId: string): boolean {
    const attempts = this.loginAttemptsSubject.value;
    const failedAttempts = attempts.get(userId) || 0;
    return failedAttempts >= this.securityConfig.maxLoginAttempts;
  }

  // Unblock user
  unblockUser(userId: string): void {
    const currentAttempts = this.loginAttemptsSubject.value;
    currentAttempts.delete(userId);
    this.loginAttemptsSubject.next(new Map(currentAttempts));
    
    console.log(`User ${userId} has been unblocked`);
  }

  // Validate origin
  validateOrigin(origin: string): boolean {
    return this.securityConfig.allowedOrigins.some(allowed => 
      origin.includes(allowed)
    );
  }

  // Sanitize input
  sanitizeInput(input: string): string {
    // Basic XSS prevention
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Generate secure token
  generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Hash password (client-side hashing for additional security)
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}





