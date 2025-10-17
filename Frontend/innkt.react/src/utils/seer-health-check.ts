/**
 * Seer Service Health Check Utility
 * 
 * This utility helps check if the Seer service is running and accessible
 * before attempting to make calls.
 */

export interface SeerHealthResult {
  isHealthy: boolean;
  status: 'online' | 'offline' | 'error';
  error?: string;
  responseTime?: number;
  version?: string;
}

export class SeerHealthChecker {
  private readonly SEER_BASE_URL = 'http://localhost:5267';

  /**
   * Check if Seer service is healthy and accessible
   */
  async checkHealth(): Promise<SeerHealthResult> {
    const startTime = Date.now();
    
    try {
      console.log('🏥 Checking Seer service health...');
      
      const response = await fetch(`${this.SEER_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Seer service is healthy:', data);
        
        return {
          isHealthy: true,
          status: 'online',
          responseTime,
          version: data.version || 'unknown'
        };
      } else {
        console.warn('⚠️ Seer service responded with error:', response.status, response.statusText);
        return {
          isHealthy: false,
          status: 'error',
          error: `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('❌ Seer service health check failed:', errorMessage);
      
      return {
        isHealthy: false,
        status: 'offline',
        error: errorMessage,
        responseTime
      };
    }
  }

  /**
   * Check if Seer service API endpoints are accessible
   */
  async checkApiEndpoints(): Promise<{
    startCall: boolean;
    health: boolean;
    errors: string[];
  }> {
    const results = {
      startCall: false,
      health: false,
      errors: [] as string[]
    };

    try {
      // Test health endpoint
      try {
        const healthResponse = await fetch(`${this.SEER_BASE_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        results.health = healthResponse.ok;
        if (!healthResponse.ok) {
          results.errors.push(`Health endpoint: HTTP ${healthResponse.status}`);
        }
      } catch (error) {
        results.errors.push(`Health endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Test call endpoint (just check if it exists, don't actually start a call)
      try {
        const callResponse = await fetch(`${this.SEER_BASE_URL}/api/call`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        // We expect 404 or 405 for GET on /api/call, which means the endpoint exists
        results.startCall = callResponse.status === 404 || callResponse.status === 405;
        if (!results.startCall && callResponse.status !== 200) {
          results.errors.push(`Call endpoint: HTTP ${callResponse.status}`);
        }
      } catch (error) {
        results.errors.push(`Call endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    } catch (error) {
      results.errors.push(`General API check: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return results;
  }

  /**
   * Run comprehensive Seer service check
   */
  async runFullCheck(): Promise<{
    health: SeerHealthResult;
    apiEndpoints: { startCall: boolean; health: boolean; errors: string[] };
  }> {
    console.log('🔍 Running comprehensive Seer service check...');
    
    const health = await this.checkHealth();
    const apiEndpoints = await this.checkApiEndpoints();
    
    console.log('📊 Seer Service Check Results:');
    console.log(`   Health: ${health.isHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    console.log(`   Status: ${health.status}`);
    console.log(`   Response Time: ${health.responseTime}ms`);
    console.log(`   API Endpoints: ${apiEndpoints.startCall ? '✅ ACCESSIBLE' : '❌ INACCESSIBLE'}`);
    
    if (health.error) {
      console.log(`   Health Error: ${health.error}`);
    }
    if (apiEndpoints.errors.length > 0) {
      console.log(`   API Errors: ${apiEndpoints.errors.join(', ')}`);
    }
    
    return { health, apiEndpoints };
  }
}

// Export a singleton instance
export const seerHealthChecker = new SeerHealthChecker();
