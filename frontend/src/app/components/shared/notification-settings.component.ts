import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { PushNotificationService, UserPushSubscription, PushSubscriptionPreferences } from '../../services/push-notification.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-notification-settings',
  template: `
    <div class="notification-settings">
      <div class="settings-header">
        <h3>Push Notifications</h3>
        <p class="settings-description">
          Get notified about club events and activities even when the app is closed
        </p>
      </div>

      <!-- Browser Support Check -->
      <div *ngIf="!pushService.isSupported()" class="unsupported-message">
        <div class="warning-icon">⚠️</div>
        <div>
          <h4>Not Supported</h4>
          <p>Push notifications are not supported in your current browser. Try using Chrome, Firefox, or Edge.</p>
        </div>
      </div>

      <!-- Permission Status -->
      <div *ngIf="pushService.isSupported()" class="permission-section">
        <div class="permission-status" [ngClass]="getPermissionClass()">
          <div class="status-icon">{{ getPermissionIcon() }}</div>
          <div class="status-content">
            <h4>{{ getPermissionTitle() }}</h4>
            <p>{{ getPermissionDescription() }}</p>
          </div>
          <div class="status-actions">
            <button
              *ngIf="permissionStatus === 'default'"
              class="btn btn-primary"
              (click)="enableNotifications()"
              [disabled]="isLoading">
              {{ isLoading ? 'Enabling...' : 'Enable Notifications' }}
            </button>

            <button
              *ngIf="permissionStatus === 'granted' && !isSubscribed"
              class="btn btn-success"
              (click)="subscribe()"
              [disabled]="isLoading">
              {{ isLoading ? 'Subscribing...' : 'Subscribe' }}
            </button>

            <button
              *ngIf="permissionStatus === 'granted' && isSubscribed"
              class="btn btn-outline-danger"
              (click)="unsubscribe()"
              [disabled]="isLoading">
              {{ isLoading ? 'Unsubscribing...' : 'Unsubscribe' }}
            </button>

            <button
              *ngIf="permissionStatus === 'denied'"
              class="btn btn-outline-primary"
              (click)="showPermissionHelp()">
              How to Enable
            </button>
          </div>
        </div>
      </div>

      <!-- Subscription List -->
      <div *ngIf="isSubscribed && subscriptions.length > 0" class="subscriptions-section">
        <h4>Your Devices</h4>
        <div class="subscription-list">
          <div
            *ngFor="let subscription of subscriptions"
            class="subscription-item"
            [ngClass]="{'current-device': isCurrentDevice(subscription)}">

            <div class="device-info">
              <div class="device-icon">{{ getDeviceIcon(subscription.deviceInfo.device) }}</div>
              <div class="device-details">
                <h5>
                  {{ subscription.deviceInfo.browser || 'Unknown Browser' }}
                  <span *ngIf="isCurrentDevice(subscription)" class="current-badge">Current</span>
                </h5>
                <p>{{ subscription.deviceInfo.os || 'Unknown OS' }} • {{ getTimeAgo(subscription.lastUsed) }}</p>
              </div>
            </div>

            <div class="device-preferences">
              <div class="preference-toggle">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    [checked]="subscription.preferences.eventNotifications"
                    (change)="updatePreference(subscription, 'eventNotifications', $event)">
                  <span class="toggle-slider"></span>
                </label>
                <span>Events</span>
              </div>

              <div class="preference-toggle">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    [checked]="subscription.preferences.clubNotifications"
                    (change)="updatePreference(subscription, 'clubNotifications', $event)">
                  <span class="toggle-slider"></span>
                </label>
                <span>Clubs</span>
              </div>

              <div class="preference-toggle">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    [checked]="subscription.preferences.systemNotifications"
                    (change)="updatePreference(subscription, 'systemNotifications', $event)">
                  <span class="toggle-slider"></span>
                </label>
                <span>System</span>
              </div>
            </div>

            <div class="device-actions">
              <button
                class="btn btn-sm btn-outline-primary"
                (click)="sendTestNotification(subscription)"
                [disabled]="testingNotification">
                Test
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Information Section -->
      <div class="info-section">
        <h4>About Push Notifications</h4>
        <ul>
          <li>📱 Work on mobile devices even when the app is closed</li>
          <li>🔔 Get instant alerts for new events and club updates</li>
          <li>⚙️ Customize notification types for each device</li>
          <li>🔒 Your data stays secure - we only send necessary information</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .notification-settings {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }

    .settings-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .settings-header h3 {
      color: #333;
      margin-bottom: 8px;
    }

    .settings-description {
      color: #666;
      font-size: 14px;
      margin: 0;
    }

    .unsupported-message {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 20px;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .warning-icon {
      font-size: 24px;
    }

    .permission-section {
      margin-bottom: 30px;
    }

    .permission-status {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      background: white;
    }

    .permission-status.granted {
      border-color: #4caf50;
      background: #f8fff8;
    }

    .permission-status.denied {
      border-color: #f44336;
      background: #fff8f8;
    }

    .permission-status.default {
      border-color: #ff9800;
      background: #fff8f0;
    }

    .status-icon {
      font-size: 24px;
    }

    .status-content {
      flex: 1;
    }

    .status-content h4 {
      margin: 0 0 4px 0;
      color: #333;
    }

    .status-content p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .subscriptions-section {
      margin-bottom: 30px;
    }

    .subscriptions-section h4 {
      margin-bottom: 15px;
      color: #333;
    }

    .subscription-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .subscription-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: white;
    }

    .subscription-item.current-device {
      border-color: #00C853;
      background: #f8fff8;
    }

    .device-info {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 180px;
    }

    .device-icon {
      font-size: 20px;
    }

    .device-details h5 {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .current-badge {
      background: #00C853;
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 10px;
      margin-left: 6px;
      font-weight: 500;
    }

    .device-details p {
      margin: 0;
      font-size: 12px;
      color: #666;
    }

    .device-preferences {
      display: flex;
      gap: 15px;
      flex: 1;
    }

    .preference-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
    }

    .toggle-label {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;
      cursor: pointer;
    }

    .toggle-label input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
      border-radius: 20px;
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }

    input:checked + .toggle-slider {
      background-color: #00C853;
    }

    input:checked + .toggle-slider:before {
      transform: translateX(16px);
    }

    .device-actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      border: 1px solid transparent;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #00C853;
      color: white;
      border-color: #00C853;
    }

    .btn-primary:hover:not(:disabled) {
      background: #00A648;
      border-color: #00A648;
    }

    .btn-success {
      background: #4caf50;
      color: white;
      border-color: #4caf50;
    }

    .btn-success:hover:not(:disabled) {
      background: #45a049;
    }

    .btn-outline-primary {
      background: transparent;
      color: #00C853;
      border-color: #00C853;
    }

    .btn-outline-primary:hover:not(:disabled) {
      background: #00C853;
      color: white;
    }

    .btn-outline-danger {
      background: transparent;
      color: #f44336;
      border-color: #f44336;
    }

    .btn-outline-danger:hover:not(:disabled) {
      background: #f44336;
      color: white;
    }

    .btn-sm {
      padding: 4px 8px;
      font-size: 12px;
    }

    .info-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
    }

    .info-section h4 {
      margin-bottom: 15px;
      color: #333;
    }

    .info-section ul {
      margin: 0;
      padding-left: 0;
      list-style: none;
    }

    .info-section li {
      margin-bottom: 8px;
      font-size: 14px;
      color: #666;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .notification-settings {
        padding: 15px;
      }

      .permission-status {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
      }

      .status-actions {
        width: 100%;
      }

      .subscription-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
      }

      .device-info {
        min-width: auto;
        width: 100%;
      }

      .device-preferences {
        width: 100%;
        justify-content: space-around;
      }

      .device-actions {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class NotificationSettingsComponent implements OnInit, OnDestroy {
  permissionStatus: NotificationPermission = 'default';
  isSubscribed = false;
  subscriptions: UserPushSubscription[] = [];
  isLoading = false;
  testingNotification = false;

  private subscriptions$ = new Subscription();

  constructor(
    public pushService: PushNotificationService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.subscriptions$.add(
      this.pushService.permissionStatus$.subscribe(status => {
        this.permissionStatus = status;
      })
    );

    this.subscriptions$.add(
      this.pushService.isSubscribed$.subscribe(subscribed => {
        this.isSubscribed = subscribed;
      })
    );

    this.subscriptions$.add(
      this.pushService.subscriptions$.subscribe(subs => {
        this.subscriptions = subs;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions$.unsubscribe();
  }

  async enableNotifications(): Promise<void> {
    try {
      this.isLoading = true;
      await this.pushService.requestPermission();
      if (this.permissionStatus === 'granted') {
        await this.subscribe();
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      alert('Failed to enable notifications. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  async subscribe(): Promise<void> {
    try {
      this.isLoading = true;
      await this.pushService.subscribe();
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      alert('Failed to subscribe to notifications. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  async unsubscribe(): Promise<void> {
    try {
      this.isLoading = true;
      await this.pushService.unsubscribe();
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      alert('Failed to unsubscribe from notifications. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  async updatePreference(subscription: UserPushSubscription, key: keyof PushSubscriptionPreferences, event: Event): Promise<void> {
    try {
      const target = event.target as HTMLInputElement;
      const preferences = {
        ...subscription.preferences,
        [key]: target.checked
      };

      await this.pushService.updatePreferences(subscription._id, preferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      alert('Failed to update notification preferences.');
    }
  }

  async sendTestNotification(subscription: UserPushSubscription): Promise<void> {
    try {
      this.testingNotification = true;
      await this.pushService.sendTestNotification(
        subscription._id,
        'Test Notification',
        'This is a test notification from PlaySquad!'
      );
      alert('Test notification sent! Check your device.');
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Failed to send test notification.');
    } finally {
      this.testingNotification = false;
    }
  }

  showPermissionHelp(): void {
    this.modalService.showModal({
      title: 'Enable Notifications',
      content: `
        <p>To enable push notifications:</p>
        <ol>
          <li>Click the lock icon in your browser's address bar</li>
          <li>Set Notifications to "Allow"</li>
          <li>Reload this page</li>
          <li>Click "Enable Notifications" again</li>
        </ol>
        <p>Note: The exact steps may vary depending on your browser.</p>
      `,
      confirmText: 'Got it'
    });
  }

  getPermissionClass(): string {
    return this.permissionStatus;
  }

  getPermissionIcon(): string {
    switch (this.permissionStatus) {
      case 'granted': return '✅';
      case 'denied': return '❌';
      default: return '⚠️';
    }
  }

  getPermissionTitle(): string {
    switch (this.permissionStatus) {
      case 'granted':
        return this.isSubscribed ? 'Notifications Enabled' : 'Permission Granted';
      case 'denied':
        return 'Notifications Blocked';
      default:
        return 'Enable Push Notifications';
    }
  }

  getPermissionDescription(): string {
    switch (this.permissionStatus) {
      case 'granted':
        return this.isSubscribed
          ? 'You\'ll receive push notifications on this device'
          : 'Click Subscribe to start receiving notifications';
      case 'denied':
        return 'Notifications are blocked in your browser settings';
      default:
        return 'Get notified about events and club activities';
    }
  }

  getDeviceIcon(deviceType?: string): string {
    switch (deviceType?.toLowerCase()) {
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      case 'desktop': return '💻';
      default: return '📱';
    }
  }

  isCurrentDevice(subscription: UserPushSubscription): boolean {
    // Simple heuristic - check if the user agent and creation time are recent
    const isRecentlyCreated = new Date(subscription.createdAt).getTime() > Date.now() - 60000; // Within last minute
    return isRecentlyCreated || subscription.deviceInfo.userAgent === navigator.userAgent;
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