import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { analyticsService } from '../services/analytics/analyticsService';
import { abTestingService } from '../services/analytics/abTestingService';
import { predictiveAnalyticsService } from '../services/analytics/predictiveAnalyticsService';
import { businessIntelligenceService } from '../services/analytics/businessIntelligenceService';

// Analytics Context State Interface
export interface AnalyticsContextState {
  // Service status
  isAnalyticsInitialized: boolean;
  isABTestingInitialized: boolean;
  isPredictiveAnalyticsInitialized: boolean;
  isBusinessIntelligenceInitialized: boolean;
  
  // Analytics data
  userBehaviorMetrics: any;
  contentPerformanceMetrics: any;
  businessMetrics: any;
  
  // A/B Testing data
  activeExperiments: any[];
  userAssignments: any[];
  
  // Predictive Analytics data
  predictions: any[];
  recommendations: any[];
  anomalies: any[];
  
  // Business Intelligence data
  dashboards: any[];
  reports: any[];
  alerts: any[];
  kpiSummary: any;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

// Analytics Context Actions Interface
export interface AnalyticsContextActions {
  // Analytics tracking
  trackEvent: (eventType: string, properties?: Record<string, any>, userId?: string) => void;
  trackUserBehavior: (metrics: any) => void;
  trackContentPerformance: (metrics: any) => void;
  trackBusinessMetrics: (metrics: any) => void;
  trackScreenView: (screenName: string, properties?: Record<string, any>) => void;
  trackEngagement: (action: string, target: string, properties?: Record<string, any>) => void;
  trackPerformance: (metric: string, value: number, unit?: string) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  
  // A/B Testing
  getVariant: (userId: string, experimentId: string) => any;
  trackConversion: (userId: string, experimentId: string, goalId: string, value?: number, properties?: Record<string, any>) => void;
  getExperimentResults: (experimentId: string) => Promise<any>;
  createExperiment: (experiment: any) => Promise<string>;
  updateExperiment: (experimentId: string, updates: any) => Promise<void>;
  startExperiment: (experimentId: string) => Promise<void>;
  pauseExperiment: (experimentId: string) => Promise<void>;
  completeExperiment: (experimentId: string) => Promise<void>;
  
  // Predictive Analytics
  getUserBehaviorPrediction: (userId: string) => Promise<any>;
  getContentPerformancePrediction: (contentId: string) => Promise<any>;
  getRecommendations: (userId: string, type?: 'content' | 'user' | 'feature', limit?: number) => Promise<any>;
  detectAnomalies: (data: Record<string, any>, type: string) => Promise<any[]>;
  getTrendForecast: (metric: string, timeframe?: string, periods?: number) => Promise<any>;
  trainModel: (modelId: string, trainingData: any[]) => Promise<boolean>;
  
  // Business Intelligence
  getMetric: (metricId: string) => any;
  getMetrics: () => any[];
  getMetricsByType: (type: string) => any[];
  updateMetricValue: (metricId: string, value: number) => Promise<void>;
  getDashboard: (dashboardId: string) => any;
  getDashboards: () => any[];
  createDashboard: (dashboard: any) => Promise<string>;
  updateDashboard: (dashboardId: string, updates: any) => Promise<void>;
  deleteDashboard: (dashboardId: string) => Promise<void>;
  getReport: (reportId: string) => any;
  getReports: () => any[];
  createReport: (report: any) => Promise<string>;
  generateReport: (reportId: string, filters?: Record<string, any>) => Promise<any>;
  getAlert: (alertId: string) => any;
  getAlerts: () => any[];
  createAlert: (alert: any) => Promise<string>;
  updateAlert: (alertId: string, updates: any) => Promise<void>;
  getKPISummary: () => any;
  exportData: (metrics: string[], format: string, dateRange?: { start: Date; end: Date }) => Promise<any>;
  
