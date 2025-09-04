import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { ThreatDetectionService, ThreatMetrics, SecurityIncident, ThreatPattern } from '../../../services/threat-detection.service';
import { SecurityService } from '../../../services/security.service';
import { PerformanceService } from '../../../services/performance.service';

@Component({
  selector: 'app-security-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    BaseChartDirective
  ],
  templateUrl: './security-dashboard.component.html',
  styleUrls: ['./security-dashboard.component.scss']
})
export class SecurityDashboardComponent implements OnInit, OnDestroy {
  // Icons (using text for now)
  icons = {
    shield: '🛡️',
    warning: '⚠️',
    chart: '📊',
    list: '📋',
    settings: '⚙️',
    cog: '⚙️',
    play: '▶️',
    pause: '⏸️',
    refresh: '🔄'
  };

  // Data observables
  metrics$ = this.threatDetectionService.metrics$;
  incidents$ = this.threatDetectionService.incidents$;
  patterns$ = this.threatDetectionService.patterns$;
  isMonitoring$ = this.threatDetectionService.isMonitoring$;

  // Chart data
  threatTrendChartData: any = {
    labels: [],
    datasets: [{
      label: 'Threat Count',
      data: [],
      borderColor: '#dc3545',
      backgroundColor: 'rgba(220, 53, 69, 0.1)',
      tension: 0.4
    }]
  };

  threatLevelChartData: any = {
    labels: ['Low', 'Medium', 'High', 'Critical'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: ['#28a745', '#ffc107', '#fd7e14', '#dc3545'],
      borderWidth: 2
    }]
  };

  // Chart options
  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    }
  };

  // Component state
  isLoading = false;
  selectedIncident: SecurityIncident | null = null;
  showCreateIncidentModal = false;
  showIncidentDetailsModal = false;

  constructor(
    private threatDetectionService: ThreatDetectionService,
    private securityService: SecurityService,
    private performanceService: PerformanceService
  ) {}

  ngOnInit(): void {
    this.initializeDashboard();
    this.startMonitoring();
  }

  ngOnDestroy(): void {
    this.threatDetectionService.stopMonitoring();
  }

  private initializeDashboard(): void {
    // Subscribe to metrics to update charts
    this.metrics$.subscribe(metrics => {
      if (metrics) {
        this.updateCharts(metrics);
      }
    });

    // Subscribe to performance metrics
    this.performanceService.metrics$.subscribe(metrics => {
      // Update performance indicators if needed
    });
  }

  private updateCharts(metrics: ThreatMetrics): void {
    // Update threat level chart
    this.threatLevelChartData.datasets[0].data = [
      metrics.lowThreats,
      metrics.mediumThreats,
      metrics.highThreats,
      metrics.totalThreats - metrics.lowThreats - metrics.mediumThreats - metrics.highThreats
    ];

    // Update trend chart
    this.threatTrendChartData.labels = metrics.trends.map(t => 
      new Date(t.date).toLocaleDateString()
    );
    this.threatTrendChartData.datasets[0].data = metrics.trends.map(t => t.threatCount);
  }

  startMonitoring(): void {
    this.threatDetectionService.startMonitoring(30000); // 30 seconds
  }

  stopMonitoring(): void {
    this.threatDetectionService.stopMonitoring();
  }

  refreshData(): void {
    this.isLoading = true;
    this.threatDetectionService.loadThreatMetrics();
    this.threatDetectionService.loadActiveIncidents();
    this.threatDetectionService.loadThreatPatterns();
    
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  // Incident management
  viewIncidentDetails(incident: SecurityIncident): void {
    this.selectedIncident = incident;
    this.showIncidentDetailsModal = true;
  }

  createNewIncident(): void {
    this.showCreateIncidentModal = true;
  }

  updateIncidentStatus(incidentId: string, status: string): void {
    this.threatDetectionService.updateIncidentStatus(incidentId, status).subscribe({
      next: (success) => {
        if (success) {
          this.refreshData();
          // Show success message
        }
      },
      error: (error) => {
        console.error('Error updating incident status:', error);
        // Show error message
      }
    });
  }

  executeAutomatedResponse(incident: SecurityIncident): void {
    const actions = ['log_incident', 'notify_admin'];
    if (incident.severity === 'High' || incident.severity === 'Critical') {
      actions.push('temporary_block');
    }

    this.threatDetectionService.executeAutomatedResponse(
      incident.id,
      incident.severity,
      actions
    ).subscribe({
      next: (response) => {
        console.log('Automated response executed:', response);
        this.refreshData();
        // Show success message
      },
      error: (error) => {
        console.error('Error executing automated response:', error);
        // Show error message
      }
    });
  }

  // Threat analysis
  analyzeCurrentRequest(): void {
    const request = {
      userId: 'current-user', // Get from auth service
      ipAddress: '127.0.0.1', // Get actual IP
      userAgent: navigator.userAgent,
      endpoint: '/security/dashboard',
      method: 'GET',
      headers: {},
      timestamp: new Date()
    };

    this.threatDetectionService.analyzeRequest(request).subscribe({
      next: (result) => {
        console.log('Threat analysis result:', result);
        // Handle result (show notification, update UI, etc.)
      },
      error: (error) => {
        console.error('Error analyzing request:', error);
      }
    });
  }

  // Utility methods
  getThreatLevelColor(level: string): string {
    return this.threatDetectionService.getThreatLevelColor(level);
  }

  getThreatLevelIcon(level: string): string {
    return this.threatDetectionService.getThreatLevelIcon(level);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Open': return '#dc3545';
      case 'InProgress': return '#ffc107';
      case 'Resolved': return '#28a745';
      case 'Closed': return '#6c757d';
      case 'Escalated': return '#fd7e14';
      default: return '#6c757d';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'Low': return 'shield-check';
      case 'Medium': return 'shield-exclamation';
      case 'High': return 'shield-x';
      case 'Critical': return 'exclamation-triangle';
      default: return 'shield';
    }
  }
}
