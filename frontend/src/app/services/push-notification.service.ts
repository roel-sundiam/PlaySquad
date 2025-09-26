import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, from } from 'rxjs';
import { ApiService } from './api.service';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushSubscriptionPreferences {
  eventNotifications: boolean;
  clubNotifications: boolean;
  systemNotifications: boolean;
}

export interface UserPushSubscription {
  _id: string;
  endpoint: string;
  deviceInfo: {
    userAgent?: string;
    browser?: string;
    os?: string;
    device?: string;
  };
  preferences: PushSubscriptionPreferences;
  isActive: boolean;
  lastUsed: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private isEnabledSubject = new BehaviorSubject<boolean>(false);
  private isSubscribedSubject = new BehaviorSubject<boolean>(false);
  private permissionStatusSubject = new BehaviorSubject<NotificationPermission>('default');
  private subscriptionsSubject = new BehaviorSubject<UserPushSubscription[]>([]);

  public isEnabled$ = this.isEnabledSubject.asObservable();
  public isSubscribed$ = this.isSubscribedSubject.asObservable();
  public permissionStatus$ = this.permissionStatusSubject.asObservable();
  public subscriptions$ = this.subscriptionsSubject.asObservable();

  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey: string | null = null;

  constructor(private apiService: ApiService) {
    this.initializePushNotifications();
  }

  private async initializePushNotifications(): Promise<void> {
    try {
      // Check if service worker and push notifications are supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported in this browser');
        return;
      }

      // Register service worker
      await this.registerServiceWorker();

      // Get current permission status
      this.permissionStatusSubject.next(Notification.permission);
      this.isEnabledSubject.next(Notification.permission === 'granted');

      // Get VAPID public key from server
      await this.loadVapidPublicKey();

      // Check current subscription status
      await this.checkSubscriptionStatus();

      // Load user's subscriptions
      if (this.isEnabledSubject.value) {
        await this.loadUserSubscriptions();
      }

    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        });

        this.serviceWorkerRegistration = registration;
        console.log('Service worker registered successfully');

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New service worker available, reloading...');
                window.location.reload();
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Service worker registration failed:', error);
      throw error;
    }
  }

  private async loadVapidPublicKey(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.apiService.get<{ publicKey: string }>('push-subscriptions/vapid-public-key')
      );
      this.vapidPublicKey = response.data!.publicKey;
    } catch (error) {
      console.error('Failed to load VAPID public key:', error);
      throw error;
    }
  }

  private async checkSubscriptionStatus(): Promise<void> {
    try {
      if (!this.serviceWorkerRegistration) {
        return;
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      this.isSubscribedSubject.next(!!subscription);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  }

  private async loadUserSubscriptions(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.apiService.get<{ subscriptions: UserPushSubscription[], count: number }>('push-subscriptions/my-subscriptions')
      );
      this.subscriptionsSubject.next(response.data!.subscriptions);
    } catch (error) {
      console.error('Error loading user subscriptions:', error);
    }
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    try {
      if (!this.isSupported()) {
        throw new Error('Push notifications not supported');
      }

      const permission = await Notification.requestPermission();
      this.permissionStatusSubject.next(permission);
      this.isEnabledSubject.next(permission === 'granted');

      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(preferences?: Partial<PushSubscriptionPreferences>): Promise<void> {
    try {
      if (!this.isSupported()) {
        throw new Error('Push notifications not supported');
      }

      if (Notification.permission !== 'granted') {
        const permission = await this.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }

      if (!this.serviceWorkerRegistration || !this.vapidPublicKey) {
        throw new Error('Service worker or VAPID key not available');
      }

      // Subscribe to push service
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      // Send subscription to server
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      await firstValueFrom(
        this.apiService.post('push-subscriptions/subscribe', {
          ...subscriptionData,
          deviceInfo: {
            userAgent: navigator.userAgent,
            browser: this.getBrowserName(),
            os: this.getOperatingSystem(),
            device: this.getDeviceType()
          },
          preferences: {
            eventNotifications: true,
            clubNotifications: true,
            systemNotifications: true,
            ...preferences
          }
        })
      );

      this.isSubscribedSubject.next(true);
      await this.loadUserSubscriptions();

      console.log('Successfully subscribed to push notifications');
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<void> {
    try {
      if (!this.serviceWorkerRegistration) {
        throw new Error('Service worker not registered');
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (!subscription) {
        console.log('No active push subscription found');
        return;
      }

      // Unsubscribe from push service
      await subscription.unsubscribe();

      // Remove subscription from server
      await firstValueFrom(
        this.apiService.delete('push-subscriptions/unsubscribe', {
          endpoint: subscription.endpoint
        })
      );

      this.isSubscribedSubject.next(false);
      await this.loadUserSubscriptions();

      console.log('Successfully unsubscribed from push notifications');
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    }
  }

  /**
   * Update subscription preferences
   */
  async updatePreferences(subscriptionId: string, preferences: Partial<PushSubscriptionPreferences>): Promise<void> {
    try {
      await firstValueFrom(
        this.apiService.put('push-subscriptions/preferences', {
          subscriptionId,
          preferences
        })
      );

      await this.loadUserSubscriptions();
      console.log('Subscription preferences updated successfully');
    } catch (error) {
      console.error('Error updating subscription preferences:', error);
      throw error;
    }
  }

  /**
   * Send a test notification (development only)
   */
  async sendTestNotification(subscriptionId: string, title?: string, message?: string): Promise<void> {
    try {
      await firstValueFrom(
        this.apiService.post('push-subscriptions/test', {
          subscriptionId,
          title,
          message
        })
      );
      console.log('Test notification sent successfully');
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  /**
   * Utility methods
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  }

  private getOperatingSystem(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Other';
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    return this.permissionStatusSubject.value;
  }

  /**
   * Check if currently subscribed
   */
  isCurrentlySubscribed(): boolean {
    return this.isSubscribedSubject.value;
  }

  /**
   * Check if notifications are enabled
   */
  areNotificationsEnabled(): boolean {
    return this.isEnabledSubject.value;
  }
}