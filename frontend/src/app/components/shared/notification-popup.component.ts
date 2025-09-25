import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notification-popup',
  template: `
    <div 
      class="notification-popup" 
      *ngIf="currentNotification"
      [ngClass]="{'visible': showPopup}"
      (click)="handleNotificationClick()">
      
      <div class="notification-content">
        <div class="notification-header">
          <span class="notification-icon">{{ getIcon(currentNotification.type) }}</span>
          <span class="notification-title">{{ currentNotification.title }}</span>
          <button class="close-btn" (click)="closePopup($event)">×</button>
        </div>
        
        <div class="notification-message">{{ currentNotification.message }}</div>
        
        <div class="notification-footer">
          <span class="notification-time">{{ getTimeAgo(currentNotification.createdAt) }}</span>
          <span class="notification-action">Tap to view</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-popup {
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 400px;
      width: calc(100vw - 40px);
      background: white;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      border: 1px solid #e0e0e0;
      z-index: 9999;
      cursor: pointer;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      animation: slideIn 0.3s ease-out forwards;
    }

    .notification-popup.visible {
      transform: translateX(0);
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .notification-content {
      padding: 16px;
    }

    .notification-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      gap: 8px;
    }

    .notification-icon {
      font-size: 20px;
      line-height: 1;
    }

    .notification-title {
      flex: 1;
      font-weight: 600;
      font-size: 14px;
      color: #333;
      line-height: 1.2;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 20px;
      color: #999;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;
    }

    .close-btn:hover {
      background-color: #f5f5f5;
      color: #666;
    }

    .notification-message {
      font-size: 13px;
      color: #666;
      line-height: 1.4;
      margin-bottom: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notification-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #999;
    }

    .notification-time {
      font-weight: 500;
    }

    .notification-action {
      color: #00C853;
      font-weight: 500;
    }

    /* Mobile responsive */
    @media (max-width: 480px) {
      .notification-popup {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
        width: auto;
      }

      .notification-content {
        padding: 12px;
      }

      .notification-title {
        font-size: 13px;
      }

      .notification-message {
        font-size: 12px;
      }
    }

    /* Hover effect */
    .notification-popup:hover {
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
      transform: translateX(-4px);
    }

    .notification-popup:active {
      transform: translateX(-2px);
    }
  `]
})
export class NotificationPopupComponent implements OnInit, OnDestroy {
  currentNotification: Notification | null = null;
  showPopup = false;
  private subscription?: Subscription;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.showNotificationPopup$.subscribe(
      notification => {
        if (notification) {
          this.currentNotification = notification;
          // Small delay to trigger animation
          setTimeout(() => this.showPopup = true, 10);
        } else {
          this.showPopup = false;
          // Clear notification after animation
          setTimeout(() => this.currentNotification = null, 300);
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  getIcon(type: string): string {
    return this.notificationService.getNotificationIcon(type);
  }

  getTimeAgo(dateString: string): string {
    return this.notificationService.getTimeAgo(dateString);
  }

  handleNotificationClick(): void {
    if (!this.currentNotification) return;

    // Navigate to relevant page based on notification type
    if (this.currentNotification.data.event) {
      this.router.navigate(['/events', this.currentNotification.data.event._id]);
    } else if (this.currentNotification.data.club) {
      this.router.navigate(['/clubs', this.currentNotification.data.club._id]);
    }

    // Mark as read if not already read
    if (!this.currentNotification.isRead && !this.currentNotification._id.startsWith('temp_')) {
      this.notificationService.markAsRead(this.currentNotification._id);
    }

    this.closePopup();
  }

  closePopup(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.notificationService.hideNotificationPopup();
  }
}