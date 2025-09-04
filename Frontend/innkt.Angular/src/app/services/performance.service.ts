import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

export interface PerformanceMetrics {
  memoryUsage: number;
  cpuUsage: number;
  responseTime: number;
  pageLoadTime: number;
  networkLatency: number;
  errorRate: number;
  userInteractions: number;
  timestamp: Date;
}

export interface PerformanceThresholds {
  memoryWarning: number; // MB
  memoryCritical: number; // MB
  responseTimeWarning: number; // ms
  responseTimeCritical: number; // ms
  errorRateWarning: number; // percentage
  errorRateCritical: number; // percentage
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private metricsSubject = new BehaviorSubject<PerformanceMetrics>({
    memoryUsage: 0,
    cpuUsage: 0,
    responseTime: 0,
    pageLoadTime: 0,
    networkLatency: 0,
    errorRate: 0,
    userInteractions: 0,
    timestamp: new Date()
  });

  private thresholds: PerformanceThresholds = {
    memoryWarning: 100, // 100 MB
    memoryCritical: 200, // 200 MB
    responseTimeWarning: 1000, // 1 second
    responseTimeCritical: 3000, // 3 seconds
    errorRateWarning: 5, // 5%
    errorRateCritical: 10 // 10%
  };

  private performanceObserver: PerformanceObserver | null = null;
  private memoryObserver: PerformanceObserver | null = null;
  private errorCount = 0;
  private totalRequests = 0;
  private userInteractionCount = 0;
  private pageLoadStartTime = performance.now();

  public metrics$ = this.metricsSubject.asObservable();

