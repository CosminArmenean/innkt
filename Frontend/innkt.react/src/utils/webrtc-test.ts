/**
 * WebRTC Connection Test Utility
 * 
 * This utility helps test WebRTC connectivity and TURN server availability
 * to diagnose connection issues.
 */

export interface WebRTCTestResult {
  success: boolean;
  stunWorking: boolean;
  turnWorking: boolean;
  error?: string;
  details: {
    stunServers: string[];
    turnServers: string[];
    iceCandidates: number;
    connectionTime?: number;
  };
}

export class WebRTCTester {
  private readonly TEST_ICE_SERVERS: RTCIceServer[] = [
    // STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    
    // TURN servers - testing multiple options
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:relay1.expressturn.com:3478',
      username: 'efJBwYj8X47Xj3j',
      credential: 'YfY2Bm6Nk8Lk2Kk'
    },
    {
      urls: 'turn:relay2.expressturn.com:3478',
      username: 'efJBwYj8X47Xj3j',
      credential: 'YfY2Bm6Nk8Lk2Kk'
    }
  ];

  /**
   * Test WebRTC connectivity with STUN and TURN servers
   */
  async testConnectivity(): Promise<WebRTCTestResult> {
    const result: WebRTCTestResult = {
      success: false,
      stunWorking: false,
      turnWorking: false,
      details: {
        stunServers: this.TEST_ICE_SERVERS.filter(s => typeof s.urls === 'string' && s.urls.includes('stun:')).map(s => s.urls as string),
        turnServers: this.TEST_ICE_SERVERS.filter(s => typeof s.urls === 'string' && s.urls.includes('turn:')).map(s => s.urls as string),
        iceCandidates: 0
      }
    };

    try {
      console.log('🔍 Testing WebRTC connectivity...');
      
      // Create a test peer connection
      const pc = new RTCPeerConnection({
        iceServers: this.TEST_ICE_SERVERS,
        iceCandidatePoolSize: 10
      });

      const startTime = Date.now();
      let iceCandidates: RTCIceCandidate[] = [];
      let stunCandidates = 0;
      let turnCandidates = 0;

      // Collect ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          iceCandidates.push(event.candidate);
          
          // Check if it's a STUN or TURN candidate
          if (event.candidate.candidate.includes('typ relay')) {
            turnCandidates++;
            result.turnWorking = true;
            console.log('✅ TURN server working - relay candidate found');
          } else if (event.candidate.candidate.includes('typ srflx')) {
            stunCandidates++;
            result.stunWorking = true;
            console.log('✅ STUN server working - reflexive candidate found');
          }
        }
      };

      // Create a data channel to trigger ICE gathering
      pc.createDataChannel('test');

      // Create an offer to start ICE gathering
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering to complete or timeout
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          resolve();
        }, 10000); // 10 second timeout

        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete') {
            clearTimeout(timeout);
            resolve();
          }
        };
      });

      result.details.iceCandidates = iceCandidates.length;
      result.details.connectionTime = Date.now() - startTime;

      // Determine overall success
      result.success = result.stunWorking || result.turnWorking;

      // Clean up
      pc.close();

      console.log('🔍 WebRTC connectivity test completed:', {
        success: result.success,
        stunWorking: result.stunWorking,
        turnWorking: result.turnWorking,
        totalCandidates: iceCandidates.length,
        stunCandidates,
        turnCandidates,
        connectionTime: result.details.connectionTime
      });

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ WebRTC connectivity test failed:', error);
    }

    return result;
  }

  /**
   * Test microphone access
   */
  async testMicrophone(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🎤 Testing microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTracks = stream.getAudioTracks();
      
      if (audioTracks.length > 0) {
        console.log('✅ Microphone access granted');
        stream.getTracks().forEach(track => track.stop());
        return { success: true };
      } else {
        return { success: false, error: 'No audio tracks found' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Microphone access denied:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Run comprehensive WebRTC test
   */
  async runFullTest(): Promise<{
    connectivity: WebRTCTestResult;
    microphone: { success: boolean; error?: string };
  }> {
    console.log('🚀 Starting comprehensive WebRTC test...');
    
    const connectivity = await this.testConnectivity();
    const microphone = await this.testMicrophone();
    
    console.log('📊 Test Results Summary:');
    console.log(`   Connectivity: ${connectivity.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   STUN Servers: ${connectivity.stunWorking ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`   TURN Servers: ${connectivity.turnWorking ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`   Microphone: ${microphone.success ? '✅ ACCESSIBLE' : '❌ BLOCKED'}`);
    
    if (connectivity.error) {
      console.log(`   Error: ${connectivity.error}`);
    }
    if (microphone.error) {
      console.log(`   Microphone Error: ${microphone.error}`);
    }
    
    return { connectivity, microphone };
  }
}

// Export a singleton instance
export const webrtcTester = new WebRTCTester();
