import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface PageViewData {
  page: string;
  pageTitle: string;
  referrer?: string;
  sessionId?: string;
  viewDuration?: number;
}

export interface VisitorAnalytics {
  overview: {
    totalPageViews: number;
    uniqueVisitors: number;
    totalSessions: number;
    anonymousVisitors: number;
    registeredVisitors: number;
    totalVisitors: number;
    currentlyActive: number;
    avgSessionDuration: number;
    avgPagesPerSession: number;
  };
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  topPages: Array<{
    page: string;
    views: number;
    uniqueViews: number;
  }>;
  recentVisitors: Array<{
    sessionId: string;
    user?: any;
    isAnonymous: boolean;
    deviceType: string;
    browser: string;
    os: string;
    ipAddress: string;
    pageViews: number;
    duration: number;
    landingPage: string;
    startTime: string;
    lastActivity: string;
    isActive: boolean;
  }>;
  dailyTrends: Array<{
    _id: {
      year: number;
      month: number;
      day: number;
    };
    visitors: number;
    anonymousVisitors: number;
    registeredVisitors: number;
  }>;
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private sessionId: string;
  private currentPage: string = '';
  private pageStartTime: Date = new Date();
  private isTracking: boolean = true;
  
  private activeVisitorsSubject = new BehaviorSubject<number>(0);
  public activeVisitors$ = this.activeVisitorsSubject.asObservable();

  constructor(
    private router: Router,
    private api: ApiService
  ) {
    this.sessionId = this.getOrCreateSessionId();
    this.initializeTracking();
  }