  constructor(private ngZone: NgZone) {
    this.initializePerformanceMonitoring();
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring() {
    // Monitor memory usage
    this.startMemoryMonitoring();
    
    // Monitor page performance
    this.startPagePerformanceMonitoring();
    
    // Monitor user interactions
    this.startUserInteractionMonitoring();
    
    // Monitor network performance
    this.startNetworkMonitoring();
    
    // Start periodic metrics collection
    this.startPeriodicMonitoring();
  }

  // Memory monitoring
  private startMemoryMonitoring() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory) {
        interval(5000) // Check every 5 seconds
          .subscribe(() => {
            const memoryUsageMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
            this.updateMetrics({ memoryUsage: memoryUsageMB });
            
            // Check thresholds
            this.checkMemoryThresholds(memoryUsageMB);
          });
      }
    }
  }

  // Page performance monitoring
  private startPagePerformanceMonitoring() {
    // Monitor page load time
    window.addEventListener('load', () => {
      const loadTime = performance.now() - this.pageLoadStartTime;
      this.updateMetrics({ pageLoadTime: loadTime });
    });

    // Monitor navigation timing
    if ('navigation' in performance) {
      const navigation = (performance as any).navigation;
      if (navigation) {
        const responseTime = navigation.responseEnd - navigation.requestStart;
        this.updateMetrics({ responseTime });
      }
    }

    // Monitor resource timing
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              this.updateMetrics({ 
                networkLatency: resourceEntry.responseStart - resourceEntry.requestStart 
              });
            }
          });
        });
        this.performanceObserver.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error);
      }
    }
  }

  // User interaction monitoring
  private startUserInteractionMonitoring() {
    const interactionEvents = ['click', 'keydown', 'scroll', 'mousemove'];
    
    interactionEvents.forEach(eventType => {
      document.addEventListener(eventType, () => {
        this.userInteractionCount++;
        this.updateMetrics({ userInteractions: this.userInteractionCount });
      }, { passive: true });
    });
  }

  // Network performance monitoring
  private startNetworkMonitoring() {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      this.totalRequests++;
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        this.updateMetrics({ responseTime });
        return response;
      } catch (error) {
        this.errorCount++;
        this.updateErrorRate();
        throw error;
      }
    };

    // Monitor XMLHttpRequest (simplified for now)
    console.log('XMLHttpRequest monitoring initialized');
  }

  // Periodic monitoring
  private startPeriodicMonitoring() {
    interval(10000) // Update every 10 seconds
      .subscribe(() => {
        this.collectMetrics();
      });
  }

  // Collect all metrics
  private collectMetrics() {
    const currentMetrics = this.metricsSubject.value;
    
    // Update error rate
    this.updateErrorRate();
    
    // Update timestamp
    currentMetrics.timestamp = new Date();
    
    this.metricsSubject.next({ ...currentMetrics });
  }

  // Update specific metrics
  private updateMetrics(updates: Partial<PerformanceMetrics>) {
    const currentMetrics = this.metricsSubject.value;
    this.metricsSubject.next({ ...currentMetrics, ...updates });
  }

  // Update error rate
  private updateErrorRate() {
    if (this.totalRequests > 0) {
      const errorRate = (this.errorCount / this.totalRequests) * 100;
      this.updateMetrics({ errorRate });
    }
  }

  // Check memory thresholds
  private checkMemoryThresholds(memoryUsage: number) {
    if (memoryUsage >= this.thresholds.memoryCritical) {
      this.emitPerformanceWarning('CRITICAL', `Memory usage is critical: ${memoryUsage}MB`);
    } else if (memoryUsage >= this.thresholds.memoryWarning) {
      this.emitPerformanceWarning('WARNING', `Memory usage is high: ${memoryUsage}MB`);
    }
  }

  // Check response time thresholds
  private checkResponseTimeThresholds(responseTime: number) {
    if (responseTime >= this.thresholds.responseTimeCritical) {
      this.emitPerformanceWarning('CRITICAL', `Response time is critical: ${responseTime}ms`);
    } else if (responseTime >= this.thresholds.responseTimeWarning) {
      this.emitPerformanceWarning('WARNING', `Response time is slow: ${responseTime}ms`);
    }
  }

  // Check error rate thresholds
  private checkErrorRateThresholds(errorRate: number) {
    if (errorRate >= this.thresholds.errorRateCritical) {
      this.emitPerformanceWarning('CRITICAL', `Error rate is critical: ${errorRate.toFixed(2)}%`);
    } else if (errorRate >= this.thresholds.errorRateWarning) {
      this.emitPerformanceWarning('WARNING', `Error rate is high: ${errorRate.toFixed(2)}%`);
    }
  }

  // Emit performance warnings
  private emitPerformanceWarning(level: 'WARNING' | 'CRITICAL', message: string) {
    const warning = {
      level,
      message,
      timestamp: new Date(),
      metrics: this.metricsSubject.value
    };
    
    // Emit warning event
    this.ngZone.run(() => {
      console.warn(`Performance ${level}:`, warning);
      // You could emit this to a warning service or notification system
    });
  }

  // Public methods for external use
  getCurrentMetrics(): PerformanceMetrics {
    return this.metricsSubject.value;
  }

  getMetricsHistory(): Observable<PerformanceMetrics> {
    return this.metricsSubject.asObservable();
  }

  // Track custom performance metric
  trackCustomMetric(name: string, value: number) {
    const currentMetrics = this.metricsSubject.value;
    (currentMetrics as any)[name] = value;
    this.metricsSubject.next({ ...currentMetrics });
  }

  // Track API call performance
  trackApiCall(url: string, method: string, startTime: number, endTime: number, success: boolean) {
    const duration = endTime - startTime;
    this.totalRequests++;
    
    if (!success) {
      this.errorCount++;
      this.updateErrorRate();
    }
    
    this.updateMetrics({ responseTime: duration });
    
    // Log API performance
    console.log(`API Call: ${method} ${url} - ${duration.toFixed(2)}ms - ${success ? 'SUCCESS' : 'FAILED'}`);
  }

  // Get performance report
  getPerformanceReport(): {
    summary: PerformanceMetrics;
    recommendations: string[];
    health: 'GOOD' | 'WARNING' | 'CRITICAL';
  } {
    const metrics = this.getCurrentMetrics();
    const recommendations: string[] = [];
    let health: 'GOOD' | 'WARNING' | 'CRITICAL' = 'GOOD';

    // Memory recommendations
    if (metrics.memoryUsage >= this.thresholds.memoryCritical) {
      health = 'CRITICAL';
      recommendations.push('Memory usage is critical. Consider optimizing memory usage or increasing available memory.');
    } else if (metrics.memoryUsage >= this.thresholds.memoryWarning) {
      health = 'WARNING';
      recommendations.push('Memory usage is high. Monitor for memory leaks.');
    }

    // Response time recommendations
    if (metrics.responseTime >= this.thresholds.responseTimeCritical) {
      health = 'CRITICAL';
      recommendations.push('Response time is critical. Investigate performance bottlenecks.');
    } else if (metrics.responseTime >= this.thresholds.responseTimeWarning) {
      health = 'WARNING';
      recommendations.push('Response time is slow. Consider optimization.');
    }

    // Error rate recommendations
    if (metrics.errorRate >= this.thresholds.errorRateCritical) {
      health = 'CRITICAL';
      recommendations.push('Error rate is critical. Investigate system stability.');
    } else if (metrics.errorRate >= this.thresholds.errorRateWarning) {
      health = 'WARNING';
      recommendations.push('Error rate is high. Review error handling.');
    }

    return {
      summary: metrics,
      recommendations,
      health
    };
  }

  // Update thresholds
  updateThresholds(newThresholds: Partial<PerformanceThresholds>) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  // Reset metrics
  resetMetrics() {
    this.errorCount = 0;
    this.totalRequests = 0;
    this.userInteractionCount = 0;
    this.pageLoadStartTime = performance.now();
    
    this.metricsSubject.next({
      memoryUsage: 0,
      cpuUsage: 0,
      responseTime: 0,
      pageLoadTime: 0,
      networkLatency: 0,
      errorRate: 0,
      userInteractions: 0,
      timestamp: new Date()
    });
  }

  // Cleanup
  destroy() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    if (this.memoryObserver) {
      this.memoryObserver.disconnect();
    }
  }
}



