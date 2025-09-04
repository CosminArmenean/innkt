import { BaseApiService, neurosparkApi } from './api.service';

export interface ThreatAnalysisRequest {
  userId: string;
  requestData: {
    endpoint: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
  };
}

export interface ThreatAnalysisResult {
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  detectedThreats: string[];
  recommendations: string[];
  analysisTime: number;
  confidence: number;
}

export interface AnomalyDetectionRequest {
  userId: string;
  behaviorData: {
    loginTime: string;
    location: string;
    deviceInfo: string;
    action: string;
    frequency: number;
  };
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  anomalyType: 'LOGIN_PATTERN' | 'LOCATION_CHANGE' | 'DEVICE_CHANGE' | 'BEHAVIOR_CHANGE';
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  details: string;
}

export interface SecurityIncident {
  id: string;
  userId: string;
  incidentType: 'THREAT_DETECTED' | 'ANOMALY_DETECTED' | 'UNAUTHORIZED_ACCESS' | 'SUSPICIOUS_ACTIVITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  detectedAt: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  resolution?: string;
  resolvedAt?: string;
}

export interface SecurityMetrics {
  totalIncidents: number;
  incidentsByType: Record<string, number>;
  incidentsBySeverity: Record<string, number>;
  averageResponseTime: number;
  threatDetectionRate: number;
  falsePositiveRate: number;
  lastUpdated: string;
}

export class SecurityService extends BaseApiService {
  constructor() {
    super(neurosparkApi);
  }

  // Analyze request for threats
  async analyzeThreat(request: ThreatAnalysisRequest): Promise<ThreatAnalysisResult> {
    return this.post<ThreatAnalysisResult>('/api/security/threat-analysis', request);
  }

  // Detect behavioral anomalies
  async detectAnomaly(request: AnomalyDetectionRequest): Promise<AnomalyDetectionResult> {
    return this.post<AnomalyDetectionResult>('/api/security/anomaly-detection', request);
  }

  // Get security incidents
  async getSecurityIncidents(userId: string, status?: string): Promise<SecurityIncident[]> {
    const params = status ? { userId, status } : { userId };
    return this.get<SecurityIncident[]>('/api/security/incidents', params);
  }

  // Get security metrics
  async getSecurityMetrics(userId: string): Promise<SecurityMetrics> {
    return this.get<SecurityMetrics>(`/api/security/metrics/${userId}`);
  }

  // Update incident status
  async updateIncidentStatus(incidentId: string, status: string, resolution?: string): Promise<void> {
    return this.put<void>(`/api/security/incidents/${incidentId}/status`, { status, resolution });
  }

  // Get threat patterns
  async getThreatPatterns(): Promise<any[]> {
    return this.get<any[]>('/api/security/threat-patterns');
  }

  // Report security incident
  async reportIncident(incident: Omit<SecurityIncident, 'id' | 'detectedAt' | 'status'>): Promise<SecurityIncident> {
    return this.post<SecurityIncident>('/api/security/incidents', incident);
  }

  // Get security recommendations
  async getSecurityRecommendations(userId: string): Promise<string[]> {
    return this.get<string[]>(`/api/security/recommendations/${userId}`);
  }
}

export const securityService = new SecurityService();