  // Initialize automatic page tracking
  private initializeTracking(): void {
    // Track route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (this.isTracking && event instanceof NavigationEnd) {
          this.trackPageView(event.urlAfterRedirects);
        }
      });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackCurrentPageDuration();
      } else {
        this.pageStartTime = new Date();
      }
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.trackCurrentPageDuration();
      this.endSession();
    });

    // Track initial page load
    setTimeout(() => {
      this.trackPageView(window.location.pathname);
    }, 100);

    // Update active visitors every 30 seconds
    setInterval(() => {
      this.updateActiveVisitors();
    }, 30000);
  }

  // Generate or retrieve session ID
  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('analytics_session_id');
    
    if (!sessionId) {
      sessionId = this.generateSessionId();
      localStorage.setItem('analytics_session_id', sessionId);
      localStorage.setItem('analytics_session_start', new Date().toISOString());
    }
    
    // Check if session is older than 30 minutes of inactivity
    const lastActivity = localStorage.getItem('analytics_last_activity');
    if (lastActivity) {
      const timeDiff = Date.now() - new Date(lastActivity).getTime();
      if (timeDiff > 30 * 60 * 1000) { // 30 minutes
        // Create new session
        sessionId = this.generateSessionId();
        localStorage.setItem('analytics_session_id', sessionId);
        localStorage.setItem('analytics_session_start', new Date().toISOString());
      }
    }
    
    localStorage.setItem('analytics_last_activity', new Date().toISOString());
    
    return sessionId;
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Detect device type
  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod|blackberry|windows phone/.test(userAgent)) {
      return 'mobile';
    } else if (/tablet|ipad/.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  // Get browser info
  private getBrowserInfo(): { browser: string; os: string } {
    const userAgent = navigator.userAgent.toLowerCase();
    let browser = 'unknown';
    let os = 'unknown';

    // Detect browser
    if (userAgent.includes('chrome') && !userAgent.includes('edge')) browser = 'Chrome';
    else if (userAgent.includes('firefox')) browser = 'Firefox';
    else if (userAgent.includes('safari') && !userAgent.includes('chrome')) browser = 'Safari';
    else if (userAgent.includes('edge')) browser = 'Edge';
    else if (userAgent.includes('opera')) browser = 'Opera';

    // Detect OS
    if (userAgent.includes('windows')) os = 'Windows';
    else if (userAgent.includes('mac')) os = 'macOS';
    else if (userAgent.includes('linux')) os = 'Linux';
    else if (userAgent.includes('android')) os = 'Android';
    else if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')) os = 'iOS';

    return { browser, os };
  }

  // Track page view
  public trackPageView(page: string, pageTitle?: string): void {
    if (!this.isTracking || page === this.currentPage) return;

    // Track duration of previous page
    if (this.currentPage) {
      this.trackCurrentPageDuration();
    }

    this.currentPage = page;
    this.pageStartTime = new Date();

    const pageViewData: PageViewData = {
      page,
      pageTitle: pageTitle || document.title,
      referrer: document.referrer,
      sessionId: this.sessionId,
      viewDuration: 0
    };

    this.sendPageView(pageViewData);
    localStorage.setItem('analytics_last_activity', new Date().toISOString());
  }

  // Track current page duration
  private trackCurrentPageDuration(): void {
    if (!this.currentPage || !this.pageStartTime) return;

    const viewDuration = Math.floor((Date.now() - this.pageStartTime.getTime()) / 1000);

    if (viewDuration > 0) {
      const pageViewData: PageViewData = {
        page: this.currentPage,
        pageTitle: document.title,
        referrer: document.referrer,
        sessionId: this.sessionId,
        viewDuration
      };

      this.sendPageView(pageViewData);
    }
  }

  // Send page view to backend
  private sendPageView(data: PageViewData): void {
    this.api.post('analytics/track/pageview', data).subscribe({
      next: (response) => {
        console.log('Page view tracked:', response);
      },
      error: (error) => {
        // Silently handle analytics failures - don't break user experience
        console.warn('Analytics tracking unavailable:', error?.error?.message || 'Service offline');
      }
    });
  }

  // Track custom events
  public trackEvent(eventName: string, eventData: any = {}): void {
    if (!this.isTracking) return;

    const event = {
      event: eventName,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      page: this.currentPage,
      data: eventData
    };

    // For now, just log custom events (can be extended later)
    console.log('Custom event tracked:', event);
  }

  // End current session
  public endSession(): void {
    if (!this.sessionId) return;

    this.trackCurrentPageDuration();

    this.api.post('analytics/track/session/end', {
      sessionId: this.sessionId
    }).subscribe({
      next: (response) => {
        console.log('Session ended:', response);
      },
      error: (error) => {
        console.error('Failed to end session:', error);
      }
    });

    localStorage.removeItem('analytics_session_id');
    localStorage.removeItem('analytics_session_start');
  }

  // Get current active visitors (real-time)
  public getActiveVisitors(): Observable<any> {
    return this.api.get('analytics/realtime/visitors');
  }

  // Update active visitors count
  private updateActiveVisitors(): void {
    this.getActiveVisitors().subscribe({
      next: (response) => {
        if (response.success) {
          this.activeVisitorsSubject.next(response.data.activeVisitors);
        }
      },
      error: (error) => {
        console.error('Failed to get active visitors:', error);
      }
    });
  }

  // Get visitor analytics (admin only)
  public getVisitorAnalytics(params: {
    period?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Observable<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const url = `analytics/admin/visitor-analytics${queryString ? '?' + queryString : ''}`;
    
    return this.api.get(url);
  }

  // Enable/disable tracking
  public setTracking(enabled: boolean): void {
    this.isTracking = enabled;
    
    if (!enabled) {
      this.endSession();
    } else {
      this.sessionId = this.getOrCreateSessionId();
    }
  }

  // Check if tracking is enabled
  public isTrackingEnabled(): boolean {
    return this.isTracking;
  }

  // Get current session info
  public getSessionInfo(): any {
    return {
      sessionId: this.sessionId,
      currentPage: this.currentPage,
      sessionStart: localStorage.getItem('analytics_session_start'),
      lastActivity: localStorage.getItem('analytics_last_activity'),
      deviceType: this.getDeviceType(),
      ...this.getBrowserInfo()
    };
  }

  // Manual session renewal
  public renewSession(): void {
    this.endSession();
    this.sessionId = this.getOrCreateSessionId();
  }
}