import { Component, OnInit } from '@angular/core';
import { AdminService, DashboardOverview } from '../../services/admin.service';

@Component({
  selector: 'app-admin-overview',
  template: `
    <!-- Navigation Header (Required by Design Guide) -->
    <app-header></app-header>

    <!-- Main Content -->
    <div class="dashboard-layout">
      <div class="main-content">
        <!-- Header Section -->
        <div class="page-header">
          <div class="header-content">
            <h1 class="page-title">Dashboard Overview</h1>
            <div class="header-actions">
              <button class="btn btn-primary" (click)="refreshData()" [disabled]="loading">
                <i class="material-icons">refresh</i>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="loading-container">
          <div class="loading-spinner">
            <i class="material-icons spinning">dashboard</i>
            <p>Loading dashboard data...</p>
          </div>
        </div>

        <!-- Dashboard Content -->
        <div *ngIf="!loading && overview" class="dashboard-section">
        <!-- Platform Statistics -->
        <div class="stats-section">
          <h2><i class="material-icons">dashboard</i> Platform Statistics</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon users">
                <i class="material-icons">people</i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ overview.platformStats.totalUsers | number }}</div>
                <div class="stat-label">Total Users</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon clubs">
                <i class="material-icons">groups</i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ overview.platformStats.totalClubs | number }}</div>
                <div class="stat-label">Total Clubs</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon events">
                <i class="material-icons">event</i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ overview.platformStats.totalEvents | number }}</div>
                <div class="stat-label">Total Events</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon transactions">
                <i class="material-icons">account_balance</i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ overview.platformStats.totalTransactions | number }}</div>
                <div class="stat-label">Transactions</div>
              </div>
            </div>
          </div>
        </div>

        <!-- User Growth -->
        <div class="stats-section">
          <h2><i class="material-icons">trending_up</i> User Growth</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-content">
                <div class="stat-number text-green">+{{ overview.userGrowth.newUsersThisMonth | number }}</div>
                <div class="stat-label">New This Month</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-content">
                <div class="stat-number text-blue">+{{ overview.userGrowth.newUsersThisWeek | number }}</div>
                <div class="stat-label">New This Week</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-content">
                <div class="stat-number text-orange">{{ overview.userGrowth.activeUsersThisWeek | number }}</div>
                <div class="stat-label">Active This Week</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Event Statistics -->
        <div class="stats-section">
          <h2><i class="material-icons">event_available</i> Event Statistics</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ overview.eventStats.upcomingEvents | number }}</div>
                <div class="stat-label">Upcoming Events</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ overview.eventStats.totalCapacity | number }}</div>
                <div class="stat-label">Total Capacity</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ overview.eventStats.totalAttending | number }}</div>
                <div class="stat-label">Total Attending</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ overview.eventStats.averageAttendance | number }}</div>
                <div class="stat-label">Avg. Attendance</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Financial Overview -->
        <div class="stats-section">
          <h2><i class="material-icons">monetization_on</i> Financial Overview</h2>
          <div class="stats-grid">
            <div class="stat-card financial">
              <div class="stat-content">
                <div class="stat-number text-green">{{ overview.financialStats.totalUserCoins | number }}</div>
                <div class="stat-label">User Coins</div>
              </div>
            </div>
            <div class="stat-card financial">
              <div class="stat-content">
                <div class="stat-number text-blue">{{ overview.financialStats.totalClubCoins | number }}</div>
                <div class="stat-label">Club Coins</div>
              </div>
            </div>
            <div class="stat-card financial">
              <div class="stat-content">
                <div class="stat-number text-purple">{{ overview.financialStats.totalPlatformCoins | number }}</div>
                <div class="stat-label">Total Platform Coins</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="recent-activity-section">
          <h2><i class="material-icons">schedule</i> Recent Activity</h2>
          <div class="activity-grid">
            <div class="activity-card">
              <h3>New Users</h3>
              <div class="activity-list">
                <div *ngFor="let user of overview.recentActivity.newUsers" class="activity-item">
                  <div class="activity-icon">
                    <i class="material-icons">person_add</i>
                  </div>
                  <div class="activity-content">
                    <div class="activity-title">{{ user.firstName }} {{ user.lastName }}</div>
                    <div class="activity-subtitle">{{ user.email }}</div>
                    <div class="activity-time">{{ formatDate(user.createdAt) }}</div>
                  </div>
                </div>
                <div *ngIf="overview.recentActivity.newUsers.length === 0" class="no-activity">
                  No new users this week
                </div>
              </div>
            </div>

            <div class="activity-card">
              <h3>New Clubs</h3>
              <div class="activity-list">
                <div *ngFor="let club of overview.recentActivity.newClubs" class="activity-item">
                  <div class="activity-icon">
                    <i class="material-icons">group_add</i>
                  </div>
                  <div class="activity-content">
                    <div class="activity-title">{{ club.name }}</div>
                    <div class="activity-subtitle">by {{ club.owner.firstName }} {{ club.owner.lastName }}</div>
                    <div class="activity-time">{{ formatDate(club.createdAt) }}</div>
                  </div>
                </div>
                <div *ngIf="overview.recentActivity.newClubs.length === 0" class="no-activity">
                  No new clubs this week
                </div>
              </div>
            </div>

            <div class="activity-card">
              <h3>Recent Events</h3>
              <div class="activity-list">
                <div *ngFor="let event of overview.recentActivity.recentEvents" class="activity-item">
                  <div class="activity-icon">
                    <i class="material-icons">event</i>
                  </div>
                  <div class="activity-content">
                    <div class="activity-title">{{ event.title }}</div>
                    <div class="activity-subtitle">{{ event.club.name }}</div>
                    <div class="activity-time">{{ formatDate(event.dateTime) }}</div>
                  </div>
                </div>
                <div *ngIf="overview.recentActivity.recentEvents.length === 0" class="no-activity">
                  No events created this week
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="error-container">
          <div class="error-content">
            <i class="material-icons">error</i>
            <p>{{ error }}</p>
            <button class="btn btn-primary" (click)="refreshData()">
              <i class="material-icons">refresh</i>
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Global Background (Design Guide Requirement) */
    .dashboard-layout {
      min-height: 100vh;
      background: linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #cbd5e1 100%);
      padding: 2rem 1rem;
    }

    /* Main Container (Design Guide Requirement) */
    .main-content {
      max-width: 1200px;
      margin: auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    /* Page Header */
    .page-header {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(34, 197, 94, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%);
      border: 1px solid rgba(251, 146, 60, 0.3);
      backdrop-filter: blur(20px);
      padding: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title {
      color: #000000;
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
      font-family: 'Poppins', sans-serif;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .dashboard-section {
      padding: 2rem;
      background: rgba(255, 255, 255, 0.3);
      display: grid;
      gap: 2rem;
    }

    .stats-section {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.08) 0%, rgba(255, 255, 255, 0.2) 100%);
      border: 1px solid rgba(251, 146, 60, 0.2);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 2rem;
      transition: all 0.3s ease;
    }

    .stats-section:hover {
      border-color: rgba(251, 146, 60, 0.8);
      box-shadow: 0 8px 25px rgba(251, 146, 60, 0.2);
      transform: translateY(-2px);
    }

    .stats-section h2 {
      margin: 0 0 1.5rem 0;
      color: #000000;
      font-size: 1.5rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-family: 'Poppins', sans-serif;
    }

    .stats-section h2 .material-icons {
      color: #fb923c;
      font-size: 28px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      min-height: 120px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(251, 146, 60, 0.2);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .stat-icon .material-icons {
      font-size: 24px;
    }

    .stat-content {
      flex: 1;
    }

    .stat-number {
      color: #1e293b;
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      color: #475569;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .text-green { color: #38a169; }
    .text-blue { color: #3182ce; }
    .text-orange { color: #dd6b20; }
    .text-purple { color: #805ad5; }

    .recent-activity-section {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.08) 0%, rgba(255, 255, 255, 0.2) 100%);
      border: 1px solid rgba(251, 146, 60, 0.2);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 2rem;
      transition: all 0.3s ease;
    }

    .recent-activity-section:hover {
      border-color: rgba(251, 146, 60, 0.8);
      box-shadow: 0 8px 25px rgba(251, 146, 60, 0.2);
      transform: translateY(-2px);
    }

    .recent-activity-section h2 {
      margin: 0 0 1.5rem 0;
      color: #000000;
      font-size: 1.5rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-family: 'Poppins', sans-serif;
    }

    .recent-activity-section h2 .material-icons {
      color: #fb923c;
      font-size: 28px;
    }

    .activity-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .activity-card {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(249, 115, 22, 0.1) 100%);
      border: 1px solid rgba(251, 146, 60, 0.3);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.2s ease;
    }

    .activity-card:hover {
      border-color: rgba(251, 146, 60, 0.8);
      box-shadow: 0 4px 12px rgba(251, 146, 60, 0.15);
    }

    .activity-card h3 {
      margin: 0 0 1rem 0;
      color: #000000;
      font-size: 1.125rem;
      font-weight: 700;
      font-family: 'Poppins', sans-serif;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(10px);
      border-radius: 8px;
      border: 1px solid rgba(251, 146, 60, 0.2);
      transition: all 0.2s ease;
    }

    .activity-item:hover {
      border-color: rgba(251, 146, 60, 0.5);
      background: rgba(255, 255, 255, 0.9);
    }

    .activity-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-content {
      flex: 1;
    }

    .activity-title {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .activity-subtitle {
      color: #475569;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .activity-time {
      color: #6b7280;
      font-size: 0.8rem;
    }

    .no-activity {
      text-align: center;
      color: #a0aec0;
      font-style: italic;
      padding: 20px;
    }

    /* Loading and Error States */
    .loading-container {
      padding: 4rem 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .loading-spinner {
      text-align: center;
      color: #fb923c;
    }

    .loading-spinner .material-icons {
      font-size: 3rem;
      margin-bottom: 1rem;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-container {
      padding: 4rem 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .error-content {
      text-align: center;
      background: rgba(248, 113, 113, 0.1);
      border: 1px solid rgba(248, 113, 113, 0.3);
      border-radius: 12px;
      padding: 2rem;
      backdrop-filter: blur(10px);
    }

    .error-content .material-icons {
      color: #dc2626;
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .error-content p {
      color: #dc2626;
      margin-bottom: 1rem;
    }

    /* Buttons (Design Guide Pattern) */
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      font-size: 0.875rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      color: white;
      border: 1px solid transparent;
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #ea580c, #d97706);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(251, 146, 60, 0.3);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    /* Responsive Design */
    @media (min-width: 640px) {
      .dashboard-layout {
        padding: 2rem;
      }
    }

    @media (max-width: 640px) {
      .dashboard-layout {
        padding: 1rem 0.5rem;
      }

      .page-header {
        padding: 1.5rem;
      }

      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .dashboard-section {
        padding: 1rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .activity-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .stat-card {
        padding: 1rem;
      }

      .stats-section, .recent-activity-section {
        padding: 1.5rem;
      }
    }
  `]
})
export class AdminOverviewComponent implements OnInit {
  overview: DashboardOverview | null = null;
  loading = false;
  error: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    this.loading = true;
    this.error = null;

    this.adminService.getDashboardOverview().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.overview = response.data;
        } else {
          this.error = 'Failed to load dashboard overview';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading overview:', error);
        this.error = 'Failed to load dashboard overview';
        this.loading = false;
      }
    });
  }

  refreshData(): void {
    this.loadOverview();
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}