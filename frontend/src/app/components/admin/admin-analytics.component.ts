import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminService, SiteAnalytics, DashboardOverview, RealtimeActivity } from '../../services/admin.service';
import { AnalyticsService, VisitorAnalytics } from '../../services/analytics.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-analytics',
  template: `
    <!-- Navigation Header (Required by Design Guide) -->
    <app-header></app-header>

    <!-- Main Content -->
    <div class="dashboard-layout">
      <div class="main-content">
        <!-- Header Section -->
        <div class="page-header">
          <div class="header-content">
            <h1 class="page-title">Site Analytics</h1>
            <div class="header-actions">
              <select [(ngModel)]="selectedPeriod" (change)="loadAnalytics()" class="filter-select">
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
              <button class="btn btn-primary" (click)="refreshAnalytics()" [disabled]="loading">
                <i class="material-icons">refresh</i>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="loading-container">
          <div class="loading-spinner">
            <i class="material-icons spinning">analytics</i>
            <p>Loading analytics data...</p>
          </div>
        </div>

        <!-- Analytics Content -->
        <div *ngIf="!loading" class="analytics-content">
          <!-- Real-time Activity -->
          <div class="realtime-section">
            <div class="section-header">
              <h2>Real-time Activity</h2>
              <div class="live-indicator">
                <span class="live-dot"></span>
                <span>Live</span>
                <div class="last-updated" *ngIf="realtimeData?.lastUpdated">
                  Updated: {{ formatRealtimeTimestamp(realtimeData?.lastUpdated || '') }}
                </div>
              </div>
            </div>
            <div class="realtime-stats">
              <div class="realtime-stat green">
                <div class="stat-number">{{ realtimeData?.activeUsersNow || 0 }}</div>
                <div class="stat-label">Active Users Now</div>
                <div class="stat-detail">Last 5 minutes</div>
              </div>
              <div class="realtime-stat blue">
                <div class="stat-number">{{ realtimeData?.anonymousVisitors || 0 }}</div>
                <div class="stat-label">Anonymous Visitors</div>
                <div class="stat-detail">Based on activity</div>
              </div>
              <div class="realtime-stat purple">
                <div class="stat-number">{{ realtimeData?.authenticatedActiveUsers || 0 }}</div>
                <div class="stat-label">Active Registered Users</div>
                <div class="stat-detail">Currently online</div>
              </div>
            </div>
          </div>

          <!-- Key Metrics Grid -->
          <div class="metrics-grid">
            <div class="metric-card blue-card">
              <div class="metric-icon">
                <i class="material-icons">visibility</i>
              </div>
              <div class="metric-content">
                <div class="metric-title">Total Page Views</div>
                <div class="metric-number">{{ calculateTotalPageViews() | number }}</div>
                <div class="metric-subtitle">Estimated from user activity</div>
              </div>
            </div>

            <div class="metric-card green-card">
              <div class="metric-icon">
                <i class="material-icons">people</i>
              </div>
              <div class="metric-content">
                <div class="metric-title">{{ getUniqueVisitorsLabel() }}</div>
                <div class="metric-number">{{ calculateUniqueVisitors() }}</div>
                <div class="metric-subtitle">{{ getUniqueVisitorsSubtitle() }}</div>
              </div>
            </div>

            <div class="metric-card purple-card">
              <div class="metric-icon">
                <i class="material-icons">verified_user</i>
              </div>
              <div class="metric-content">
                <div class="metric-title">Registered Users</div>
                <div class="metric-number">{{ overview?.platformStats?.totalUsers || 0 }}</div>
              </div>
            </div>

            <div class="metric-card orange-card">
              <div class="metric-icon">
                <i class="material-icons">analytics</i>
              </div>
              <div class="metric-content">
                <div class="metric-title">Growth Rate</div>
                <div class="metric-number">{{ calculateGrowthRate() }}%</div>
                <div class="metric-subtitle">New users vs total</div>
              </div>
            </div>
          </div>

          <!-- Two Column Layout -->
          <div class="two-column-layout">
            <!-- User Growth Trends -->
            <div class="analytics-card">
              <div class="card-header">
                <h3>User Growth Trends</h3>
              </div>
              <div class="traffic-trends">
                <div *ngFor="let trend of getFormattedUserGrowth()" class="trend-item">
                  <span class="trend-date">{{ trend.date }}</span>
                  <span class="trend-count">{{ trend.count }}</span>
                </div>
                <div *ngIf="getFormattedUserGrowth().length === 0" class="no-data">
                  No user registrations in selected period
                </div>
              </div>
            </div>

            <!-- Skill Level Distribution -->
            <div class="analytics-card">
              <div class="card-header">
                <h3>User Skill Levels</h3>
              </div>
              <div class="device-breakdown">
                <div *ngFor="let skill of analytics?.skillDistribution" class="device-item">
                  <div class="device-info">
                    <i class="material-icons device-icon">star</i>
                    <span class="device-name">Level {{ skill._id }}/10</span>
                  </div>
                  <div class="device-stats">
                    <span class="device-count">{{ skill.count }}</span>
                    <span class="device-percentage">({{ getSkillPercentage(skill.count) }}%)</span>
                  </div>
                </div>
                <div *ngIf="!analytics?.skillDistribution?.length" class="no-data">
                  No skill data available
                </div>
              </div>
            </div>
          </div>

          <!-- User Demographics -->
          <div class="analytics-card full-width">
            <div class="card-header">
              <h3>User Demographics</h3>
            </div>
            <div class="demographics-list">
              <div *ngFor="let demo of analytics?.userDemographics" class="demographic-item">
                <div class="demo-info">
                  <span class="demo-label">{{ demo._id || 'Not Specified' | titlecase }}</span>
                  <span class="demo-count">{{ demo.count }} users</span>
                </div>
                <div class="demo-bar">
                  <div class="demo-fill" [style.width.%]="getDemographicPercentage(demo.count)"></div>
                </div>
              </div>
              <div *ngIf="!analytics?.userDemographics?.length" class="no-data">
                No demographic data available
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="analytics-card full-width">
            <div class="card-header">
              <h3>Recent Activity</h3>
            </div>
            <div class="recent-activity">
              <div *ngFor="let user of overview?.recentActivity?.newUsers" class="activity-item">
                <div class="activity-dot"></div>
                <div class="activity-content">
                  <div class="activity-title">User Registration: {{ user.firstName }} {{ user.lastName }}</div>
                  <div class="activity-meta">{{ user.email }} • {{ formatDate(user.createdAt) }}</div>
                </div>
              </div>
              <div *ngFor="let club of overview?.recentActivity?.newClubs" class="activity-item">
                <div class="activity-dot club-dot"></div>
                <div class="activity-content">
                  <div class="activity-title">Club Created: {{ club.name }}</div>
                  <div class="activity-meta">by {{ club.owner?.firstName }} {{ club.owner?.lastName }} • {{ formatDate(club.createdAt) }}</div>
                </div>
              </div>
              <div *ngFor="let event of overview?.recentActivity?.recentEvents" class="activity-item">
                <div class="activity-dot event-dot"></div>
                <div class="activity-content">
                  <div class="activity-title">Event Created: {{ event.title }}</div>
                  <div class="activity-meta">{{ event.club?.name }} • {{ formatDate(event.createdAt) }}</div>
                </div>
              </div>
              <div *ngIf="!hasRecentActivity()" class="no-data">
                No recent activity in the selected period
              </div>
            </div>
          </div>

          <!-- User Activity Report -->
          <div class="report-section">
            <div class="section-header">
              <h2><i class="material-icons">bar_chart</i> User Activity Report</h2>
            </div>
            <div class="report-metrics">
              <div class="report-card blue">
                <div class="report-icon">
                  <i class="material-icons">people</i>
                </div>
                <div class="report-number">{{ overview?.platformStats?.totalUsers || 0 }}</div>
                <div class="report-label">Total Users</div>
              </div>
              <div class="report-card green">
                <div class="report-icon">
                  <i class="material-icons">group_add</i>
                </div>
                <div class="report-number">{{ overview?.userGrowth?.newUsersThisWeek || 0 }}</div>
                <div class="report-label">New This Week</div>
              </div>
              <div class="report-card purple">
                <div class="report-icon">
                  <i class="material-icons">schedule</i>
                </div>
                <div class="report-number">{{ overview?.userGrowth?.activeUsersThisWeek || 0 }}</div>
                <div class="report-label">Active This Week</div>
              </div>
              <div class="report-card orange">
                <div class="report-icon">
                  <i class="material-icons">event</i>
                </div>
                <div class="report-number">{{ overview?.platformStats?.totalEvents || 0 }}</div>
                <div class="report-label">Total Events</div>
              </div>
            </div>
          </div>

          <!-- Platform Growth -->
          <div class="analytics-card full-width">
            <div class="card-header">
              <h3>Platform Growth Over Time</h3>
            </div>
            <div class="growth-chart">
              <div *ngFor="let growth of analytics?.platformGrowth" class="growth-item">
                <div class="growth-period">{{ formatGrowthPeriod(growth._id) }}</div>
                <div class="growth-count">{{ growth.count }} users</div>
                <div class="growth-bar">
                  <div class="growth-fill" [style.width.%]="getGrowthPercentage(growth.count)"></div>
                </div>
              </div>
              <div *ngIf="!analytics?.platformGrowth?.length" class="no-data">
                No growth data available for selected period
              </div>
            </div>
          </div>

          <!-- User Visits Report -->
          <div class="visitor-report-section" *ngIf="visitorAnalytics; else visitorFallback">
            <div class="section-header">
              <h2><i class="material-icons">people</i> User Visits Report</h2>
              <div class="report-filters">
                <input type="date" class="filter-input">
                <input type="date" class="filter-input">
                <select class="filter-select">
                  <option>Latest Visit</option>
                  <option>Most Active</option>
                  <option>First Visit</option>
                </select>
                <button class="btn btn-primary">Refresh</button>
              </div>
            </div>

            <!-- Summary Cards -->
            <div class="visitor-summary-grid">
              <div class="visitor-card purple">
                <div class="visitor-icon">
                  <i class="material-icons">person</i>
                </div>
                <div class="visitor-stats">
                  <div class="visitor-count">{{ visitorAnalytics?.overview?.registeredVisitors || 1 }}</div>
                  <div class="visitor-label">Registered Visitors</div>
                </div>
              </div>
              <div class="visitor-card orange">
                <div class="visitor-icon">
                  <i class="material-icons">help</i>
                </div>
                <div class="visitor-stats">
                  <div class="visitor-count">{{ calculateAnonymousVisitors() }}</div>
                  <div class="visitor-label">Anonymous Visitors</div>
                </div>
              </div>
              <div class="visitor-card blue">
                <div class="visitor-icon">
                  <i class="material-icons">groups</i>
                </div>
                <div class="visitor-stats">
                  <div class="visitor-count">{{ calculateUniqueVisitors() + calculateAnonymousVisitors() }}</div>
                  <div class="visitor-label">Total Visitors</div>
                </div>
              </div>
            </div>

            <!-- Visitor Details Table -->
            <div class="visitor-table-container">
              <table class="visitor-table">
                <thead>
                  <tr>
                    <th>USER</th>
                    <th>ROLE</th>
                    <th>PAGE VIEWS</th>
                    <th>SESSIONS</th>
                    <th>AVG PAGES/SESSION</th>
                    <th>FIRST VISIT</th>
                    <th>LAST VISIT</th>
                    <th>IP ADDRESSES</th>
                    <th>DEVICES</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let visitor of getFilteredVisitors()" class="visitor-row">
                    <td class="visitor-user">
                      <div class="user-avatar">{{ getVisitorAvatar(visitor) }}</div>
                      <div class="user-info">
                        <div class="user-name">{{ getVisitorName(visitor) }}</div>
                        <div class="user-email">{{ getVisitorEmail(visitor) }}</div>
                        <div class="user-plan">{{ visitor.isAnonymous ? 'Anonymous' : 'Registered' }}</div>
                      </div>
                    </td>
                    <td>
                      <span class="role-badge seller">{{ visitor.isAnonymous ? 'Visitor' : 'Member' }}</span>
                    </td>
                    <td>
                      <div class="metric-with-icon">
                        <i class="material-icons">visibility</i>
                        <span>{{ visitor.pageViews }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="metric-with-icon">
                        <i class="material-icons">schedule</i>
                        <span>1</span>
                      </div>
                    </td>
                    <td>{{ getAvgPagesPerSession(visitor.pageViews) }}</td>
                    <td>{{ visitor.startTime | date:'MMM d, yyyy' }}</td>
                    <td>{{ getLastVisit(visitor) }}</td>
                    <td>
                      <span class="ip-address">{{ visitor.ipAddress || '127.0.0.1' }}</span>
                    </td>
                    <td>
                      <div class="device-info">
                        <i class="material-icons">{{ getDeviceIcon(visitor.deviceType) }}</i>
                        <span>{{ visitor.deviceType }}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Anonymous Visitors Report -->
          <div class="anonymous-visitors-section">
            <div class="section-header">
              <h2><i class="material-icons">help</i> Anonymous Visitors Report</h2>
              <div class="report-actions">
                <select class="filter-select">
                  <option>Recent Activity</option>
                  <option>Most Active</option>
                </select>
                <button class="btn btn-secondary">Refresh</button>
              </div>
            </div>

            <!-- Anonymous Summary Cards -->
            <div class="anonymous-summary-grid">
              <div class="summary-card orange">
                <div class="card-icon">
                  <i class="material-icons">help</i>
                </div>
                <div class="card-content">
                  <div class="card-number">{{ calculateAnonymousVisitors() }}</div>
                  <div class="card-label">Unique Visitors</div>
                </div>
              </div>
              <div class="summary-card blue">
                <div class="card-icon">
                  <i class="material-icons">visibility</i>
                </div>
                <div class="card-content">
                  <div class="card-number">{{ calculateTotalPageViews() }}</div>
                  <div class="card-label">Page Views</div>
                </div>
              </div>
              <div class="summary-card green">
                <div class="card-icon">
                  <i class="material-icons">schedule</i>
                </div>
                <div class="card-content">
                  <div class="card-number">{{ visitorAnalytics?.overview?.totalSessions || 0 }}</div>
                  <div class="card-label">Sessions</div>
                </div>
              </div>
              <div class="summary-card purple">
                <div class="card-icon">
                  <i class="material-icons">fingerprint</i>
                </div>
                <div class="card-content">
                  <div class="card-number">{{ calculateAnonymousVisitors() }}</div>
                  <div class="card-label">Unique IPs</div>
                </div>
              </div>
            </div>

            <!-- Anonymous Visitors Table -->
            <div class="anonymous-table-container">
              <table class="anonymous-table">
                <thead>
                  <tr>
                    <th>VISITOR ID</th>
                    <th>PAGE VIEWS</th>
                    <th>SESSIONS</th>
                    <th>AVG PAGES/SESSION</th>
                    <th>FIRST VISIT</th>
                    <th>LAST VISIT</th>
                    <th>IP ADDRESSES</th>
                    <th>DEVICE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let visitor of getAnonymousVisitors()" class="anonymous-row">
                    <td class="visitor-id">
                      <div class="id-avatar">{{ getVisitorIdShort(visitor.sessionId) }}</div>
                      <div class="id-info">
                        <div class="id-code">{{ getVisitorIdCode(visitor.sessionId) }}...</div>
                        <div class="id-type">{{ getVisitorIpLabel(visitor.ipAddress) }}</div>
                      </div>
                    </td>
                    <td>
                      <div class="metric-with-icon">
                        <i class="material-icons">visibility</i>
                        <span>{{ visitor.pageViews }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="metric-with-icon">
                        <i class="material-icons">schedule</i>
                        <span>1</span>
                      </div>
                    </td>
                    <td>{{ getAvgPagesPerSession(visitor.pageViews) }}</td>
                    <td>{{ visitor.startTime | date:'MMM d, yyyy' }}</td>
                    <td>{{ getLastVisit(visitor) }}</td>
                    <td>
                      <span class="ip-address">{{ visitor.ipAddress || '127.0.0.1' }}</span>
                    </td>
                    <td>
                      <div class="device-badge">
                        <i class="material-icons">{{ getDeviceIcon(visitor.deviceType) }}</i>
                        <span>{{ visitor.deviceType }}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="error-container">
          <div class="error-content">
            <i class="material-icons">error</i>
            <p>{{ error }}</p>
            <button class="btn btn-primary" (click)="refreshAnalytics()">
              <i class="material-icons">refresh</i>
              Try Again
            </button>
          </div>
        </div>

        <!-- Visitor Analytics Fallback -->
        <ng-template #visitorFallback>
          <div class="visitor-fallback-section">
            <div class="section-header">
              <h2><i class="material-icons">analytics</i> Enhanced Analytics Coming Soon</h2>
            </div>
            <div class="fallback-content">
              <div class="fallback-message">
                <i class="material-icons">info</i>
                <h3>Visitor Analytics Service Starting Up</h3>
                <p>Advanced visitor tracking and analytics are initializing. Basic analytics are available above.</p>
                <div class="fallback-features">
                  <div class="feature-item">
                    <i class="material-icons">visibility</i>
                    <span>Page View Tracking</span>
                  </div>
                  <div class="feature-item">
                    <i class="material-icons">devices</i>
                    <span>Device Analytics</span>
                  </div>
                  <div class="feature-item">
                    <i class="material-icons">schedule</i>
                    <span>Session Tracking</span>
                  </div>
                  <div class="feature-item">
                    <i class="material-icons">location_on</i>
                    <span>Visitor Location</span>
                  </div>
                </div>
                <button class="btn btn-secondary" (click)="loadVisitorAnalytics()">
                  <i class="material-icons">refresh</i>
                  Check Again
                </button>
              </div>
            </div>
          </div>
        </ng-template>
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
      max-width: 1400px;
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

    .filter-select {
      padding: 12px 16px;
      border: 1px solid rgba(251, 146, 60, 0.3);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      font-size: 1rem;
    }

    /* Analytics Content */
    .analytics-content {
      padding: 2rem;
      background: rgba(255, 255, 255, 0.3);
    }

    /* Real-time Activity Section */
    .realtime-section {
      margin-bottom: 2rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-header h2 {
      margin: 0;
      color: #1e293b;
      font-size: 1.5rem;
      font-weight: 700;
      font-family: 'Poppins', sans-serif;
    }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #22c55e;
      font-weight: 600;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    .realtime-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .realtime-stat {
      text-align: center;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }

    .realtime-stat.green .stat-number { color: #22c55e; }
    .realtime-stat.blue .stat-number { color: #3b82f6; }
    .realtime-stat.purple .stat-number { color: #8b5cf6; }

    .realtime-stat .stat-number {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .realtime-stat .stat-label {
      color: #6b7280;
      font-weight: 500;
    }

    .realtime-stat .stat-detail {
      color: #9ca3af;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .last-updated {
      font-size: 0.75rem;
      color: #9ca3af;
      margin-left: 0.5rem;
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .metric-card {
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      transition: all 0.3s ease;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    .blue-card { border: 1px solid rgba(59, 130, 246, 0.3); }
    .green-card { border: 1px solid rgba(34, 197, 94, 0.3); }
    .purple-card { border: 1px solid rgba(139, 92, 246, 0.3); }
    .orange-card { border: 1px solid rgba(251, 146, 60, 0.3); }

    .metric-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .blue-card .metric-icon { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .green-card .metric-icon { background: linear-gradient(135deg, #22c55e, #16a34a); }
    .purple-card .metric-icon { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
    .orange-card .metric-icon { background: linear-gradient(135deg, #fb923c, #f59e0b); }

    .metric-content {
      flex: 1;
    }

    .metric-title {
      color: #1e293b;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .metric-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .metric-subtitle {
      color: #6b7280;
      font-size: 0.875rem;
    }

    /* Two Column Layout */
    .two-column-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    /* Analytics Cards */
    .analytics-card {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.08) 0%, rgba(255, 255, 255, 0.2) 100%);
      border: 1px solid rgba(251, 146, 60, 0.2);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.3s ease;
      margin-bottom: 1.5rem;
    }

    .analytics-card:hover {
      border-color: rgba(251, 146, 60, 0.8);
      box-shadow: 0 8px 25px rgba(251, 146, 60, 0.2);
      transform: translateY(-2px);
    }

    .analytics-card.full-width {
      grid-column: 1 / -1;
    }

    .card-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(251, 146, 60, 0.1);
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%);
      backdrop-filter: blur(10px);
    }

    .card-header h3 {
      color: #1e293b;
      font-weight: 600;
      margin: 0;
      font-family: 'Poppins', sans-serif;
    }

    /* Traffic Trends */
    .traffic-trends {
      padding: 1.5rem;
    }

    .trend-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(251, 146, 60, 0.1);
    }

    .trend-item:last-child {
      border-bottom: none;
    }

    .trend-date {
      color: #6b7280;
      font-weight: 500;
    }

    .trend-count {
      color: #1e293b;
      font-weight: 600;
    }

    /* Device Breakdown */
    .device-breakdown {
      padding: 1.5rem;
    }

    .device-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      border-bottom: 1px solid rgba(251, 146, 60, 0.1);
    }

    .device-item:last-child {
      border-bottom: none;
    }

    .device-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .device-icon {
      color: #fb923c;
    }

    .device-name {
      color: #1e293b;
      font-weight: 500;
    }

    .device-stats {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .device-count {
      color: #1e293b;
      font-weight: 600;
    }

    .device-percentage {
      color: #6b7280;
      font-size: 0.875rem;
    }

    /* Demographics */
    .demographics-list {
      padding: 1.5rem;
    }

    .demographic-item {
      margin-bottom: 1rem;
    }

    .demo-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .demo-label {
      color: #1e293b;
      font-weight: 600;
    }

    .demo-count {
      color: #475569;
      font-size: 0.875rem;
    }

    .demo-bar {
      height: 8px;
      background: rgba(251, 146, 60, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }

    .demo-fill {
      height: 100%;
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      transition: width 0.3s ease;
    }

    /* Recent Activity */
    .recent-activity {
      padding: 1.5rem;
      max-height: 400px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(251, 146, 60, 0.1);
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-dot {
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
      margin-top: 0.5rem;
      flex-shrink: 0;
    }

    .activity-dot.club-dot {
      background: #3b82f6;
    }

    .activity-dot.event-dot {
      background: #8b5cf6;
    }

    .activity-title {
      color: #1e293b;
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .activity-meta {
      color: #6b7280;
      font-size: 0.875rem;
    }

    /* Report Sections */
    .report-section {
      margin: 2rem 0;
    }

    .report-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .report-card {
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      transition: all 0.3s ease;
    }

    .report-card.blue { border: 1px solid rgba(59, 130, 246, 0.3); }
    .report-card.green { border: 1px solid rgba(34, 197, 94, 0.3); }
    .report-card.purple { border: 1px solid rgba(139, 92, 246, 0.3); }
    .report-card.orange { border: 1px solid rgba(251, 146, 60, 0.3); }

    .report-icon {
      color: #fb923c;
      margin-bottom: 0.5rem;
    }

    .report-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .report-label {
      color: #6b7280;
      font-size: 0.875rem;
    }

    /* Growth Chart */
    .growth-chart {
      padding: 1.5rem;
    }

    .growth-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(251, 146, 60, 0.1);
    }

    .growth-item:last-child {
      border-bottom: none;
    }

    .growth-period {
      min-width: 120px;
      color: #6b7280;
      font-weight: 500;
    }

    .growth-count {
      min-width: 80px;
      color: #1e293b;
      font-weight: 600;
    }

    .growth-bar {
      flex: 1;
      height: 8px;
      background: rgba(251, 146, 60, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }

    .growth-fill {
      height: 100%;
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      transition: width 0.3s ease;
    }

    /* No Data State */
    .no-data {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
      font-style: italic;
    }

    /* Missing Data Notice */
    .missing-data-notice {
      margin: 2rem 0;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%);
      border: 1px solid rgba(59, 130, 246, 0.3);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      overflow: hidden;
    }

    .notice-content {
      padding: 2rem;
      text-align: center;
    }

    .notice-content .material-icons {
      color: #3b82f6;
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .notice-content h3 {
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    .notice-content p {
      color: #6b7280;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    .missing-features {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
    }

    .feature-tag {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* Visitor Report Sections */
    .visitor-report-section,
    .anonymous-visitors-section {
      margin: 2rem 0;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 1.5rem;
    }

    .visitor-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .visitor-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .visitor-card.purple {
      background: linear-gradient(135deg, rgba(139, 69, 193, 0.1) 0%, rgba(139, 69, 193, 0.05) 100%);
      border-color: rgba(139, 69, 193, 0.3);
    }

    .visitor-card.orange {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(251, 146, 60, 0.05) 100%);
      border-color: rgba(251, 146, 60, 0.3);
    }

    .visitor-card.blue {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
      border-color: rgba(59, 130, 246, 0.3);
    }

    .visitor-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      color: #fb923c;
    }

    .visitor-stats {
      flex: 1;
    }

    .visitor-count {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .visitor-label {
      color: #9ca3af;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .visitor-table-container,
    .anonymous-table-container {
      overflow-x: auto;
      margin-top: 1.5rem;
    }

    .visitor-table,
    .anonymous-table {
      width: 100%;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      overflow: hidden;
    }

    .visitor-table th,
    .anonymous-table th {
      background: rgba(255, 255, 255, 0.05);
      color: #9ca3af;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .visitor-table td,
    .anonymous-table td {
      padding: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
    }

    .visitor-user,
    .visitor-id {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar,
    .id-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .user-info,
    .id-info {
      flex: 1;
    }

    .user-name,
    .id-code {
      color: white;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .user-email,
    .id-type {
      color: #9ca3af;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .user-plan {
      color: #fb923c;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .role-badge {
      background: #10b981;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .metric-with-icon {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .metric-with-icon i {
      color: #fb923c;
      font-size: 1rem;
    }

    .ip-address {
      color: #3b82f6;
      font-family: monospace;
      font-size: 0.875rem;
    }

    .device-info,
    .device-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #9ca3af;
    }

    .device-info i,
    .device-badge i {
      color: #fb923c;
    }

    .anonymous-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .summary-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .summary-card.orange {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(251, 146, 60, 0.05) 100%);
      border-color: rgba(251, 146, 60, 0.3);
    }

    .summary-card.blue {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
      border-color: rgba(59, 130, 246, 0.3);
    }

    .summary-card.green {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
      border-color: rgba(16, 185, 129, 0.3);
    }

    .summary-card.purple {
      background: linear-gradient(135deg, rgba(139, 69, 193, 0.1) 0%, rgba(139, 69, 193, 0.05) 100%);
      border-color: rgba(139, 69, 193, 0.3);
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      color: #fb923c;
    }

    .card-content {
      flex: 1;
    }

    .card-number {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .card-label {
      color: #9ca3af;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .report-filters,
    .report-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .filter-input {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .filter-input:focus {
      outline: none;
      border-color: #fb923c;
    }

    /* Visitor Analytics Fallback */
    .visitor-fallback-section {
      margin: 2rem 0;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 1.5rem;
    }

    .fallback-content {
      padding: 2rem;
    }

    .fallback-message {
      text-align: center;
      max-width: 600px;
      margin: 0 auto;
    }

    .fallback-message .material-icons {
      font-size: 3rem;
      color: #fb923c;
      margin-bottom: 1rem;
    }

    .fallback-message h3 {
      color: white;
      margin-bottom: 0.5rem;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .fallback-message p {
      color: #9ca3af;
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .fallback-features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: #9ca3af;
    }

    .feature-item .material-icons {
      color: #fb923c;
      font-size: 1.25rem;
    }

    .feature-item span {
      font-size: 0.875rem;
      font-weight: 500;
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

    /* Loading, Empty, Error States */
    .loading-container, .empty-state, .error-container {
      padding: 4rem 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .loading-spinner, .empty-content, .error-content {
      text-align: center;
      color: #6b7280;
    }

    .loading-spinner .material-icons, .empty-content .material-icons {
      font-size: 4rem;
      margin-bottom: 1rem;
      color: #fb923c;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-content {
      background: rgba(248, 113, 113, 0.1);
      border: 1px solid rgba(248, 113, 113, 0.3);
      border-radius: 12px;
      padding: 2rem;
      backdrop-filter: blur(10px);
    }

    .error-content .material-icons {
      color: #dc2626;
    }

    .error-content p {
      color: #dc2626;
      margin-bottom: 1rem;
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

      .analytics-content {
        padding: 1rem;
      }

      .two-column-layout {
        grid-template-columns: 1fr;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .report-metrics {
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }

      .missing-features {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class AdminAnalyticsComponent implements OnInit, OnDestroy {
  analytics: SiteAnalytics | null = null;
  overview: DashboardOverview | null = null;
  visitorAnalytics: VisitorAnalytics | null = null;
  realtimeData: RealtimeActivity | null = null;
  loading = false;
  error: string | null = null;
  selectedPeriod = '30d';
  activeVisitors = 0;

  private realtimeSubscription?: Subscription;
  private realtimeDataSubscription?: Subscription;
  private activeVisitorsSubscription?: Subscription;

  constructor(
    private adminService: AdminService,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit(): void {
    this.loadAnalytics();
    this.loadRealtimeData(); // Load real-time data immediately
    this.startRealtimeUpdates();
  }

  ngOnDestroy(): void {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
    }
    if (this.realtimeDataSubscription) {
      this.realtimeDataSubscription.unsubscribe();
    }
    if (this.activeVisitorsSubscription) {
      this.activeVisitorsSubscription.unsubscribe();
    }
  }

  loadAnalytics(): void {
    this.loading = true;
    this.error = null;

    // Load analytics and overview data (visitor data optional)
    Promise.all([
      this.adminService.getSiteAnalytics(this.selectedPeriod).toPromise(),
      this.adminService.getDashboardOverview().toPromise()
    ]).then(([analyticsResponse, overviewResponse]) => {
      if (analyticsResponse?.success && analyticsResponse.data) {
        this.analytics = analyticsResponse.data;
      }
      if (overviewResponse?.success && overviewResponse.data) {
        this.overview = overviewResponse.data;
      }
      
      // Load visitor analytics separately (optional)
      this.loadVisitorAnalytics();
      
      this.loading = false;
    }).catch(error => {
      console.error('Error loading analytics:', error);
      // If visitor analytics fail, still show basic analytics
      if (error?.status !== 404) {
        this.error = 'Failed to load analytics data';
      } else {
        console.warn('Visitor analytics service not available - showing basic analytics only');
      }
      this.loading = false;
    });
  }

  refreshAnalytics(): void {
    this.loadAnalytics();
  }

  loadVisitorAnalytics(): void {
    this.analyticsService.getVisitorAnalytics({ period: this.selectedPeriod }).subscribe({
      next: (response) => {
        if (response?.success && response.data) {
          this.visitorAnalytics = response.data;
          this.activeVisitors = this.visitorAnalytics?.overview?.currentlyActive || 0;
        }
      },
      error: (error) => {
        console.warn('Visitor analytics not available:', error);
        // Fallback to basic analytics for visitor counts
        this.activeVisitors = this.analytics?.currentlyActiveUsers || 0;
      }
    });
  }

  loadRealtimeData(): void {
    this.adminService.getRealtimeActivity().subscribe({
      next: (response) => {
        if (response?.success && response.data) {
          this.realtimeData = response.data;
          console.log('Real-time data updated:', this.realtimeData);
        }
      },
      error: (error) => {
        console.warn('Real-time data not available:', error);
        console.error('Realtime endpoint error details:', error);
        
        // Fallback to using existing analytics data for real-time stats
        if (this.analytics || this.overview) {
          this.realtimeData = {
            activeUsersNow: this.analytics?.currentlyActiveUsers || 0,
            veryRecentUsers: 0,
            authenticatedActiveUsers: this.analytics?.currentlyActiveUsers || 0,
            anonymousVisitors: 0,
            newUsersToday: this.overview?.userGrowth?.newUsersThisWeek || 0,
            newClubsToday: 0,
            newEventsToday: 0,
            recentlyActiveUsers: [],
            timestamp: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };
          console.log('Using fallback real-time data:', this.realtimeData);
        }
      }
    });
  }

  startRealtimeUpdates(): void {
    // Refresh analytics every 30 seconds for real-time effect
    this.realtimeSubscription = interval(30000).subscribe(() => {
      this.loadAnalytics();
    });

    // Update real-time data every 10 seconds for truly real-time experience
    this.realtimeDataSubscription = interval(10000).subscribe(() => {
      this.loadRealtimeData();
    });

    // Subscribe to active visitors updates for real-time data
    this.activeVisitorsSubscription = this.analyticsService.activeVisitors$.subscribe(
      activeCount => {
        this.activeVisitors = activeCount;
      }
    );
  }

  calculateAnonymousVisitors(): number {
    // Use real visitor tracking data if available, otherwise estimate
    if (this.visitorAnalytics?.overview?.anonymousVisitors !== undefined) {
      return this.visitorAnalytics.overview.anonymousVisitors;
    }
    // Fallback to estimation
    const activeUsers = this.analytics?.currentlyActiveUsers || 0;
    return Math.floor(activeUsers * 2.5);
  }

  calculateTotalPageViews(): number {
    // Use real visitor tracking data if available, otherwise estimate
    if (this.visitorAnalytics?.overview?.totalPageViews !== undefined) {
      return this.visitorAnalytics.overview.totalPageViews;
    }
    // Fallback to estimation
    const totalUsers = this.overview?.platformStats?.totalUsers || 0;
    const activeUsers = this.analytics?.currentlyActiveUsers || 0;
    return activeUsers * 8 + totalUsers * 2;
  }

  calculateUniqueVisitors(): number {
    // Use real visitor tracking data if available, otherwise estimate
    if (this.visitorAnalytics?.overview?.uniqueVisitors !== undefined) {
      return this.visitorAnalytics.overview.uniqueVisitors;
    }
    // Fallback to currently active users
    return this.analytics?.currentlyActiveUsers || 0;
  }

  calculateActiveRegisteredUsers(): number {
    // Use real visitor tracking data if available
    if (this.visitorAnalytics?.overview?.registeredVisitors !== undefined) {
      return this.visitorAnalytics.overview.registeredVisitors;
    }
    // Fallback to currently active users from basic analytics
    return this.analytics?.currentlyActiveUsers || 0;
  }

  calculateGrowthRate(): number {
    const newUsers = this.overview?.userGrowth?.newUsersThisMonth || 0;
    const totalUsers = this.overview?.platformStats?.totalUsers || 1;
    return Math.round((newUsers / totalUsers) * 100);
  }

  getFormattedUserGrowth(): any[] {
    if (!this.analytics?.userGrowth) return [];
    
    return this.analytics.userGrowth.map(item => ({
      date: this.formatGrowthDate(item._id),
      count: item.count
    })).slice(-7); // Show last 7 days
  }

  formatGrowthDate(dateObj: any): string {
    if (!dateObj) return '';
    return `${dateObj.month}/${dateObj.day}`;
  }

  formatGrowthPeriod(dateObj: any): string {
    if (!dateObj) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[dateObj.month - 1]} ${dateObj.year}`;
  }

  getSkillPercentage(count: number): number {
    const totalUsers = this.overview?.platformStats?.totalUsers || 1;
    return Math.round((count / totalUsers) * 100);
  }

  getDemographicPercentage(count: number): number {
    const totalUsers = this.overview?.platformStats?.totalUsers || 1;
    return Math.round((count / totalUsers) * 100);
  }

  getGrowthPercentage(count: number): number {
    if (!this.analytics?.platformGrowth) return 0;
    const maxCount = Math.max(...this.analytics.platformGrowth.map(g => g.count));
    return maxCount > 0 ? (count / maxCount) * 100 : 0;
  }

  hasRecentActivity(): boolean {
    return !!(
      (this.overview?.recentActivity?.newUsers?.length) ||
      (this.overview?.recentActivity?.newClubs?.length) ||
      (this.overview?.recentActivity?.recentEvents?.length)
    );
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Helper methods for visitor analytics templates
  getAnonymousVisitors(): any[] {
    return this.visitorAnalytics?.recentVisitors?.filter(v => 
      v.isAnonymous && 
      v.ipAddress !== '::1' && 
      v.ipAddress !== '127.0.0.1' && 
      v.ipAddress !== 'localhost'
    )?.slice(0, 10) || [];
  }

  getFilteredVisitors(): any[] {
    return this.visitorAnalytics?.recentVisitors?.filter(v =>
      v.ipAddress !== '::1' && 
      v.ipAddress !== '127.0.0.1' && 
      v.ipAddress !== 'localhost'
    )?.slice(0, 10) || [];
  }

  getVisitorAvatar(visitor: any): string {
    return visitor.user?.firstName?.[0] || '?';
  }

  getVisitorName(visitor: any): string {
    return visitor.user ? 
      `${visitor.user.firstName} ${visitor.user.lastName}` : 
      'Anonymous User';
  }

  getVisitorEmail(visitor: any): string {
    return visitor.user?.email || `${visitor.sessionId.substring(0, 12)}...`;
  }

  getVisitorIdShort(sessionId: string): string {
    return sessionId.substring(8, 10).toUpperCase();
  }

  getVisitorIdCode(sessionId: string): string {
    return sessionId.substring(0, 8);
  }

  getVisitorIpLabel(ipAddress: string): string {
    return ipAddress ? `IP(${ipAddress.split('.').pop()})` : 'Anonymous';
  }

  getAvgPagesPerSession(pageViews: number): string {
    return (pageViews || 1).toFixed(1);
  }

  getLastVisit(visitor: any): string {
    return visitor.isActive ? 'now' : new Date(visitor.lastActivity).toLocaleString();
  }

  getDeviceIcon(deviceType: string): string {
    switch (deviceType) {
      case 'mobile': return 'phone_android';
      case 'tablet': return 'tablet_mac';
      default: return 'computer';
    }
  }

  formatRealtimeTimestamp(timestamp: string): string {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 30000) { // Less than 30 seconds
      return 'Just now';
    } else if (diff < 60000) { // Less than 1 minute
      return `${Math.floor(diff / 1000)}s ago`;
    } else if (diff < 300000) { // Less than 5 minutes
      return `${Math.floor(diff / 60000)}m ago`;
    } else {
      return date.toLocaleTimeString();
    }
  }

  getUniqueVisitorsLabel(): string {
    if (this.visitorAnalytics?.overview?.uniqueVisitors !== undefined) {
      return 'Unique Visitors';
    }
    return 'Active Users (24h)';
  }

  getUniqueVisitorsSubtitle(): string {
    if (this.visitorAnalytics?.overview?.uniqueVisitors !== undefined) {
      return 'Real visitor tracking';
    }
    return 'Users active in last 24 hours';
  }
}