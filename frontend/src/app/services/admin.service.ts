import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface DashboardOverview {
  platformStats: {
    totalUsers: number;
    totalClubs: number;
    totalEvents: number;
    totalTransactions: number;
  };
  userGrowth: {
    newUsersThisMonth: number;
    newUsersThisWeek: number;
    activeUsersThisWeek: number;
  };
  eventStats: {
    upcomingEvents: number;
    totalCapacity: number;
    totalAttending: number;
    averageAttendance: number;
  };
  financialStats: {
    totalUserCoins: number;
    totalClubCoins: number;
    totalPlatformCoins: number;
  };
  recentActivity: {
    newUsers: any[];
    newClubs: any[];
    recentEvents: any[];
  };
}

export interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  skillLevel: number;
  preferredFormat: string;
  stats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
  };
  coinWallet: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
  };
  clubs: any[];
  lastActive: string;
  createdAt: string;
}

export interface AdminClub {
  _id: string;
  name: string;
  description: string;
  sport: string;
  location: {
    name: string;
    address: string;
  };
  isPrivate: boolean;
  owner: {
    firstName: string;
    lastName: string;
    email: string;
  };
  members: any[];
  memberCount: number;
  adminCount: number;
  joinRequestsCount: number;
  coinWallet: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
  };
  createdAt: string;
}

export interface AdminEvent {
  _id: string;
  title: string;
  description: string;
  club: {
    _id: string;
    name: string;
  };
  organizer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  dateTime: string;
  duration: number;
  eventType: string;
  maxParticipants: number;
  status: string;
  attendingCount: number;
  maybeCount: number;
  declinedCount: number;
  totalRsvps: number;
  rsvps: {
    user: {
      firstName: string;
      lastName: string;
    };
    status: 'attending' | 'maybe' | 'declined';
    skillLevel?: number;
    rsvpedAt: string;
  }[];
  createdAt: string;
}

export interface SiteAnalytics {
  userGrowth: any[];
  activeUsers: any[];
  eventCreation: any[];
  currentlyActiveUsers: number;
  userDemographics: any[];
  skillDistribution: any[];
  platformGrowth: any[];
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface FinancialData {
  revenue: {
    total: number;
    totalCoinsGranted: number;
    totalTransactions: number;
  };
  revenueByPackage: any[];
  transactionsByType: any[];
  topSpenders: any[];
  topEarningClubs: any[];
  userCoinDistribution: any[];
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private api: ApiService) {}

  // Dashboard Overview
  getDashboardOverview(): Observable<ApiResponse<DashboardOverview>> {
    return this.api.get<DashboardOverview>('admin/dashboard/overview');
  }

  // User Management
  getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Observable<ApiResponse<AdminUser[]>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    const url = `admin/dashboard/users${queryString ? '?' + queryString : ''}`;
    return this.api.get<AdminUser[]>(url);
  }

  // Club Management
  getClubs(params: {
    page?: number;
    limit?: number;
    search?: string;
    sport?: string;
  } = {}): Observable<ApiResponse<AdminClub[]>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    const url = `admin/dashboard/clubs${queryString ? '?' + queryString : ''}`;
    return this.api.get<AdminClub[]>(url);
  }

  // Event Management
  getEvents(params: {
    page?: number;
    limit?: number;
    status?: string;
    dateRange?: string;
  } = {}): Observable<ApiResponse<AdminEvent[]>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    const url = `admin/dashboard/events${queryString ? '?' + queryString : ''}`;
    return this.api.get<AdminEvent[]>(url);
  }

  // Site Analytics
  getSiteAnalytics(period: string = '30d'): Observable<ApiResponse<SiteAnalytics>> {
    return this.api.get<SiteAnalytics>(`admin/dashboard/analytics?period=${period}`);
  }

  // Financial Data
  getFinancialData(period: string = '30d'): Observable<ApiResponse<FinancialData>> {
    return this.api.get<FinancialData>(`admin/dashboard/financial?period=${period}`);
  }

  // Real-time Activity (100% real data)
  getRealtimeActivity(): Observable<ApiResponse<RealtimeActivity>> {
    return this.api.get<RealtimeActivity>('admin/dashboard/realtime');
  }
}

export interface RealtimeActivity {
  activeUsersNow: number;
  veryRecentUsers: number;
  authenticatedActiveUsers: number;
  anonymousVisitors: number;
  newUsersToday: number;
  newClubsToday: number;
  newEventsToday: number;
  recentlyActiveUsers: Array<{
    firstName: string;
    lastName: string;
    lastActive: string;
  }>;
  timestamp: string;
  lastUpdated: string;
}