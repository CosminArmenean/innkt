/**
 * User Presence Manager
 * Tracks connected users and their status via SignalR events
 */

export interface UserPresence {
  userId: string;
  username: string;
  displayName?: string;
  status: 'online' | 'offline' | 'busy' | 'away' | 'in-call';
  lastSeen: number;
  profilePictureUrl?: string;
}

export interface PresenceEvent {
  type: 'user-online' | 'user-offline' | 'user-status-change' | 'user-in-call' | 'user-available';
  userId: string;
  user?: UserPresence;
  timestamp: number;
}

export class UserPresenceManager {
  private users: Map<string, UserPresence> = new Map();
  private eventHandlers: Map<string, Function[]> = new Map();
  private currentUserId: string | null = null;
  private lastHeartbeat: number = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    console.log('UserPresenceManager: Initialized');
  }

  /**
   * Set current user ID
   */
  setCurrentUserId(userId: string): void {
    console.log('UserPresenceManager: Setting current user ID:', userId);
    this.currentUserId = userId;
    this.startHeartbeat();
  }

  /**
   * Add event listener
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
    console.log(`UserPresenceManager: Added listener for '${event}' event`);
  }

  /**
   * Remove event listener
   */
  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        console.log(`UserPresenceManager: Removed listener for '${event}' event`);
      }
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`UserPresenceManager: Error in event handler for '${event}':`, error);
        }
      });
    }
  }

  /**
   * Handle user online event
   */
  handleUserOnline(data: any): void {
    console.log('UserPresenceManager: User came online:', data);
    
    const user: UserPresence = {
      userId: data.userId,
      username: data.username,
      displayName: data.displayName,
      status: 'online',
      lastSeen: Date.now(),
      profilePictureUrl: data.profilePictureUrl
    };

    this.users.set(data.userId, user);
    
    this.emit('user-online', {
      type: 'user-online',
      userId: data.userId,
      user,
      timestamp: Date.now()
    });
  }

  /**
   * Handle user offline event
   */
  handleUserOffline(data: any): void {
    console.log('UserPresenceManager: User went offline:', data);
    
    const existingUser = this.users.get(data.userId);
    if (existingUser) {
      existingUser.status = 'offline';
      existingUser.lastSeen = Date.now();
      this.users.set(data.userId, existingUser);
    }

    this.emit('user-offline', {
      type: 'user-offline',
      userId: data.userId,
      timestamp: Date.now()
    });
  }

  /**
   * Handle user status change event
   */
  handleUserStatusChange(data: any): void {
    console.log('UserPresenceManager: User status changed:', data);
    
    const existingUser = this.users.get(data.userId);
    if (existingUser) {
      existingUser.status = data.status;
      existingUser.lastSeen = Date.now();
      this.users.set(data.userId, existingUser);
    }

    this.emit('user-status-change', {
      type: 'user-status-change',
      userId: data.userId,
      user: existingUser,
      timestamp: Date.now()
    });
  }

  /**
   * Handle user in call event
   */
  handleUserInCall(data: any): void {
    console.log('UserPresenceManager: User is in call:', data);
    
    const existingUser = this.users.get(data.userId);
    if (existingUser) {
      existingUser.status = 'in-call';
      existingUser.lastSeen = Date.now();
      this.users.set(data.userId, existingUser);
    }

    this.emit('user-in-call', {
      type: 'user-in-call',
      userId: data.userId,
      user: existingUser,
      timestamp: Date.now()
    });
  }

  /**
   * Handle user available event
   */
  handleUserAvailable(data: any): void {
    console.log('UserPresenceManager: User is available:', data);
    
    const existingUser = this.users.get(data.userId);
    if (existingUser) {
      existingUser.status = 'online';
      existingUser.lastSeen = Date.now();
      this.users.set(data.userId, existingUser);
    }

    this.emit('user-available', {
      type: 'user-available',
      userId: data.userId,
      user: existingUser,
      timestamp: Date.now()
    });
  }

  /**
   * Get user presence
   */
  getUserPresence(userId: string): UserPresence | null {
    return this.users.get(userId) || null;
  }

  /**
   * Get all users
   */
  getAllUsers(): UserPresence[] {
    return Array.from(this.users.values());
  }

  /**
   * Get online users
   */
  getOnlineUsers(): UserPresence[] {
    return Array.from(this.users.values()).filter(user => 
      user.status === 'online' || user.status === 'away'
    );
  }

  /**
   * Get users available for calls (online and not in call)
   */
  getAvailableUsers(): UserPresence[] {
    return Array.from(this.users.values()).filter(user => 
      user.status === 'online' || user.status === 'away'
    );
  }

  /**
   * Get users in call
   */
  getUsersInCall(): UserPresence[] {
    return Array.from(this.users.values()).filter(user => 
      user.status === 'in-call' || user.status === 'busy'
    );
  }

  /**
   * Update current user status
   */
  updateCurrentUserStatus(status: UserPresence['status']): void {
    if (!this.currentUserId) return;

    const user = this.users.get(this.currentUserId);
    if (user) {
      user.status = status;
      user.lastSeen = Date.now();
      this.users.set(this.currentUserId, user);

      this.emit('user-status-change', {
        type: 'user-status-change',
        userId: this.currentUserId,
        user,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Set user as in call
   */
  setUserInCall(userId: string, callId?: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.status = 'in-call';
      user.lastSeen = Date.now();
      this.users.set(userId, user);

      this.emit('user-in-call', {
        type: 'user-in-call',
        userId,
        user,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Set user as available
   */
  setUserAvailable(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.status = 'online';
      user.lastSeen = Date.now();
      this.users.set(userId, user);

      this.emit('user-available', {
        type: 'user-available',
        userId,
        user,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Check if user is available for calls
   */
  isUserAvailable(userId: string): boolean {
    const user = this.users.get(userId);
    return user ? (user.status === 'online' || user.status === 'away') : false;
  }

  /**
   * Check if user is in call
   */
  isUserInCall(userId: string): boolean {
    const user = this.users.get(userId);
    return user ? (user.status === 'in-call' || user.status === 'busy') : false;
  }

  /**
   * Start heartbeat to maintain presence
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.currentUserId) {
        this.lastHeartbeat = Date.now();
        // Emit heartbeat event that can be handled by the caller
        this.emit('heartbeat', {
          userId: this.currentUserId,
          timestamp: this.lastHeartbeat
        });
      }
    }, 30000); // Send heartbeat every 30 seconds

    console.log('UserPresenceManager: Heartbeat started');
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('UserPresenceManager: Heartbeat stopped');
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopHeartbeat();
    this.eventHandlers.clear();
    this.users.clear();
    this.currentUserId = null;
    console.log('UserPresenceManager: Disposed');
  }

  /**
   * Get presence statistics
   */
  getStats(): {
    totalUsers: number;
    onlineUsers: number;
    availableUsers: number;
    usersInCall: number;
    offlineUsers: number;
  } {
    const allUsers = Array.from(this.users.values());
    
    return {
      totalUsers: allUsers.length,
      onlineUsers: allUsers.filter(u => u.status === 'online' || u.status === 'away').length,
      availableUsers: allUsers.filter(u => u.status === 'online' || u.status === 'away').length,
      usersInCall: allUsers.filter(u => u.status === 'in-call' || u.status === 'busy').length,
      offlineUsers: allUsers.filter(u => u.status === 'offline').length
    };
  }
}

// Export singleton instance
export const userPresenceManager = new UserPresenceManager();
