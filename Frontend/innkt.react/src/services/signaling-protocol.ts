/**
 * Structured Signaling Protocol for WebRTC
 * Implements JSON-based message types for clear, extensible communication
 */

export enum SignalingMessageType {
  OFFER = 'offer',
  ANSWER = 'answer',
  ICE_CANDIDATE = 'ice-candidate',
  HANG_UP = 'hang-up',
  CALL_STARTED = 'call-started',
  CALL_ANSWERED = 'call-answered',
  CALL_REJECTED = 'call-rejected',
  CALL_ENDED = 'call-ended',
  USER_PRESENCE = 'user-presence',
  NEGOTIATION_NEEDED = 'negotiation-needed',
  CONNECTION_STATE_CHANGE = 'connection-state-change'
}

export interface BaseSignalingMessage {
  type: SignalingMessageType;
  timestamp: number;
  callId: string;
  fromUserId: string;
  toUserId: string;
}

export interface OfferMessage extends BaseSignalingMessage {
  type: SignalingMessageType.OFFER;
  sdp: string;
  callType: 'voice' | 'video';
}

export interface AnswerMessage extends BaseSignalingMessage {
  type: SignalingMessageType.ANSWER;
  sdp: string;
}

export interface IceCandidateMessage extends BaseSignalingMessage {
  type: SignalingMessageType.ICE_CANDIDATE;
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

export interface HangUpMessage extends BaseSignalingMessage {
  type: SignalingMessageType.HANG_UP;
  reason?: string;
}

export interface CallStartedMessage extends BaseSignalingMessage {
  type: SignalingMessageType.CALL_STARTED;
  callType: 'voice' | 'video';
  conversationId?: string;
}

export interface CallAnsweredMessage extends BaseSignalingMessage {
  type: SignalingMessageType.CALL_ANSWERED;
}

export interface CallRejectedMessage extends BaseSignalingMessage {
  type: SignalingMessageType.CALL_REJECTED;
  reason?: string;
}

export interface CallEndedMessage extends BaseSignalingMessage {
  type: SignalingMessageType.CALL_ENDED;
  endedBy: string;
  reason?: string;
}

export interface UserPresenceMessage extends BaseSignalingMessage {
  type: SignalingMessageType.USER_PRESENCE;
  status: 'online' | 'offline' | 'busy' | 'away';
  lastSeen?: number;
}

export interface NegotiationNeededMessage extends BaseSignalingMessage {
  type: SignalingMessageType.NEGOTIATION_NEEDED;
}

export interface ConnectionStateChangeMessage extends BaseSignalingMessage {
  type: SignalingMessageType.CONNECTION_STATE_CHANGE;
  state: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
  previousState?: string;
}

export type SignalingMessage = 
  | OfferMessage
  | AnswerMessage
  | IceCandidateMessage
  | HangUpMessage
  | CallStartedMessage
  | CallAnsweredMessage
  | CallRejectedMessage
  | CallEndedMessage
  | UserPresenceMessage
  | NegotiationNeededMessage
  | ConnectionStateChangeMessage;

/**
 * Signaling Protocol Manager
 * Handles message creation, validation, and routing
 */
export class SignalingProtocol {
  /**
   * Create a signaling message
   */
  static createMessage<T extends BaseSignalingMessage>(
    type: SignalingMessageType,
    callId: string,
    fromUserId: string,
    toUserId: string,
    data: Partial<T>
  ): T {
    const message = {
      type,
      timestamp: Date.now(),
      callId,
      fromUserId,
      toUserId,
      ...data
    } as T;

    this.validateMessage(message);
    return message;
  }

  /**
   * Validate signaling message structure
   */
  static validateMessage(message: any): message is SignalingMessage {
    if (!message || typeof message !== 'object') {
      throw new Error('Invalid message: must be an object');
    }

    if (!Object.values(SignalingMessageType).includes(message.type)) {
      throw new Error(`Invalid message type: ${message.type}`);
    }

    if (!message.callId || typeof message.callId !== 'string') {
      throw new Error('Invalid callId: must be a non-empty string');
    }

    if (!message.fromUserId || typeof message.fromUserId !== 'string') {
      throw new Error('Invalid fromUserId: must be a non-empty string');
    }

    if (!message.toUserId || typeof message.toUserId !== 'string') {
      throw new Error('Invalid toUserId: must be a non-empty string');
    }

    if (typeof message.timestamp !== 'number' || message.timestamp <= 0) {
      throw new Error('Invalid timestamp: must be a positive number');
    }

    return true;
  }

  /**
   * Create offer message
   */
  static createOffer(
    callId: string,
    fromUserId: string,
    toUserId: string,
    sdp: string,
    callType: 'voice' | 'video'
  ): OfferMessage {
    return this.createMessage<OfferMessage>(
      SignalingMessageType.OFFER,
      callId,
      fromUserId,
      toUserId,
      { sdp, callType }
    );
  }

  /**
   * Create answer message
   */
  static createAnswer(
    callId: string,
    fromUserId: string,
    toUserId: string,
    sdp: string
  ): AnswerMessage {
    return this.createMessage<AnswerMessage>(
      SignalingMessageType.ANSWER,
      callId,
      fromUserId,
      toUserId,
      { sdp }
    );
  }

