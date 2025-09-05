import { EventEmitter } from 'events';

// A/B Test Experiment Interface
export interface ABTestExperiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  variants: ABTestVariant[];
  targetAudience: {
    userIds?: string[];
    userSegments?: string[];
    deviceTypes?: string[];
    appVersions?: string[];
    locations?: string[];
    userProperties?: Record<string, any>;
  };
  goals: ABTestGoal[];
  trafficAllocation: number; // Percentage of users to include in test
  createdAt: Date;
  updatedAt: Date;
}

// A/B Test Variant Interface
export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  type: 'control' | 'treatment';
  trafficPercentage: number;
  configuration: Record<string, any>;
  isDefault?: boolean;
}

// A/B Test Goal Interface
export interface ABTestGoal {
  id: string;
  name: string;
  description: string;
  type: 'conversion' | 'engagement' | 'retention' | 'revenue';
  metric: string;
  targetValue?: number;
  weight: number; // Importance of this goal
}

// A/B Test Assignment Interface
export interface ABTestAssignment {
  userId: string;
  experimentId: string;
  variantId: string;
  assignedAt: Date;
  lastSeenAt: Date;
  conversionEvents: ABTestConversionEvent[];
}

// A/B Test Conversion Event Interface
export interface ABTestConversionEvent {
  goalId: string;
  timestamp: Date;
  value?: number;
  properties?: Record<string, any>;
}

// A/B Test Results Interface
export interface ABTestResults {
  experimentId: string;
  variantResults: Record<string, ABTestVariantResult>;
  overallResults: {
    totalUsers: number;
    totalConversions: number;
    confidenceLevel: number;
    statisticalSignificance: boolean;
    winner?: string;
    lift?: number;
  };
  recommendations: string[];
}

// A/B Test Variant Result Interface
export interface ABTestVariantResult {
  variantId: string;
  variantName: string;
  userCount: number;
  conversionCount: number;
  conversionRate: number;
  averageValue?: number;
  totalValue?: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  pValue: number;
  isSignificant: boolean;
}

// A/B Test Configuration
export interface ABTestingConfig {
  enabled: boolean;
  endpoint: string;
  apiKey: string;
  cacheExpiry: number;
  maxExperiments: number;
  defaultTrafficAllocation: number;
  statisticalSignificanceThreshold: number;
}

