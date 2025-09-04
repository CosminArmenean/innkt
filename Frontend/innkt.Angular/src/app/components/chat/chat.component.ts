import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

import { TranslateModule } from '@ngx-translate/core';

interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  isOwn: boolean;
}

interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: Date;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  messages: ChatMessage[] = [];
  onlineUsers: ChatUser[] = [];
  newMessage = '';
  selectedUser: ChatUser | null = null;

  constructor() {}

  ngOnInit(): void {
    this.loadMockData();
  }

  loadMockData(): void {
    // Mock online users
    this.onlineUsers = [
      { id: '1', name: 'John Doe', avatar: 'assets/avatars/user1.jpg', isOnline: true },
      { id: '2', name: 'Jane Smith', avatar: 'assets/avatars/user2.jpg', isOnline: true },
      { id: '3', name: 'Bob Johnson', avatar: 'assets/avatars/user3.jpg', isOnline: false, lastSeen: new Date() }
    ];

    // Mock messages
    this.messages = [
      { id: '1', content: 'Hello! How are you?', sender: 'John Doe', timestamp: new Date(), isOwn: false },
      { id: '2', content: 'I\'m doing great, thanks!', sender: 'Me', timestamp: new Date(), isOwn: true },
      { id: '3', content: 'What about you?', sender: 'Me', timestamp: new Date(), isOwn: true }
    ];
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        content: this.newMessage,
        sender: 'Me',
        timestamp: new Date(),
        isOwn: true
      };
      
      this.messages.push(message);
      this.newMessage = '';
      
      // Scroll to bottom
      setTimeout(() => {
        const chatContainer = document.querySelector('.chat-messages');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
    }
  }

  selectUser(user: ChatUser): void {
    this.selectedUser = user;
  }

  getOnlineUsersCount(): number {
    return this.onlineUsers.filter(user => user.isOnline).length;
  }
}
