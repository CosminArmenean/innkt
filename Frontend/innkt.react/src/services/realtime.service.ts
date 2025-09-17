import { apiConfig } from './api.config';

/**
 * Real-time service using Server-Sent Events (SSE) for instant updates
 * Connects to MongoDB Change Streams via SSE endpoint
 */
export interface RealtimeEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  data: any;
  userId?: string;
}

export interface PostEvent extends RealtimeEvent {
  eventType: 'new_post' | 'post_updated' | 'post_liked' | 'post_commented';
  data: {
    postId: string;
    authorId: string;
    postType?: string;
    hasMedia?: boolean;
    isPoll?: boolean;
    content?: string;
    likesCount?: number;
    commentsCount?: number;
  };
}

export interface PollEvent extends RealtimeEvent {
  eventType: 'poll_voted';
  data: {
    postId: string;
    voterId: string;
    selectedOption: string;
    currentResults?: any;
  };
}

export type RealtimeEventHandler = (event: RealtimeEvent) => void;

export class RealtimeService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnected = false;
  private eventHandlers: Map<string, RealtimeEventHandler[]> = new Map();

  constructor() {
    console.log('🚀 RealtimeService initialized - ready for Change Streams!');
  }

  /**
   * Connect to the SSE endpoint for real-time updates
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.eventSource) {
        console.warn('SSE connection already exists');
        resolve();
        return;
      }

      try {
        // Get auth token for SSE connection
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.warn('No auth token found - using anonymous SSE connection');
        }

        // Create SSE connection with auth header
        const url = `${apiConfig.socialApi.baseUrl}/api/realtime/events`;
        
        // Note: EventSource doesn't support custom headers directly
        // For now, we'll make it work without auth (AllowAnonymous on endpoint)
        // In production, you'd use WebSockets or pass token as query param
        this.eventSource = new EventSource(url);

        // Connection opened
        this.eventSource.onopen = () => {
          console.log('✅ SSE connection established - MongoDB Change Streams active!');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          resolve();
        };

        // Handle connection events
        this.eventSource.addEventListener('connected', (event) => {
          const data = JSON.parse(event.data);
          console.log('🎉 Connected to real-time events:', data);
        });

        // Handle new post events from Change Streams
        this.eventSource.addEventListener('new_post', (event) => {
          const postEvent: PostEvent = JSON.parse(event.data);
          console.log('📬 New post via Change Streams:', postEvent);
          this.triggerEventHandlers('new_post', postEvent);
        });

        // Handle post update events
        this.eventSource.addEventListener('post_updated', (event) => {
          const postEvent: PostEvent = JSON.parse(event.data);
          console.log('🔄 Post updated via Change Streams:', postEvent);
          this.triggerEventHandlers('post_updated', postEvent);
        });

        // Handle post like events
        this.eventSource.addEventListener('post_liked', (event) => {
          const postEvent: PostEvent = JSON.parse(event.data);
          console.log('❤️ Post liked via Change Streams:', postEvent);
          this.triggerEventHandlers('post_liked', postEvent);
        });

        // Handle poll vote events
        this.eventSource.addEventListener('poll_voted', (event) => {
          const pollEvent: PollEvent = JSON.parse(event.data);
          console.log('🗳️ Poll voted via Change Streams:', pollEvent);
          this.triggerEventHandlers('poll_voted', pollEvent);
        });

        // Handle heartbeat
        this.eventSource.addEventListener('heartbeat', (event) => {
          const data = JSON.parse(event.data);
          console.log('💓 SSE heartbeat:', data.timestamp);
        });

        // Handle errors and reconnection
        this.eventSource.onerror = (error) => {
          console.error('❌ SSE connection error:', error);
          this.isConnected = false;
          this.handleReconnection();
        };

      } catch (error) {
        console.error('Failed to create SSE connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from SSE
   */
  public disconnect(): void {
    if (this.eventSource) {
      console.log('🔌 Disconnecting from SSE...');
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if SSE is connected
   */
  public isConnectionActive(): boolean {
    return this.isConnected && this.eventSource?.readyState === EventSource.OPEN;
  }

  /**
   * Subscribe to specific event types
   */
  public on(eventType: string, handler: RealtimeEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Unsubscribe from events
   */
  public off(eventType: string, handler: RealtimeEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Subscribe to new post events specifically
   */
  public onNewPost(handler: (event: PostEvent) => void): void {
    this.on('new_post', handler as RealtimeEventHandler);
  }

  /**
   * Subscribe to post update events
   */
  public onPostUpdated(handler: (event: PostEvent) => void): void {
    this.on('post_updated', handler as RealtimeEventHandler);
  }

  /**
   * Subscribe to poll vote events
   */
  public onPollVoted(handler: (event: PollEvent) => void): void {
    this.on('poll_voted', handler as RealtimeEventHandler);
  }

  private triggerEventHandlers(eventType: string, event: RealtimeEvent): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
        }
      });
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max SSE reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting SSE reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms...`);

    setTimeout(() => {
      this.disconnect();
      this.connect().catch(error => {
        console.error('SSE reconnection failed:', error);
        this.reconnectDelay *= 2; // Exponential backoff
        this.handleReconnection();
      });
    }, this.reconnectDelay);
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