// A/B Testing Service Class
export class ABTestingService extends EventEmitter {
  private static instance: ABTestingService;
  private config: ABTestingConfig;
  private experiments: Map<string, ABTestExperiment> = new Map();
  private userAssignments: Map<string, Map<string, ABTestAssignment>> = new Map();
  private isInitialized: boolean = false;
  private cacheTimer: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): ABTestingService {
    if (!ABTestingService.instance) {
      ABTestingService.instance = new ABTestingService();
    }
    return ABTestingService.instance;
  }

  // Initialize the A/B testing service
  public async initialize(config?: Partial<ABTestingConfig>): Promise<void> {
    if (this.isInitialized) return;

    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (!this.config.enabled) {
      console.log('A/B testing service is disabled');
      return;
    }

    try {
      // Load experiments from backend
      await this.loadExperiments();
      
      // Start cache refresh timer
      this.startCacheTimer();
      
      this.isInitialized = true;
      this.emit('initialized');
      console.log('A/B testing service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize A/B testing service:', error);
      this.emit('error', error);
    }
  }

  // Get variant for a user and experiment
  public getVariant(userId: string, experimentId: string): ABTestVariant | null {
    if (!this.isInitialized || !this.config.enabled) {
      return this.getDefaultVariant(experimentId);
    }

    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'active') {
      return this.getDefaultVariant(experimentId);
    }

    // Check if user is already assigned
    let assignment = this.getUserAssignment(userId, experimentId);
    
    if (!assignment) {
      // Check if user should be included in test
      if (!this.shouldIncludeUser(userId, experiment)) {
        return this.getDefaultVariant(experimentId);
      }

      // Assign user to a variant
      assignment = this.assignUserToVariant(userId, experimentId);
    }

    // Update last seen timestamp
    assignment.lastSeenAt = new Date();

    const variant = experiment.variants.find(v => v.id === assignment.variantId);
    return variant || this.getDefaultVariant(experimentId);
  }

  // Track conversion for a goal
  public trackConversion(
    userId: string,
    experimentId: string,
    goalId: string,
    value?: number,
    properties?: Record<string, any>
  ): void {
    if (!this.isInitialized || !this.config.enabled) return;

    const assignment = this.getUserAssignment(userId, experimentId);
    if (!assignment) return;

    const conversionEvent: ABTestConversionEvent = {
      goalId,
      timestamp: new Date(),
      value,
      properties
    };

    assignment.conversionEvents.push(conversionEvent);
    this.emit('conversion_tracked', { userId, experimentId, goalId, conversionEvent });
  }

  // Get experiment results
  public async getExperimentResults(experimentId: string): Promise<ABTestResults | null> {
    if (!this.isInitialized || !this.config.enabled) return null;

    try {
      // Calculate results from local data
      const results = this.calculateExperimentResults(experimentId);
      
      // Send results to backend for storage
      await this.sendResultsToBackend(experimentId, results);
      
      return results;
    } catch (error) {
      console.error('Failed to get experiment results:', error);
      this.emit('error', error);
      return null;
    }
  }

  // Create a new experiment
  public async createExperiment(experiment: Omit<ABTestExperiment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!this.isInitialized || !this.config.enabled) {
      throw new Error('A/B testing service is not initialized or disabled');
    }

    try {
      const newExperiment: ABTestExperiment = {
        ...experiment,
        id: this.generateExperimentId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate experiment
      this.validateExperiment(newExperiment);

      // Save to backend
      await this.saveExperimentToBackend(newExperiment);

      // Add to local cache
      this.experiments.set(newExperiment.id, newExperiment);

      this.emit('experiment_created', newExperiment);
      return newExperiment.id;
    } catch (error) {
      console.error('Failed to create experiment:', error);
      this.emit('error', error);
      throw error;
    }
  }

  // Update experiment
  public async updateExperiment(experimentId: string, updates: Partial<ABTestExperiment>): Promise<void> {
    if (!this.isInitialized || !this.config.enabled) {
      throw new Error('A/B testing service is not initialized or disabled');
    }

    try {
      const experiment = this.experiments.get(experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      const updatedExperiment: ABTestExperiment = {
        ...experiment,
        ...updates,
        updatedAt: new Date()
      };

      // Validate experiment
      this.validateExperiment(updatedExperiment);

      // Save to backend
      await this.saveExperimentToBackend(updatedExperiment);

      // Update local cache
      this.experiments.set(experimentId, updatedExperiment);

      this.emit('experiment_updated', updatedExperiment);
    } catch (error) {
      console.error('Failed to update experiment:', error);
      this.emit('error', error);
      throw error;
    }
  }

  // Start experiment
  public async startExperiment(experimentId: string): Promise<void> {
    await this.updateExperiment(experimentId, {
      status: 'active',
      startDate: new Date()
    });
  }

  // Pause experiment
  public async pauseExperiment(experimentId: string): Promise<void> {
    await this.updateExperiment(experimentId, {
      status: 'paused'
    });
  }

  // Complete experiment
  public async completeExperiment(experimentId: string): Promise<void> {
    await this.updateExperiment(experimentId, {
      status: 'completed',
      endDate: new Date()
    });
  }

  // Get all experiments
  public getExperiments(): ABTestExperiment[] {
    return Array.from(this.experiments.values());
  }

  // Get experiment by ID
  public getExperiment(experimentId: string): ABTestExperiment | undefined {
    return this.experiments.get(experimentId);
  }

  // Get user assignments
  public getUserAssignments(userId: string): ABTestAssignment[] {
    const userAssignmentMap = this.userAssignments.get(userId);
    return userAssignmentMap ? Array.from(userAssignmentMap.values()) : [];
  }

  // Check if user is in experiment
  public isUserInExperiment(userId: string, experimentId: string): boolean {
    return this.getUserAssignment(userId, experimentId) !== null;
  }

  // Private methods

  private getUserAssignment(userId: string, experimentId: string): ABTestAssignment | null {
    const userAssignmentMap = this.userAssignments.get(userId);
    return userAssignmentMap?.get(experimentId) || null;
  }

  private assignUserToVariant(userId: string, experimentId: string): ABTestAssignment {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    // Simple random assignment based on traffic percentages
    const random = Math.random() * 100;
    let cumulativePercentage = 0;
    let selectedVariant: ABTestVariant | null = null;

    for (const variant of experiment.variants) {
      cumulativePercentage += variant.trafficPercentage;
      if (random <= cumulativePercentage) {
        selectedVariant = variant;
        break;
      }
    }

    if (!selectedVariant) {
      selectedVariant = experiment.variants.find(v => v.isDefault) || experiment.variants[0];
    }

    const assignment: ABTestAssignment = {
      userId,
      experimentId,
      variantId: selectedVariant.id,
      assignedAt: new Date(),
      lastSeenAt: new Date(),
      conversionEvents: []
    };

    // Store assignment
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map());
    }
    this.userAssignments.get(userId)!.set(experimentId, assignment);

    this.emit('user_assigned', assignment);
    return assignment;
  }

  private shouldIncludeUser(userId: string, experiment: ABTestExperiment): boolean {
    // Check traffic allocation
    if (Math.random() * 100 > experiment.trafficAllocation) {
      return false;
    }

    // Check target audience criteria
    if (experiment.targetAudience.userIds && !experiment.targetAudience.userIds.includes(userId)) {
      return false;
    }

    // Additional audience targeting logic would go here
    // For now, we'll include all users that pass the traffic allocation

    return true;
  }

  private getDefaultVariant(experimentId: string): ABTestVariant | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    return experiment.variants.find(v => v.isDefault) || experiment.variants[0] || null;
  }

  private calculateExperimentResults(experimentId: string): ABTestResults {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    const variantResults: Record<string, ABTestVariantResult> = {};
    let totalUsers = 0;
    let totalConversions = 0;

    // Calculate results for each variant
    for (const variant of experiment.variants) {
      const variantAssignments = this.getVariantAssignments(experimentId, variant.id);
      const userCount = variantAssignments.length;
      const conversionCount = this.countConversions(variantAssignments, experiment.goals);
      
      totalUsers += userCount;
      totalConversions += conversionCount;

      const conversionRate = userCount > 0 ? conversionCount / userCount : 0;
      
      variantResults[variant.id] = {
        variantId: variant.id,
        variantName: variant.name,
        userCount,
        conversionCount,
        conversionRate,
        confidenceInterval: this.calculateConfidenceInterval(conversionRate, userCount),
        pValue: 0, // Would be calculated using statistical methods
        isSignificant: false // Would be determined based on p-value and threshold
      };
    }

    // Calculate overall results
    const overallResults = {
      totalUsers,
      totalConversions,
      confidenceLevel: 0.95, // 95% confidence level
      statisticalSignificance: false,
      winner: this.determineWinner(variantResults),
      lift: this.calculateLift(variantResults)
    };

    return {
      experimentId,
      variantResults,
      overallResults,
      recommendations: this.generateRecommendations(variantResults, overallResults)
    };
  }

  private getVariantAssignments(experimentId: string, variantId: string): ABTestAssignment[] {
    const assignments: ABTestAssignment[] = [];
    
    for (const [userId, userAssignmentMap] of this.userAssignments) {
      const assignment = userAssignmentMap.get(experimentId);
      if (assignment && assignment.variantId === variantId) {
        assignments.push(assignment);
      }
    }
    
    return assignments;
  }

  private countConversions(assignments: ABTestAssignment[], goals: ABTestGoal[]): number {
    let count = 0;
    
    for (const assignment of assignments) {
      for (const goal of goals) {
        if (assignment.conversionEvents.some(event => event.goalId === goal.id)) {
          count++;
          break; // Count user only once per goal
        }
      }
    }
    
    return count;
  }

  private calculateConfidenceInterval(conversionRate: number, sampleSize: number): { lower: number; upper: number } {
    // Simplified confidence interval calculation
    // In production, this would use proper statistical methods
    const standardError = Math.sqrt((conversionRate * (1 - conversionRate)) / sampleSize);
    const marginOfError = 1.96 * standardError; // 95% confidence level
    
    return {
      lower: Math.max(0, conversionRate - marginOfError),
      upper: Math.min(1, conversionRate + marginOfError)
    };
  }

  private determineWinner(variantResults: Record<string, ABTestVariantResult>): string | undefined {
    let bestVariant: string | undefined;
    let bestRate = 0;
    
    for (const [variantId, result] of Object.entries(variantResults)) {
      if (result.conversionRate > bestRate && result.isSignificant) {
        bestRate = result.conversionRate;
        bestVariant = variantId;
      }
    }
    
    return bestVariant;
  }

  private calculateLift(variantResults: Record<string, ABTestVariantResult>): number | undefined {
    const controlVariant = Object.values(variantResults).find(v => v.variantName.toLowerCase().includes('control'));
    const treatmentVariant = Object.values(variantResults).find(v => !v.variantName.toLowerCase().includes('control'));
    
    if (!controlVariant || !treatmentVariant) return undefined;
    
    if (controlVariant.conversionRate === 0) return 0;
    
    return ((treatmentVariant.conversionRate - controlVariant.conversionRate) / controlVariant.conversionRate) * 100;
  }

  private generateRecommendations(variantResults: Record<string, ABTestVariantResult>, overallResults: any): string[] {
    const recommendations: string[] = [];
    
    if (overallResults.winner) {
      recommendations.push(`Variant ${overallResults.winner} shows the best performance and should be considered for implementation.`);
    }
    
    if (overallResults.lift && overallResults.lift > 10) {
      recommendations.push(`The treatment variant shows a ${overallResults.lift.toFixed(1)}% improvement over the control.`);
    }
    
    if (!overallResults.statisticalSignificance) {
      recommendations.push('Results are not statistically significant. Consider running the experiment longer or increasing sample size.');
    }
    
    return recommendations;
  }

  private validateExperiment(experiment: ABTestExperiment): void {
    if (!experiment.name || experiment.name.trim().length === 0) {
      throw new Error('Experiment name is required');
    }
    
    if (experiment.variants.length < 2) {
      throw new Error('Experiment must have at least 2 variants');
    }
    
    const totalTraffic = experiment.variants.reduce((sum, v) => sum + v.trafficPercentage, 0);
    if (Math.abs(totalTraffic - 100) > 0.01) {
      throw new Error('Variant traffic percentages must sum to 100%');
    }
    
    if (experiment.goals.length === 0) {
      throw new Error('Experiment must have at least one goal');
    }
  }

  private generateExperimentId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadExperiments(): Promise<void> {
    // Implementation would load experiments from backend
    // For now, we'll create some sample experiments
    const sampleExperiments: ABTestExperiment[] = [
      {
        id: 'exp_1',
        name: 'Button Color Test',
        description: 'Testing different button colors for better conversion',
        status: 'active',
        startDate: new Date(),
        variants: [
          { id: 'var_1', name: 'Control (Blue)', description: 'Original blue button', type: 'control', trafficPercentage: 50, configuration: { color: 'blue' }, isDefault: true },
          { id: 'var_2', name: 'Treatment (Green)', description: 'Green button variant', type: 'treatment', trafficPercentage: 50, configuration: { color: 'green' } }
        ],
        targetAudience: {},
        goals: [
          { id: 'goal_1', name: 'Button Click', description: 'User clicks the button', type: 'conversion', metric: 'click_rate', weight: 1 }
        ],
        trafficAllocation: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const experiment of sampleExperiments) {
      this.experiments.set(experiment.id, experiment);
    }
  }

  private async saveExperimentToBackend(experiment: ABTestExperiment): Promise<void> {
    // Implementation would save experiment to backend
    // For now, we'll simulate the API call
    return new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }

  private async sendResultsToBackend(experimentId: string, results: ABTestResults): Promise<void> {
    // Implementation would send results to backend
    // For now, we'll simulate the API call
    return new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }

  private startCacheTimer(): void {
    if (this.cacheTimer) {
      clearInterval(this.cacheTimer);
    }

    this.cacheTimer = setInterval(() => {
      this.loadExperiments();
    }, this.config.cacheExpiry);
  }

  private getDefaultConfig(): ABTestingConfig {
    return {
      enabled: true,
      endpoint: 'https://api.innkt.com/ab-testing',
      apiKey: '',
      cacheExpiry: 300000, // 5 minutes
      maxExperiments: 100,
      defaultTrafficAllocation: 100,
      statisticalSignificanceThreshold: 0.05
    };
  }

  // Cleanup
  public cleanup(): void {
    if (this.cacheTimer) {
      clearInterval(this.cacheTimer);
      this.cacheTimer = null;
    }
    
    this.experiments.clear();
    this.userAssignments.clear();
    this.isInitialized = false;
    this.emit('cleanup');
  }
}

// Export singleton instance
export const abTestingService = ABTestingService.getInstance();






