import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreatDetectionService } from '../../../services/threat-detection.service';

@Component({
  selector: 'app-security-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="security-test">
      <h2>Security Dashboard Test</h2>
      <p>Testing Threat Detection Service Integration</p>
      
      <div class="test-results">
        <h3>Service Status:</h3>
        <ul>
          <li>Threat Detection Service: {{ serviceStatus }}</li>
          <li>Monitoring Active: {{ isMonitoring ? 'Yes' : 'No' }}</li>
        </ul>
        
        <button (click)="testConnection()" class="btn btn-primary">
          Test Connection
        </button>
        
        <div *ngIf="testResult" class="test-result">
          <h4>Test Result:</h4>
          <pre>{{ testResult | json }}</pre>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .security-test {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .test-results {
      margin-top: 2rem;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
    
    .test-result {
      margin-top: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 4px;
    }
    
    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 1rem;
    }
    
    .btn-primary {
      background: #007bff;
      color: white;
    }
  `]
})
export class SecurityTestComponent {
  serviceStatus = 'Unknown';
  isMonitoring = false;
  testResult: any = null;

  constructor(private threatDetectionService: ThreatDetectionService) {
    this.checkServiceStatus();
  }

  private checkServiceStatus() {
    try {
      // Check if service is properly injected
      this.serviceStatus = 'Injected Successfully';
      
      // Check monitoring status
      this.threatDetectionService.isMonitoring$.subscribe(
        status => this.isMonitoring = status
      );
    } catch (error) {
      this.serviceStatus = 'Error: ' + error;
    }
  }

  testConnection() {
    this.testResult = 'Testing connection...';
    
    // Test a simple API call
    const testRequest = {
      userId: 'test-user',
      ipAddress: '127.0.0.1',
      userAgent: 'Test Browser',
      endpoint: '/test',
      method: 'GET',
      headers: {},
      timestamp: new Date()
    };

    this.threatDetectionService.analyzeRequest(testRequest).subscribe({
      next: (result) => {
        this.testResult = {
          success: true,
          message: 'Connection successful',
          result: result
        };
      },
      error: (error) => {
        this.testResult = {
          success: false,
          message: 'Connection failed',
          error: error.message || error
        };
      }
    });
  }
}


