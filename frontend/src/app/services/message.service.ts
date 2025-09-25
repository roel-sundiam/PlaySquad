import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface Message {
  _id: string;
  club: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  content: string;
  type: 'text' | 'system' | 'event' | 'announcement';
  metadata?: {
    eventId?: string;
    edited?: boolean;
    editedAt?: Date;
    mentioned?: string[];
  };
  replies?: {
    user: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    content: string;
    createdAt: Date;
  }[];
  reactions?: {
    user: string;
    emoji: string;
    createdAt: Date;
  }[];
  readBy?: {
    user: string;
    readAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MessagesData {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(private api: ApiService) { }

  getClubMessages(clubId: string, page: number = 1, limit: number = 50): Observable<ApiResponse<MessagesData>> {
    return this.api.get<MessagesData>(`messages/club/${clubId}?page=${page}&limit=${limit}`);
  }

  getMessagesBefore(clubId: string, messageId: string, limit: number = 50): Observable<ApiResponse<MessagesData>> {
    return this.api.get<MessagesData>(`messages/club/${clubId}?before=${messageId}&limit=${limit}`);
  }

  sendMessage(clubId: string, content: string, type: string = 'text', eventId?: string): Observable<ApiResponse<Message>> {
    const payload: any = { content, type };
    if (eventId) {
      payload.eventId = eventId;
    }
    return this.api.post<Message>(`messages/club/${clubId}`, payload);
  }

  editMessage(messageId: string, content: string): Observable<ApiResponse<Message>> {
    return this.api.put<Message>(`messages/${messageId}`, { content });
  }

  deleteMessage(messageId: string): Observable<ApiResponse<any>> {
    return this.api.delete<any>(`messages/${messageId}`);
  }

  addReaction(messageId: string, emoji: string): Observable<ApiResponse<any>> {
    return this.api.post<any>(`messages/${messageId}/reactions`, { emoji });
  }

  removeReaction(messageId: string, emoji: string): Observable<ApiResponse<any>> {
    return this.api.delete<any>(`messages/${messageId}/reactions/${emoji}`);
  }

  addReply(messageId: string, content: string): Observable<ApiResponse<any>> {
    return this.api.post<any>(`messages/${messageId}/replies`, { content });
  }
}