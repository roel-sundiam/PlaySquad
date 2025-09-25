import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { SocketService } from './socket.service';

export interface Notification {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  type: 'event-published' | 'event-updated' | 'event-cancelled' | 'event-reminder' | 'join-request-approved' | 'join-request-rejected' | 'new-member-joined' | 'system';
  title: string;
  message: string;
  data: {
    club?: {
      _id: string;
      name: string;
    };
    event?: {
      _id: string;
      title: string;
      date: string;
      location: string;
      status?: string;
    };
    additionalData?: any;
  };
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  pagination: {
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private showNotificationPopupSubject = new BehaviorSubject<Notification | null>(null);

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();
  public showNotificationPopup$ = this.showNotificationPopupSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private socketService: SocketService
  ) {
    this.initializeSocketListeners();
    this.loadInitialNotifications();
  }

  private initializeSocketListeners(): void {
    // Listen for real-time event notifications using SocketService methods
    this.socketService.onEventPublished().subscribe((data: any) => {
      console.log('Received event-published notification:', data);
      this.handleRealTimeNotification({
        _id: `temp_${Date.now()}`,
        recipient: '', // Will be filled by backend
        sender: {
          _id: data.publisher.id,
          firstName: data.publisher.name.split(' ')[0],
          lastName: data.publisher.name.split(' ')[1] || ''
        },
        type: 'event-published',
        title: data.notification.title,
        message: data.notification.message,
        data: {
          club: data.club,
          event: data.event
        },
        isRead: false,
        createdAt: data.notification.timestamp
      });
    });

    this.socketService.onEventCancelled().subscribe((data: any) => {
      console.log('Received event-cancelled notification:', data);
      this.handleRealTimeNotification({
        _id: `temp_${Date.now()}`,
        recipient: '',
        sender: {
          _id: data.changer.id,
          firstName: data.changer.name.split(' ')[0],
          lastName: data.changer.name.split(' ')[1] || ''
        },
        type: 'event-cancelled',
        title: data.notification.title,
        message: data.notification.message,
        data: {
          club: data.club,
          event: data.event
        },
        isRead: false,
        createdAt: data.notification.timestamp
      });
    });
  }

  private handleRealTimeNotification(notification: Notification): void {
    // Add to notifications list
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...currentNotifications]);
    
    // Update unread count
    const currentCount = this.unreadCountSubject.value;
    this.unreadCountSubject.next(currentCount + 1);
    
    // Show notification popup
    this.showNotificationPopupSubject.next(notification);
    
    // Auto-hide popup after 5 seconds
    setTimeout(() => {
      if (this.showNotificationPopupSubject.value === notification) {
        this.showNotificationPopupSubject.next(null);
      }
    }, 5000);
  }

  private async loadInitialNotifications(): Promise<void> {
    try {
      const response = await this.getNotifications(20, 0);
      this.notificationsSubject.next(response.notifications);
      this.unreadCountSubject.next(response.unreadCount);
    } catch (error) {
      console.error('Error loading initial notifications:', error);
    }
  }

  async getNotifications(limit: number = 20, skip: number = 0): Promise<NotificationResponse> {
    const response = await firstValueFrom(this.apiService.get<NotificationResponse>(`notifications?limit=${limit}&skip=${skip}`));
    return response.data!;
  }

  async getUnreadCount(): Promise<number> {
    const response = await firstValueFrom(this.apiService.get<{ unreadCount: number }>('notifications/unread-count'));
    return response.data!.unreadCount;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await firstValueFrom(this.apiService.put<any>(`notifications/${notificationId}/read`, {}));
    
    // Update local state
    const notifications = this.notificationsSubject.value.map(n => 
      n._id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
    );
    this.notificationsSubject.next(notifications);
    
    // Update unread count
    const currentCount = this.unreadCountSubject.value;
    if (currentCount > 0) {
      this.unreadCountSubject.next(currentCount - 1);
    }
  }

  async markAllAsRead(): Promise<void> {
    await firstValueFrom(this.apiService.put<{ updatedCount: number }>('notifications/mark-all-read', {}));
    
    // Update local state
    const notifications = this.notificationsSubject.value.map(n => 
      ({ ...n, isRead: true, readAt: new Date().toISOString() })
    );
    this.notificationsSubject.next(notifications);
    this.unreadCountSubject.next(0);
  }

  hideNotificationPopup(): void {
    this.showNotificationPopupSubject.next(null);
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'event-published': return '📅';
      case 'event-cancelled': return '❌';
      case 'event-updated': return '✏️';
      case 'join-request-approved': return '✅';
      case 'join-request-rejected': return '❌';
      case 'new-member-joined': return '👋';
      default: return '📢';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'event-published': return '#00C853';
      case 'event-cancelled': return '#f44336';
      case 'event-updated': return '#ff9800';
      case 'join-request-approved': return '#4caf50';
      case 'join-request-rejected': return '#f44336';
      case 'new-member-joined': return '#2196f3';
      default: return '#9e9e9e';
    }
  }

  getTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  }
}