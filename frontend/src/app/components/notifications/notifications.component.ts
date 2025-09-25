import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notifications',
  template: `
    <div class="notifications-page">
      <div class="notifications-header">
        <h1>Notifications</h1>
        <div class="header-actions">
          <span class="unread-count" *ngIf="unreadCount > 0">{{ unreadCount }} unread</span>
          <button 
            class="mark-all-read-btn" 
            *ngIf="unreadCount > 0" 
            (click)="markAllAsRead()"
            [disabled]="isMarkingAllRead">
            {{ isMarkingAllRead ? 'Marking...' : 'Mark all as read' }}
          </button>
        </div>
      </div>

      <div class="notifications-content">
        <div *ngIf="isLoading" class="loading">
          <div class="loading-spinner"></div>
          <span>Loading notifications...</span>
        </div>

        <div *ngIf="!isLoading && notifications.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>No notifications yet</h3>
          <p>You'll see notifications here when there are updates about events and club activities.</p>
        </div>

        <div *ngIf="!isLoading && notifications.length > 0" class="notifications-list">
          <div 
            *ngFor="let notification of notifications; trackBy: trackByNotificationId"
            class="notification-item"
            [ngClass]="{
              'unread': !notification.isRead,
              'event-published': notification.type === 'event-published',
              'event-cancelled': notification.type === 'event-cancelled'
            }"
            (click)="handleNotificationClick(notification)">
            
            <div class="notification-main">
              <div class="notification-header">
                <span class="notification-icon">{{ getIcon(notification.type) }}</span>
                <div class="notification-info">
                  <h4 class="notification-title">{{ notification.title }}</h4>
                  <span class="notification-time">{{ getTimeAgo(notification.createdAt) }}</span>
                </div>
                <div class="read-indicator" *ngIf="!notification.isRead"></div>
              </div>

              <div class="notification-message">{{ notification.message }}</div>

              <div class="notification-details" *ngIf="notification.data.club || notification.data.event">
                <span *ngIf="notification.data.club" class="club-name">{{ notification.data.club.name }}</span>
                <span *ngIf="notification.data.event" class="event-info">
                  📅 {{ formatEventDate(notification.data.event.date) }}
                  <span *ngIf="notification.data.event.location"> • 📍 {{ notification.data.event.location }}</span>
                </span>
              </div>
            </div>

            <div class="notification-actions">
              <button 
                class="mark-read-btn"
                *ngIf="!notification.isRead"
                (click)="markAsRead(notification, $event)"
                [disabled]="isMarkingRead === notification._id">
                {{ isMarkingRead === notification._id ? '...' : '✓' }}
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="hasMoreNotifications && !isLoading" class="load-more">
          <button class="load-more-btn" (click)="loadMoreNotifications()" [disabled]="isLoadingMore">
            {{ isLoadingMore ? 'Loading...' : 'Load more notifications' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-page {
      min-height: 100vh;
      background: #f8f9fa;
    }

    .notifications-header {
      background: white;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .notifications-header h1 {
      margin: 0;
      color: #333;
      font-size: 24px;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .unread-count {
      background: #00C853;
      color: white;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
    }

    .mark-all-read-btn {
      background: #f5f5f5;
      border: 1px solid #ddd;
      color: #666;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .mark-all-read-btn:hover:not(:disabled) {
      background: #e9ecef;
      color: #333;
    }

    .mark-all-read-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .notifications-content {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      color: #666;
    }

    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #00C853;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .notification-item {
      background: white;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .notification-item:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .notification-item.unread {
      border-left: 4px solid #00C853;
      background: #f8fff9;
    }

    .notification-main {
      flex: 1;
      min-width: 0;
    }

    .notification-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 8px;
    }

    .notification-icon {
      font-size: 20px;
      line-height: 1;
      margin-top: 2px;
    }

    .notification-info {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      line-height: 1.3;
    }

    .notification-time {
      font-size: 12px;
      color: #999;
      font-weight: 500;
    }

    .read-indicator {
      width: 8px;
      height: 8px;
      background: #00C853;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 4px;
    }

    .notification-message {
      font-size: 13px;
      color: #666;
      line-height: 1.4;
      margin-bottom: 12px;
    }

    .notification-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 12px;
      color: #888;
    }

    .club-name {
      font-weight: 600;
      color: #00C853;
    }

    .event-info {
      color: #666;
    }

    .notification-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .mark-read-btn {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      color: #6c757d;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 12px;
    }

    .mark-read-btn:hover:not(:disabled) {
      background: #00C853;
      border-color: #00C853;
      color: white;
    }

    .mark-read-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .load-more {
      margin-top: 20px;
      text-align: center;
    }

    .load-more-btn {
      background: white;
      border: 2px solid #00C853;
      color: #00C853;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .load-more-btn:hover:not(:disabled) {
      background: #00C853;
      color: white;
    }

    .load-more-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .notifications-header {
        flex-direction: column;
        align-items: flex-start;
        padding: 16px;
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;
      }

      .notifications-content {
        padding: 16px;
      }

      .notification-item {
        padding: 12px;
      }

      .notification-header {
        gap: 8px;
      }

      .notification-title {
        font-size: 13px;
      }

      .notification-message {
        font-size: 12px;
      }
    }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  isLoading = true;
  isLoadingMore = false;
  isMarkingRead: string | null = null;
  isMarkingAllRead = false;
  hasMoreNotifications = false;
  currentSkip = 0;
  pageSize = 20;

  private subscription?: Subscription;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    
    // Subscribe to real-time updates
    this.subscription = this.notificationService.notifications$.subscribe(
      notifications => {
        this.notifications = notifications;
      }
    );

    this.notificationService.unreadCount$.subscribe(
      count => this.unreadCount = count
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  async loadNotifications(): Promise<void> {
    try {
      this.isLoading = true;
      const response = await this.notificationService.getNotifications(this.pageSize, 0);
      this.notifications = response.notifications;
      this.unreadCount = response.unreadCount;
      this.hasMoreNotifications = response.pagination.hasMore;
      this.currentSkip = this.pageSize;
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadMoreNotifications(): Promise<void> {
    try {
      this.isLoadingMore = true;
      const response = await this.notificationService.getNotifications(this.pageSize, this.currentSkip);
      this.notifications.push(...response.notifications);
      this.hasMoreNotifications = response.pagination.hasMore;
      this.currentSkip += this.pageSize;
    } catch (error) {
      console.error('Error loading more notifications:', error);
    } finally {
      this.isLoadingMore = false;
    }
  }

  async markAsRead(notification: Notification, event: Event): Promise<void> {
    event.stopPropagation();
    
    if (notification.isRead || notification._id.startsWith('temp_')) return;

    try {
      this.isMarkingRead = notification._id;
      await this.notificationService.markAsRead(notification._id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      this.isMarkingRead = null;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      this.isMarkingAllRead = true;
      await this.notificationService.markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      this.isMarkingAllRead = false;
    }
  }

  handleNotificationClick(notification: Notification): void {
    // Navigate to relevant page
    if (notification.data.event) {
      this.router.navigate(['/events', notification.data.event._id]);
    } else if (notification.data.club) {
      this.router.navigate(['/clubs', notification.data.club._id]);
    }

    // Mark as read if not already read
    if (!notification.isRead && !notification._id.startsWith('temp_')) {
      this.notificationService.markAsRead(notification._id);
    }
  }

  getIcon(type: string): string {
    return this.notificationService.getNotificationIcon(type);
  }

  getTimeAgo(dateString: string): string {
    return this.notificationService.getTimeAgo(dateString);
  }

  formatEventDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification._id;
  }
}