  /**
   * Create ICE candidate message
   */
  static createIceCandidate(
    callId: string,
    fromUserId: string,
    toUserId: string,
    candidate: string,
    sdpMid: string | null,
    sdpMLineIndex: number | null
  ): IceCandidateMessage {
    return this.createMessage<IceCandidateMessage>(
      SignalingMessageType.ICE_CANDIDATE,
      callId,
      fromUserId,
      toUserId,
      { candidate, sdpMid, sdpMLineIndex }
    );
  }

  /**
   * Create hang up message
   */
  static createHangUp(
    callId: string,
    fromUserId: string,
    toUserId: string,
    reason?: string
  ): HangUpMessage {
    return this.createMessage<HangUpMessage>(
      SignalingMessageType.HANG_UP,
      callId,
      fromUserId,
      toUserId,
      { reason }
    );
  }

  /**
   * Create call started message
   */
  static createCallStarted(
    callId: string,
    fromUserId: string,
    toUserId: string,
    callType: 'voice' | 'video',
    conversationId?: string
  ): CallStartedMessage {
    return this.createMessage<CallStartedMessage>(
      SignalingMessageType.CALL_STARTED,
      callId,
      fromUserId,
      toUserId,
      { callType, conversationId }
    );
  }

  /**
   * Create call answered message
   */
  static createCallAnswered(
    callId: string,
    fromUserId: string,
    toUserId: string
  ): CallAnsweredMessage {
    return this.createMessage<CallAnsweredMessage>(
      SignalingMessageType.CALL_ANSWERED,
      callId,
      fromUserId,
      toUserId,
      {}
    );
  }

  /**
   * Create call rejected message
   */
  static createCallRejected(
    callId: string,
    fromUserId: string,
    toUserId: string,
    reason?: string
  ): CallRejectedMessage {
    return this.createMessage<CallRejectedMessage>(
      SignalingMessageType.CALL_REJECTED,
      callId,
      fromUserId,
      toUserId,
      { reason }
    );
  }

  /**
   * Create call ended message
   */
  static createCallEnded(
    callId: string,
    fromUserId: string,
    toUserId: string,
    endedBy: string,
    reason?: string
  ): CallEndedMessage {
    return this.createMessage<CallEndedMessage>(
      SignalingMessageType.CALL_ENDED,
      callId,
      fromUserId,
      toUserId,
      { endedBy, reason }
    );
  }

  /**
   * Create user presence message
   */
  static createUserPresence(
    callId: string,
    fromUserId: string,
    toUserId: string,
    status: 'online' | 'offline' | 'busy' | 'away',
    lastSeen?: number
  ): UserPresenceMessage {
    return this.createMessage<UserPresenceMessage>(
      SignalingMessageType.USER_PRESENCE,
      callId,
      fromUserId,
      toUserId,
      { status, lastSeen }
    );
  }

  /**
   * Create negotiation needed message
   */
  static createNegotiationNeeded(
    callId: string,
    fromUserId: string,
    toUserId: string
  ): NegotiationNeededMessage {
    return this.createMessage<NegotiationNeededMessage>(
      SignalingMessageType.NEGOTIATION_NEEDED,
      callId,
      fromUserId,
      toUserId,
      {}
    );
  }

  /**
   * Create connection state change message
   */
  static createConnectionStateChange(
    callId: string,
    fromUserId: string,
    toUserId: string,
    state: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed',
    previousState?: string
  ): ConnectionStateChangeMessage {
    return this.createMessage<ConnectionStateChangeMessage>(
      SignalingMessageType.CONNECTION_STATE_CHANGE,
      callId,
      fromUserId,
      toUserId,
      { state, previousState }
    );
  }

  /**
   * Parse and validate incoming message
   */
  static parseMessage(rawMessage: any): SignalingMessage {
    try {
      this.validateMessage(rawMessage);
      return rawMessage as SignalingMessage;
    } catch (error) {
      console.error('Failed to parse signaling message:', error);
      throw new Error(`Invalid signaling message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get message type from raw message
   */
  static getMessageType(message: any): SignalingMessageType | null {
    try {
      if (message && typeof message === 'object' && message.type) {
        return message.type as SignalingMessageType;
      }
    } catch (error) {
      console.error('Failed to get message type:', error);
    }
    return null;
  }

  /**
   * Check if message is expired (older than 30 seconds)
   */
  static isMessageExpired(message: SignalingMessage, maxAge: number = 30000): boolean {
    const now = Date.now();
    return (now - message.timestamp) > maxAge;
  }

  /**
   * Log message for debugging
   */
  static logMessage(message: SignalingMessage, direction: 'sent' | 'received'): void {
    const arrow = direction === 'sent' ? '📤' : '📥';
    console.log(`${arrow} Signaling Message [${message.type}]`, {
      callId: message.callId,
      from: message.fromUserId,
      to: message.toUserId,
      timestamp: new Date(message.timestamp).toISOString(),
      direction
    });
  }
}