  // Utility methods
  refreshData: () => Promise<void>;
  clearCache: () => void;
}

// Analytics Context Interface
export interface AnalyticsContextType extends AnalyticsContextState, AnalyticsContextActions {}

// Analytics Context Provider Props
interface AnalyticsContextProviderProps {
  children: ReactNode;
  config?: {
    analytics?: any;
    abTesting?: any;
    predictiveAnalytics?: any;
    businessIntelligence?: any;
  };
}

// Analytics Context
const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// Analytics Context Provider Component
export const AnalyticsContextProvider: React.FC<AnalyticsContextProviderProps> = ({ 
  children, 
  config 
}) => {
  // State
  const [state, setState] = useState<AnalyticsContextState>({
    isAnalyticsInitialized: false,
    isABTestingInitialized: false,
    isPredictiveAnalyticsInitialized: false,
    isBusinessIntelligenceInitialized: false,
    userBehaviorMetrics: null,
    contentPerformanceMetrics: null,
    businessMetrics: null,
    activeExperiments: [],
    userAssignments: [],
    predictions: [],
    recommendations: [],
    anomalies: [],
    dashboards: [],
    reports: [],
    alerts: [],
    kpiSummary: null,
    isLoading: true,
    error: null
  });

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Initialize Analytics Service
        await analyticsService.initialize(config?.analytics);
        setState(prev => ({ ...prev, isAnalyticsInitialized: true }));

        // Initialize A/B Testing Service
        await abTestingService.initialize(config?.abTesting);
        setState(prev => ({ ...prev, isABTestingInitialized: true }));

        // Initialize Predictive Analytics Service
        await predictiveAnalyticsService.initialize(config?.predictiveAnalytics);
        setState(prev => ({ ...prev, isPredictiveAnalyticsInitialized: true }));

        // Initialize Business Intelligence Service
        await businessIntelligenceService.initialize(config?.businessIntelligence);
        setState(prev => ({ ...prev, isBusinessIntelligenceInitialized: true }));

        // Load initial data
        await loadInitialData();

        setState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error('Failed to initialize analytics services:', error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }));
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      analyticsService.cleanup();
      abTestingService.cleanup();
      predictiveAnalyticsService.cleanup();
      businessIntelligenceService.cleanup();
    };
  }, [config]);

  // Load initial data
  const loadInitialData = async () => {
    try {
      // Load A/B Testing data
      const experiments = abTestingService.getExperiments();
      setState(prev => ({ ...prev, activeExperiments: experiments }));

      // Load Business Intelligence data
      const dashboards = businessIntelligenceService.getDashboards();
      const reports = businessIntelligenceService.getReports();
      const alerts = businessIntelligenceService.getAlerts();
      const kpiSummary = businessIntelligenceService.getKPISummary();

      setState(prev => ({
        ...prev,
        dashboards,
        reports,
        alerts,
        kpiSummary
      }));
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  // Analytics tracking methods
  const trackEvent = (eventType: string, properties: Record<string, any> = {}, userId?: string) => {
    analyticsService.trackEvent(eventType as any, properties, userId);
  };

  const trackUserBehavior = (metrics: any) => {
    analyticsService.trackUserBehavior(metrics);
  };

  const trackContentPerformance = (metrics: any) => {
    analyticsService.trackContentPerformance(metrics);
  };

  const trackBusinessMetrics = (metrics: any) => {
    analyticsService.trackBusinessMetrics(metrics);
  };

  const trackScreenView = (screenName: string, properties: Record<string, any> = {}) => {
    analyticsService.trackScreenView(screenName, properties);
  };

  const trackEngagement = (action: string, target: string, properties: Record<string, any> = {}) => {
    analyticsService.trackEngagement(action, target, properties);
  };

  const trackPerformance = (metric: string, value: number, unit: string = 'ms') => {
    analyticsService.trackPerformance(metric, value, unit);
  };

  const trackError = (error: Error, context: Record<string, any> = {}) => {
    analyticsService.trackError(error, context);
  };

  // A/B Testing methods
  const getVariant = (userId: string, experimentId: string) => {
    return abTestingService.getVariant(userId, experimentId);
  };

  const trackConversion = (userId: string, experimentId: string, goalId: string, value?: number, properties?: Record<string, any>) => {
    abTestingService.trackConversion(userId, experimentId, goalId, value, properties);
  };

  const getExperimentResults = async (experimentId: string) => {
    return await abTestingService.getExperimentResults(experimentId);
  };

  const createExperiment = async (experiment: any) => {
    return await abTestingService.createExperiment(experiment);
  };

  const updateExperiment = async (experimentId: string, updates: any) => {
    await abTestingService.updateExperiment(experimentId, updates);
  };

  const startExperiment = async (experimentId: string) => {
    await abTestingService.startExperiment(experimentId);
  };

  const pauseExperiment = async (experimentId: string) => {
    await abTestingService.pauseExperiment(experimentId);
  };

  const completeExperiment = async (experimentId: string) => {
    await abTestingService.completeExperiment(experimentId);
  };

  // Predictive Analytics methods
  const getUserBehaviorPrediction = async (userId: string) => {
    return await predictiveAnalyticsService.getUserBehaviorPrediction(userId);
  };

  const getContentPerformancePrediction = async (contentId: string) => {
    return await predictiveAnalyticsService.getContentPerformancePrediction(contentId);
  };

  const getRecommendations = async (userId: string, type: 'content' | 'user' | 'feature' = 'content', limit: number = 10) => {
    return await predictiveAnalyticsService.getRecommendations(userId, type, limit);
  };

  const detectAnomalies = async (data: Record<string, any>, type: string) => {
    return await predictiveAnalyticsService.detectAnomalies(data, type as any);
  };

  const getTrendForecast = async (metric: string, timeframe: string = 'daily', periods: number = 30) => {
    return await predictiveAnalyticsService.getTrendForecast(metric, timeframe as any, periods);
  };

  const trainModel = async (modelId: string, trainingData: any[]) => {
    return await predictiveAnalyticsService.trainModel(modelId, trainingData);
  };

  // Business Intelligence methods
  const getMetric = (metricId: string) => {
    return businessIntelligenceService.getMetric(metricId);
  };

  const getMetrics = () => {
    return businessIntelligenceService.getMetrics();
  };

  const getMetricsByType = (type: string) => {
    return businessIntelligenceService.getMetricsByType(type as any);
  };

  const updateMetricValue = async (metricId: string, value: number) => {
    await businessIntelligenceService.updateMetricValue(metricId, value);
  };

  const getDashboard = (dashboardId: string) => {
    return businessIntelligenceService.getDashboard(dashboardId);
  };

  const getDashboards = () => {
    return businessIntelligenceService.getDashboards();
  };

  const createDashboard = async (dashboard: any) => {
    return await businessIntelligenceService.createDashboard(dashboard);
  };

  const updateDashboard = async (dashboardId: string, updates: any) => {
    await businessIntelligenceService.updateDashboard(dashboardId, updates);
  };

  const deleteDashboard = async (dashboardId: string) => {
    await businessIntelligenceService.deleteDashboard(dashboardId);
  };

  const getReport = (reportId: string) => {
    return businessIntelligenceService.getReport(reportId);
  };

  const getReports = () => {
    return businessIntelligenceService.getReports();
  };

  const createReport = async (report: any) => {
    return await businessIntelligenceService.createReport(report);
  };

  const generateReport = async (reportId: string, filters?: Record<string, any>) => {
    return await businessIntelligenceService.generateReport(reportId, filters);
  };

  const getAlert = (alertId: string) => {
    return businessIntelligenceService.getAlert(alertId);
  };

  const getAlerts = () => {
    return businessIntelligenceService.getAlerts();
  };

  const createAlert = async (alert: any) => {
    return await businessIntelligenceService.createAlert(alert);
  };

  const updateAlert = async (alertId: string, updates: any) => {
    await businessIntelligenceService.updateAlert(alertId, updates);
  };

  const getKPISummary = () => {
    return businessIntelligenceService.getKPISummary();
  };

  const exportData = async (metrics: string[], format: string, dateRange?: { start: Date; end: Date }) => {
    return await businessIntelligenceService.exportData(metrics, format as any, dateRange);
  };

  // Utility methods
  const refreshData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await loadInitialData();
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const clearCache = () => {
    analyticsService.clearEvents();
    // Other services don't have clear cache methods yet
    setState(prev => ({
      ...prev,
      predictions: [],
      recommendations: [],
      anomalies: []
    }));
  };

  // Context value
  const contextValue: AnalyticsContextType = {
    ...state,
    trackEvent,
    trackUserBehavior,
    trackContentPerformance,
    trackBusinessMetrics,
    trackScreenView,
    trackEngagement,
    trackPerformance,
    trackError,
    getVariant,
    trackConversion,
    getExperimentResults,
    createExperiment,
    updateExperiment,
    startExperiment,
    pauseExperiment,
    completeExperiment,
    getUserBehaviorPrediction,
    getContentPerformancePrediction,
    getRecommendations,
    detectAnomalies,
    getTrendForecast,
    trainModel,
    getMetric,
    getMetrics,
    getMetricsByType,
    updateMetricValue,
    getDashboard,
    getDashboards,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    getReport,
    getReports,
    createReport,
    generateReport,
    getAlert,
    getAlerts,
    createAlert,
    updateAlert,
    getKPISummary,
    exportData,
    refreshData,
    clearCache
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Analytics Context Hook
export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsContextProvider');
  }
  return context;
};

// Analytics Context Hook for specific service
export const useAnalyticsService = () => {
  const context = useAnalytics();
  return {
    isInitialized: context.isAnalyticsInitialized,
    trackEvent: context.trackEvent,
    trackUserBehavior: context.trackUserBehavior,
    trackContentPerformance: context.trackContentPerformance,
    trackBusinessMetrics: context.trackBusinessMetrics,
    trackScreenView: context.trackScreenView,
    trackEngagement: context.trackEngagement,
    trackPerformance: context.trackPerformance,
    trackError: context.trackError
  };
};

// A/B Testing Context Hook
export const useABTesting = () => {
  const context = useAnalytics();
  return {
    isInitialized: context.isABTestingInitialized,
    activeExperiments: context.activeExperiments,
    getVariant: context.getVariant,
    trackConversion: context.trackConversion,
    getExperimentResults: context.getExperimentResults,
    createExperiment: context.createExperiment,
    updateExperiment: context.updateExperiment,
    startExperiment: context.startExperiment,
    pauseExperiment: context.pauseExperiment,
    completeExperiment: context.completeExperiment
  };
};

// Predictive Analytics Context Hook
export const usePredictiveAnalytics = () => {
  const context = useAnalytics();
  return {
    isInitialized: context.isPredictiveAnalyticsInitialized,
    predictions: context.predictions,
    recommendations: context.recommendations,
    anomalies: context.anomalies,
    getUserBehaviorPrediction: context.getUserBehaviorPrediction,
    getContentPerformancePrediction: context.getContentPerformancePrediction,
    getRecommendations: context.getRecommendations,
    detectAnomalies: context.detectAnomalies,
    getTrendForecast: context.getTrendForecast,
    trainModel: context.trainModel
  };
};

// Business Intelligence Context Hook
export const useBusinessIntelligence = () => {
  const context = useAnalytics();
  return {
    isInitialized: context.isBusinessIntelligenceInitialized,
    dashboards: context.dashboards,
    reports: context.reports,
    alerts: context.alerts,
    kpiSummary: context.kpiSummary,
    getMetric: context.getMetric,
    getMetrics: context.getMetrics,
    getMetricsByType: context.getMetricsByType,
    updateMetricValue: context.updateMetricValue,
    getDashboard: context.getDashboard,
    getDashboards: context.getDashboards,
    createDashboard: context.createDashboard,
    updateDashboard: context.updateDashboard,
    deleteDashboard: context.deleteDashboard,
    getReport: context.getReport,
    getReports: context.getReports,
    createReport: context.createReport,
    generateReport: context.generateReport,
    getAlert: context.getAlert,
    getAlerts: context.getAlerts,
    createAlert: context.createAlert,
    updateAlert: context.updateAlert,
    getKPISummary: context.getKPISummary,
    exportData: context.exportData
  };
};






