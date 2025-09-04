import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { ChatMessage, ChatRoom } from '../components/chat/chat.component';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly API_BASE_URL = 'https://localhost:5002/api';
  
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private typingUsersSubject = new BehaviorSubject<Set<string>>(new Set());
  private onlineUsersSubject = new BehaviorSubject<string[]>([]);

  public messages$ = this.messagesSubject.asObservable();
  public typingUsers$ = this.typingUsersSubject.asObservable();
  public onlineUsers$ = this.onlineUsersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Chat Rooms
  getChatRooms(): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(`${this.API_BASE_URL}/chat/rooms`);
  }

  createChatRoom(participants: string[], isGroup: boolean = false, name?: string): Observable<ChatRoom> {
    return this.http.post<ChatRoom>(`${this.API_BASE_URL}/chat/rooms`, {
      participants,
      isGroup,
      name: name || `Chat with ${participants.length} people`
    });
  }

  deleteChatRoom(roomId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/chat/rooms/${roomId}`);
  }

  // Messages
  getMessages(roomId: string, page: number = 0, pageSize: number = 50): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.API_BASE_URL}/chat/rooms/${roomId}/messages`, {
      params: { page: page.toString(), pageSize: pageSize.toString() }
    });
  }

  getNewMessages(roomId: string, lastMessageIndex: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.API_BASE_URL}/chat/rooms/${roomId}/messages/new`, {
      params: { lastIndex: lastMessageIndex.toString() }
    });
  }

  sendMessage(roomId: string, message: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead'>): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.API_BASE_URL}/chat/rooms/${roomId}/messages`, message)
      .pipe(
        tap(sentMessage => {
          // Update local messages
          const currentMessages = this.messagesSubject.value;
          this.messagesSubject.next([...currentMessages, sentMessage]);
        })
      );
  }

  sendFile(roomId: string, file: File, message: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead'>): Observable<ChatMessage> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('message', JSON.stringify(message));

    return this.http.post<ChatMessage>(`${this.API_BASE_URL}/chat/rooms/${roomId}/files`, formData)
      .pipe(
        tap(sentMessage => {
          // Update local messages
          const currentMessages = this.messagesSubject.value;
          this.messagesSubject.next([...currentMessages, sentMessage]);
        })
      );
  }

  deleteMessage(messageId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/chat/messages/${messageId}`);
  }

  editMessage(messageId: string, newContent: string): Observable<ChatMessage> {
    return this.http.put<ChatMessage>(`${this.API_BASE_URL}/chat/messages/${messageId}`, {
      content: newContent
    });
  }

  // Message Status
  markMessageAsRead(messageId: string): Observable<void> {
    return this.http.put<void>(`${this.API_BASE_URL}/chat/messages/${messageId}/read`, {});
  }

  markRoomAsRead(roomId: string): Observable<void> {
    return this.http.put<void>(`${this.API_BASE_URL}/chat/rooms/${roomId}/read`, {});
  }

  // Typing Indicators
  sendTypingIndicator(roomId: string, userId: string): Observable<void> {
    return this.http.post<void>(`${this.API_BASE_URL}/chat/rooms/${roomId}/typing`, { userId });
  }

  stopTypingIndicator(roomId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/chat/rooms/${roomId}/typing/${userId}`);
  }

  // Online Users
  getOnlineUsers(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_BASE_URL}/chat/users/online`);
  }

  // Chat Search
  searchMessages(roomId: string, query: string, page: number = 0, pageSize: number = 20): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.API_BASE_URL}/chat/rooms/${roomId}/search`, {
      params: { q: query, page: page.toString(), pageSize: pageSize.toString() }
    });
  }

  searchChats(query: string): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(`${this.API_BASE_URL}/chat/search`, {
      params: { q: query }
    });
  }

  // Chat Statistics
  getChatStatistics(roomId: string): Observable<{
    totalMessages: number;
    totalParticipants: number;
    averageResponseTime: number;
    mostActiveUser: string;
  }> {
    return this.http.get<{
      totalMessages: number;
      totalParticipants: number;
      averageResponseTime: number;
      mostActiveUser: string;
    }>(`${this.API_BASE_URL}/chat/rooms/${roomId}/statistics`);
  }

  // User Chat History
  getUserChatHistory(userId: string, page: number = 0, pageSize: number = 20): Observable<{
    messages: ChatMessage[];
    totalCount: number;
  }> {
    return this.http.get<{
      messages: ChatMessage[];
      totalCount: number;
    }>(`${this.API_BASE_URL}/chat/users/${userId}/history`, {
      params: { page: page.toString(), pageSize: pageSize.toString() }
    });
  }

  // Chat Notifications
  getUnreadCount(): Observable<{ [roomId: string]: number }> {
    return this.http.get<{ [roomId: string]: number }>(`${this.API_BASE_URL}/chat/unread-count`);
  }

  // Chat Settings
  updateChatSettings(roomId: string, settings: {
    notifications?: boolean;
    sound?: boolean;
    theme?: 'light' | 'dark';
    language?: string;
  }): Observable<void> {
    return this.http.put<void>(`${this.API_BASE_URL}/chat/rooms/${roomId}/settings`, settings);
  }

  getChatSettings(roomId: string): Observable<{
    notifications: boolean;
    sound: boolean;
    theme: 'light' | 'dark';
    language: string;
  }> {
    return this.http.get<{
      notifications: boolean;
      sound: boolean;
      theme: 'light' | 'dark';
      language: string;
    }>(`${this.API_BASE_URL}/chat/rooms/${roomId}/settings`);
  }

  // Real-time Updates (Simulated with polling)
  startRealTimeUpdates(roomId: string): Observable<ChatMessage[]> {
    return interval(3000).pipe(
      switchMap(() => this.getNewMessages(roomId, this.messagesSubject.value.length))
    );
  }

  // Local State Management
  getCachedMessages(): ChatMessage[] {
    return this.messagesSubject.value;
  }

  getCachedTypingUsers(): Set<string> {
    return this.typingUsersSubject.value;
  }

  getCachedOnlineUsers(): string[] {
    return this.onlineUsersSubject.value;
  }

  // Clear local state
  clearLocalState(): void {
    this.messagesSubject.next([]);
    this.typingUsersSubject.next(new Set());
    this.onlineUsersSubject.next([]);
  }

  // Update local typing users
  updateTypingUsers(roomId: string, userId: string, isTyping: boolean): void {
    const currentTyping = this.typingUsersSubject.value;
    if (isTyping) {
      currentTyping.add(userId);
    } else {
      currentTyping.delete(userId);
    }
    this.typingUsersSubject.next(new Set(currentTyping));
  }

  // Update local online users
  updateOnlineUsers(users: string[]): void {
    this.onlineUsersSubject.next(users);
  }
}





