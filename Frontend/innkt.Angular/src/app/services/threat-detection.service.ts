import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ThreatAnalysisRequest {
  userId: string;
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  requestBody?: any;
  timestamp: Date;
}

export interface ThreatIndicator {
  type: string;
  description: string;
  confidence: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  metadata: Record<string, any>;
}

export interface ThreatAnalysisResult {
  requestId: string;
  threatLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  indicators: ThreatIndicator[];
  riskScore: number;
  recommendations: string[];
  requiresImmediateAction: boolean;
  analyzedAt: Date;
}

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'InProgress' | 'Resolved' | 'Closed' | 'Escalated';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo: string;
  createdAt: Date;
  resolvedAt?: Date;
  tags: string[];
  metadata: Record<string, any>;
}

export interface ThreatMetrics {
  totalThreats: number;
  highThreats: number;
  mediumThreats: number;
  lowThreats: number;
  averageRiskScore: number;
  trends: Array<{
    date: Date;
    threatCount: number;
    averageRiskScore: number;
  }>;
  threatsByType: Record<string, number>;
  generatedAt: Date;
}

export interface ThreatPattern {
  id: string;
  name: string;
  description: string;
  pattern: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  isActive: boolean;
  actions: string[];
  createdAt: Date;
  lastUpdated?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ThreatDetectionService {
  private readonly baseUrl = environment.apiUrl + '/api/ThreatDetection';
  
  private activeThreatsSubject = new BehaviorSubject<ThreatAnalysisResult[]>([]);
  private incidentsSubject = new BehaviorSubject<SecurityIncident[]>([]);
  private metricsSubject = new BehaviorSubject<ThreatMetrics | null>(null);
  private patternsSubject = new BehaviorSubject<ThreatPattern[]>([]);
  private isMonitoringSubject = new BehaviorSubject<boolean>(false);

  public activeThreats$ = this.activeThreatsSubject.asObservable();
  public incidents$ = this.incidentsSubject.asObservable();
  public metrics$ = this.metricsSubject.asObservable();
  public patterns$ = this.patternsSubject.asObservable();
  public isMonitoring$ = this.isMonitoringSubject.asObservable();

  private monitoringInterval?: any;

  constructor(private http: HttpClient) {
    this.initializeService();
  }

  private initializeService() {
    // Load initial data
    this.loadThreatMetrics();
    this.loadActiveIncidents();
    this.loadThreatPatterns();
  }

  // Start real-time threat monitoring
  startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.isMonitoringSubject.next(true);
    this.monitoringInterval = interval(intervalMs).subscribe(() => {
      this.refreshThreatData();
    });
  }

  // Stop real-time monitoring
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoringSubject.next(false);
  }

  // Analyze a request for threats
  analyzeRequest(request: ThreatAnalysisRequest): Observable<ThreatAnalysisResult> {
    return this.http.post<ThreatAnalysisResult>(`${this.baseUrl}/analyze`, request)
      .pipe(
        map(result => ({
          ...result,
          analyzedAt: new Date(result.analyzedAt)
        })),
        catchError(error => {
          console.error('Error analyzing threat:', error);
          throw error;
        })
      );
  }

  // Detect anomalies
  detectAnomalies(userId: string, ipAddress: string, endpoint: string, from: Date, to: Date): Observable<any> {
    const request = {
      userId,
      ipAddress,
      endpoint,
      from: from.toISOString(),
      to: to.toISOString(),
      type: 1 // Behavioral
    };

    return this.http.post(`${this.baseUrl}/anomaly/detect`, request);
  }

  // Execute automated response
  executeAutomatedResponse(incidentId: string, threatLevel: string, actions: string[]): Observable<any> {
    const request = {
      incidentId,
      threatLevel: this.mapThreatLevel(threatLevel),
      actions,
      requireConfirmation: false,
      parameters: {
        block_duration: 15,
        notification_level: 'high'
      }
    };

    return this.http.post(`${this.baseUrl}/response/execute`, request);
  }

  // Load threat metrics
  loadThreatMetrics(): void {
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const to = new Date();

    this.http.get<ThreatMetrics>(`${this.baseUrl}/metrics`, {
      params: {
        from: from.toISOString(),
        to: to.toISOString()
      }
    }).subscribe({
      next: (metrics) => {
        this.metricsSubject.next({
          ...metrics,
          generatedAt: new Date(metrics.generatedAt),
          trends: metrics.trends.map(trend => ({
            ...trend,
            date: new Date(trend.date)
          }))
        });
      },
      error: (error) => {
        console.error('Error loading threat metrics:', error);
      }
    });
  }

  // Load active incidents
  loadActiveIncidents(): void {
    this.http.get<SecurityIncident[]>(`${this.baseUrl}/incidents/active`).subscribe({
      next: (incidents) => {
        this.incidentsSubject.next(incidents.map(incident => ({
          ...incident,
          createdAt: new Date(incident.createdAt),
          resolvedAt: incident.resolvedAt ? new Date(incident.resolvedAt) : undefined
        })));
      },
      error: (error) => {
        console.error('Error loading active incidents:', error);
      }
    });
  }

  // Load threat patterns
  loadThreatPatterns(): void {
    this.http.get<ThreatPattern[]>(`${this.baseUrl}/patterns`).subscribe({
      next: (patterns) => {
        this.patternsSubject.next(patterns.map(pattern => ({
          ...pattern,
          createdAt: new Date(pattern.createdAt),
          lastUpdated: pattern.lastUpdated ? new Date(pattern.lastUpdated) : undefined
        })));
      },
      error: (error) => {
        console.error('Error loading threat patterns:', error);
      }
    });
  }

  // Create new incident
  createIncident(title: string, description: string, severity: string, assignedTo: string, tags: string[]): Observable<SecurityIncident> {
    const request = {
      title,
      description,
      severity: this.mapThreatLevel(severity),
      assignedTo,
      tags,
      metadata: {}
    };

    return this.http.post<SecurityIncident>(`${this.baseUrl}/incidents`, request)
      .pipe(
        map(incident => ({
          ...incident,
          createdAt: new Date(incident.createdAt),
          resolvedAt: incident.resolvedAt ? new Date(incident.resolvedAt) : undefined
        }))
      );
  }

  // Update incident status
  updateIncidentStatus(incidentId: string, status: string): Observable<boolean> {
    return this.http.put<boolean>(`${this.baseUrl}/incidents/${incidentId}/status`, { status });
  }

  // Refresh all threat data
  private refreshThreatData(): void {
    this.loadThreatMetrics();
    this.loadActiveIncidents();
  }

  // Map threat level string to enum
  private mapThreatLevel(level: string): number {
    switch (level.toLowerCase()) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      case 'critical': return 4;
      default: return 1;
    }
  }

  // Get threat level color for UI
  getThreatLevelColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'low': return '#28a745';
      case 'medium': return '#ffc107';
      case 'high': return '#fd7e14';
      case 'critical': return '#dc3545';
      default: return '#6c757d';
    }
  }

  // Get threat level icon for UI
  getThreatLevelIcon(level: string): string {
    switch (level.toLowerCase()) {
      case 'low': return 'shield-check';
      case 'medium': return 'shield-exclamation';
      case 'high': return 'shield-x';
      case 'critical': return 'exclamation-triangle';
      default: return 'shield';
    }
  }

  // Cleanup on destroy
  ngOnDestroy(): void {
    this.stopMonitoring();
  }
}


