import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AdminService, DashboardOverview, AdminUser, AdminClub, AdminEvent } from './admin.service';
import { ApiResponse } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class MockAdminService {
  
  getDashboardOverview(): Observable<ApiResponse<DashboardOverview>> {
    const mockOverview: DashboardOverview = {
      platformStats: {
        totalUsers: 245,
        totalClubs: 18,
        totalEvents: 67,
        totalTransactions: 134
      },
      userGrowth: {
        newUsersThisMonth: 28,
        newUsersThisWeek: 7,
        activeUsersThisWeek: 89
      },
      eventStats: {
        upcomingEvents: 12,
        totalCapacity: 480,
        totalAttending: 342,
        averageAttendance: 18
      },
      financialStats: {
        totalUserCoins: 12450,
        totalClubCoins: 3280,
        totalPlatformCoins: 15730
      },
      recentActivity: {
        newUsers: [
          { firstName: 'John', lastName: 'Doe', email: 'john@example.com', createdAt: new Date() },
          { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', createdAt: new Date() }
        ],
        newClubs: [
          { name: 'Tennis Masters', owner: { firstName: 'Mike', lastName: 'Wilson' }, createdAt: new Date() }
        ],
        recentEvents: [
          { title: 'Weekly Tournament', club: { name: 'Tennis Masters' }, dateTime: new Date() }
        ]
      }
    };

    return of({
      success: true,
      data: mockOverview
    } as ApiResponse<DashboardOverview>);
  }

  getUsers(): Observable<ApiResponse<AdminUser[]>> {
    const mockUsers: AdminUser[] = [
      {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        gender: 'male',
        skillLevel: 7,
        preferredFormat: 'doubles',
        stats: { gamesPlayed: 45, wins: 28, losses: 17 },
        coinWallet: { balance: 150, totalEarned: 300, totalSpent: 150 },
        clubs: [{ club: { name: 'Tennis Club' } }],
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439012',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        gender: 'female',
        skillLevel: 8,
        preferredFormat: 'singles',
        stats: { gamesPlayed: 62, wins: 41, losses: 21 },
        coinWallet: { balance: 280, totalEarned: 450, totalSpent: 170 },
        clubs: [{ club: { name: 'Badminton Club' } }],
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];

    return of({
      success: true,
      data: mockUsers,
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 }
    } as any);
  }

  getClubs(): Observable<ApiResponse<AdminClub[]>> {
    const mockClubs: AdminClub[] = [
      {
        _id: '507f1f77bcf86cd799439013',
        name: 'Tennis Masters',
        description: 'Premier tennis club for competitive players',
        sport: 'tennis',
        location: { name: 'City Tennis Center', address: '123 Main St, City' },
        isPrivate: false,
        owner: { firstName: 'Mike', lastName: 'Wilson', email: 'mike@example.com' },
        members: [],
        memberCount: 24,
        adminCount: 3,
        joinRequestsCount: 2,
        coinWallet: { balance: 450, totalEarned: 600, totalSpent: 150 },
        createdAt: new Date().toISOString()
      }
    ];

    return of({
      success: true,
      data: mockClubs,
      pagination: { page: 1, limit: 12, total: 1, totalPages: 1 }
    } as any);
  }

  getEvents(): Observable<ApiResponse<AdminEvent[]>> {
    const mockEvents: AdminEvent[] = [
      {
        _id: '507f1f77bcf86cd799439014',
        title: 'Weekly Tournament',
        description: 'Weekly doubles tournament',
        club: { _id: '507f1f77bcf86cd799439013', name: 'Tennis Masters' },
        organizer: { firstName: 'Mike', lastName: 'Wilson', email: 'mike@example.com' },
        dateTime: new Date().toISOString(),
        duration: 180,
        eventType: 'tournament',
        maxParticipants: 16,
        status: 'published',
        attendingCount: 12,
        maybeCount: 3,
        declinedCount: 1,
        totalRsvps: 16,
        createdAt: new Date().toISOString()
      }
    ];

    return of({
      success: true,
      data: mockEvents,
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
    } as any);
  }
}