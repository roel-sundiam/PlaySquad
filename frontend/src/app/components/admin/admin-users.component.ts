import { Component, OnInit } from '@angular/core';
import { AdminService, AdminUser } from '../../services/admin.service';

@Component({
  selector: 'app-admin-users',
  template: `
    <!-- Navigation Header (Required by Design Guide) -->
    <app-header></app-header>

    <!-- Main Content -->
    <div class="dashboard-layout">
      <div class="main-content">
        <!-- Header Section -->
        <div class="page-header">
          <div class="header-content">
            <h1 class="page-title">User Management</h1>
        <div class="header-actions">
          <div class="search-box">
            <i class="material-icons">search</i>
            <input 
              type="text" 
              placeholder="Search users..." 
              [(ngModel)]="searchTerm"
              (input)="onSearchChange()"
              class="search-input">
          </div>
          <button class="btn btn-primary" (click)="refreshUsers()" [disabled]="loading">
            <i class="material-icons">refresh</i>
            Refresh
          </button>
        </div>
      </div>

      <div class="filters-section">
        <div class="filter-group">
          <label>Sort by:</label>
          <select [(ngModel)]="sortBy" (change)="loadUsers()" class="filter-select">
            <option value="createdAt">Join Date</option>
            <option value="lastActive">Last Active</option>
            <option value="firstName">Name</option>
            <option value="skillLevel">Skill Level</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Order:</label>
          <select [(ngModel)]="sortOrder" (change)="loadUsers()" class="filter-select">
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      <div *ngIf="loading" class="loading-spinner">
        <i class="material-icons spinning">hourglass_empty</i>
        Loading users...
      </div>

      <div *ngIf="!loading && users.length === 0" class="empty-state">
        <i class="material-icons">people_outline</i>
        <h3>No users found</h3>
        <p>{{ searchTerm ? 'Try adjusting your search criteria' : 'No users have been registered yet' }}</p>
      </div>

      <div *ngIf="!loading && users.length > 0" class="users-content">
        <div class="users-stats">
          <div class="stat-item">
            <span class="stat-number">{{ pagination.total | number }}</span>
            <span class="stat-label">Total Users</span>
          </div>
        </div>

        <div class="users-table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Profile</th>
                <th>Activity</th>
                <th>Clubs</th>
                <th>Coins</th>
                <th>Stats</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users" class="user-row">
                <td class="user-info">
                  <div class="user-avatar">
                    <i class="material-icons">person</i>
                  </div>
                  <div class="user-details">
                    <div class="user-name">{{ user.firstName }} {{ user.lastName }}</div>
                    <div class="user-id">#{{ user._id.slice(-6) }}</div>
                  </div>
                </td>
                <td class="contact-info">
                  <div class="email">{{ user.email }}</div>
                  <div class="join-date">Joined {{ formatDate(user.createdAt) }}</div>
                </td>
                <td class="profile-info">
                  <div class="skill-badge" [class]="'skill-' + getSkillTier(user.skillLevel)">
                    Skill {{ user.skillLevel }}/10
                  </div>
                  <div class="format-info">{{ user.preferredFormat | titlecase }}</div>
                  <div class="gender-info">{{ user.gender | titlecase }}</div>
                </td>
                <td class="activity-info">
                  <div class="last-active" [class.recently-active]="isRecentlyActive(user.lastActive)">
                    {{ formatLastActive(user.lastActive) }}
                  </div>
                  <div class="activity-status" [class]="getActivityStatus(user.lastActive)">
                    {{ getActivityStatusLabel(user.lastActive) }}
                  </div>
                </td>
                <td class="clubs-info">
                  <div class="clubs-count">{{ user.clubs.length }} club{{ user.clubs.length !== 1 ? 's' : '' }}</div>
                  <div class="clubs-list" *ngIf="user.clubs.length > 0">
                    <span *ngFor="let club of user.clubs.slice(0, 2); let last = last" class="club-name">
                      {{ club.club?.name || 'Unknown' }}{{ !last && user.clubs.length > 1 ? ', ' : '' }}
                    </span>
                    <span *ngIf="user.clubs.length > 2" class="more-clubs">
                      +{{ user.clubs.length - 2 }} more
                    </span>
                  </div>
                </td>
                <td class="coins-info">
                  <div class="coin-balance">
                    <i class="material-icons">monetization_on</i>
                    {{ user.coinWallet?.balance || 0 }}
                  </div>
                  <div class="coin-stats">
                    <small>
                      Earned: {{ user.coinWallet?.totalEarned || 0 }} | 
                      Spent: {{ user.coinWallet?.totalSpent || 0 }}
                    </small>
                  </div>
                </td>
                <td class="game-stats">
                  <div class="games-played">{{ user.stats.gamesPlayed }} games</div>
                  <div class="win-rate" *ngIf="user.stats.gamesPlayed > 0">
                    {{ getWinRate(user.stats) }}% win rate
                  </div>
                  <div class="no-games" *ngIf="user.stats.gamesPlayed === 0">
                    No games yet
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination" *ngIf="pagination.totalPages > 1">
          <button 
            class="btn btn-secondary"
            (click)="changePage(currentPage - 1)"
            [disabled]="currentPage === 1">
            <i class="material-icons">chevron_left</i>
            Previous
          </button>
          
          <div class="page-info">
            Page {{ currentPage }} of {{ pagination.totalPages }}
            ({{ pagination.total }} total users)
          </div>
          
          <button 
            class="btn btn-secondary"
            (click)="changePage(currentPage + 1)"
            [disabled]="currentPage === pagination.totalPages">
            Next
            <i class="material-icons">chevron_right</i>
          </button>
        </div>
      </div>

      <div *ngIf="error" class="error-message">
        <i class="material-icons">error</i>
        <span>{{ error }}</span>
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

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-box .material-icons {
      position: absolute;
      left: 12px;
      color: #fb923c;
      font-size: 20px;
    }

    .search-input {
      padding: 12px 12px 12px 44px;
      border: 1px solid rgba(251, 146, 60, 0.3);
      border-radius: 8px;
      font-size: 1rem;
      width: 300px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
    }

    .search-input:focus {
      outline: none;
      border-color: #fb923c;
      box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.2);
    }

    .filters-section {
      display: flex;
      gap: 20px;
      margin-bottom: 24px;
      padding: 20px;
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.08) 0%, rgba(255, 255, 255, 0.2) 100%);
      border: 1px solid rgba(251, 146, 60, 0.2);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      margin: 2rem;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filter-group label {
      font-weight: 600;
      color: #4a5568;
      font-size: 0.9rem;
    }

    .filter-select {
      padding: 8px 12px;
      border: 1px solid rgba(251, 146, 60, 0.3);
      border-radius: 6px;
      font-size: 0.9rem;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
    }

    .users-content {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.08) 0%, rgba(255, 255, 255, 0.2) 100%);
      border: 1px solid rgba(251, 146, 60, 0.2);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      overflow: hidden;
      margin: 2rem;
      transition: all 0.3s ease;
    }

    .users-content:hover {
      border-color: rgba(251, 146, 60, 0.8);
      box-shadow: 0 8px 25px rgba(251, 146, 60, 0.2);
      transform: translateY(-2px);
    }

    .users-stats {
      padding: 20px;
      border-bottom: 1px solid rgba(251, 146, 60, 0.1);
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(249, 115, 22, 0.1) 100%);
      backdrop-filter: blur(10px);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .stat-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fb923c;
    }

    .stat-label {
      color: #718096;
      font-size: 0.9rem;
    }

    .users-table-container {
      overflow-x: auto;
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
    }

    .users-table th {
      padding: 16px;
      text-align: left;
      font-weight: 600;
      color: #1e293b;
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%);
      border-bottom: 1px solid rgba(251, 146, 60, 0.2);
      backdrop-filter: blur(10px);
    }

    .users-table td {
      padding: 16px;
      border-bottom: 1px solid rgba(251, 146, 60, 0.1);
      vertical-align: top;
    }

    .user-row:hover {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(249, 115, 22, 0.1) 100%);
      backdrop-filter: blur(10px);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 200px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-name {
      font-weight: 600;
      color: #2d3748;
    }

    .user-id {
      font-size: 0.8rem;
      color: #a0aec0;
      font-family: monospace;
    }

    .contact-info {
      min-width: 200px;
    }

    .email {
      color: #4a5568;
      margin-bottom: 4px;
    }

    .join-date {
      color: #a0aec0;
      font-size: 0.85rem;
    }

    .profile-info {
      min-width: 120px;
    }

    .skill-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 4px;
      display: inline-block;
    }

    .skill-beginner { background: #fef3c7; color: #d97706; }
    .skill-intermediate { background: #dbeafe; color: #1d4ed8; }
    .skill-advanced { background: #dcfce7; color: #16a34a; }
    .skill-expert { background: #f3e8ff; color: #7c3aed; }

    .format-info, .gender-info {
      color: #718096;
      font-size: 0.85rem;
    }

    .activity-info {
      min-width: 120px;
    }

    .last-active {
      color: #4a5568;
      font-size: 0.9rem;
      margin-bottom: 4px;
    }

    .last-active.recently-active {
      color: #16a34a;
      font-weight: 600;
    }

    .activity-status {
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .activity-status.online { background: #dcfce7; color: #16a34a; }
    .activity-status.recent { background: #fef3c7; color: #d97706; }
    .activity-status.inactive { background: #f1f5f9; color: #6b7280; }

    .clubs-info {
      min-width: 150px;
    }

    .clubs-count {
      font-weight: 600;
      color: #4a5568;
      margin-bottom: 4px;
    }

    .clubs-list {
      font-size: 0.85rem;
      color: #718096;
    }

    .club-name {
      color: #fb923c;
    }

    .more-clubs {
      color: #a0aec0;
    }

    .coins-info {
      min-width: 100px;
    }

    .coin-balance {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 600;
      color: #fb923c;
      margin-bottom: 4px;
    }

    .coin-balance .material-icons {
      font-size: 16px;
    }

    .coin-stats {
      font-size: 0.75rem;
      color: #a0aec0;
    }

    .game-stats {
      min-width: 100px;
    }

    .games-played {
      font-weight: 600;
      color: #4a5568;
      margin-bottom: 4px;
    }

    .win-rate {
      color: #16a34a;
      font-size: 0.85rem;
    }

    .no-games {
      color: #a0aec0;
      font-style: italic;
      font-size: 0.85rem;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-top: 1px solid rgba(251, 146, 60, 0.2);
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%);
      backdrop-filter: blur(10px);
    }

    .page-info {
      color: #4a5568;
      font-size: 0.9rem;
    }

    /* Loading, Empty, Error States */
    .loading-spinner {
      text-align: center;
      padding: 60px 20px;
      color: #fb923c;
      margin: 2rem;
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.08) 0%, rgba(255, 255, 255, 0.2) 100%);
      border: 1px solid rgba(251, 146, 60, 0.2);
      backdrop-filter: blur(20px);
      border-radius: 16px;
    }

    .loading-spinner .material-icons {
      font-size: 48px;
      margin-bottom: 16px;
      animation: spin 1s linear infinite;
      color: #fb923c;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: #6b7280;
      margin: 2rem;
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.08) 0%, rgba(255, 255, 255, 0.2) 100%);
      border: 1px solid rgba(251, 146, 60, 0.2);
      backdrop-filter: blur(20px);
      border-radius: 16px;
    }

    .empty-state .material-icons {
      font-size: 64px;
      margin-bottom: 20px;
      color: #fb923c;
      opacity: 0.7;
    }

    .error-message {
      background: rgba(248, 113, 113, 0.1);
      color: #dc2626;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid rgba(248, 113, 113, 0.3);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 2rem;
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

    .btn-secondary {
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(251, 146, 60, 0.3);
      color: #4a5568;
    }

    .btn-secondary:hover:not(:disabled) {
      background: rgba(251, 146, 60, 0.1);
      border-color: rgba(251, 146, 60, 0.8);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(251, 146, 60, 0.2);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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

      .filters-section {
        margin: 1rem;
        padding: 1rem;
        flex-wrap: wrap;
      }

      .users-content {
        margin: 1rem;
      }

      .search-input {
        width: 200px;
      }

      .users-table {
        font-size: 0.85rem;
      }

      .users-table th,
      .users-table td {
        padding: 12px 8px;
      }

      .pagination {
        flex-direction: column;
        gap: 12px;
      }

      .loading-spinner,
      .empty-state,
      .error-message {
        margin: 1rem;
      }
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  users: AdminUser[] = [];
  loading = false;
  error: string | null = null;
  
  // Filters and pagination
  searchTerm = '';
  sortBy = 'createdAt';
  sortOrder = 'desc';
  currentPage = 1;
  pageSize = 20;
  
  pagination = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  };

  private searchTimeout: any;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    const params = {
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchTerm,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    this.adminService.getUsers(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.users = response.data;
          this.pagination = (response as any).pagination || this.pagination;
        } else {
          this.error = 'Failed to load users';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.error = 'Failed to load users';
        this.loading = false;
      }
    });
  }

  onSearchChange(): void {
    // Debounce search to avoid too many API calls
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadUsers();
    }, 500);
  }

  refreshUsers(): void {
    this.loadUsers();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatLastActive(date: string | Date): string {
    const now = new Date();
    const lastActive = new Date(date);
    const diffMs = now.getTime() - lastActive.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 5) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return lastActive.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  isRecentlyActive(date: string | Date): boolean {
    const now = new Date();
    const lastActive = new Date(date);
    const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  }

  getActivityStatus(date: string | Date): string {
    const now = new Date();
    const lastActive = new Date(date);
    const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'online';
    if (diffHours < 24) return 'recent';
    return 'inactive';
  }

  getActivityStatusLabel(date: string | Date): string {
    const status = this.getActivityStatus(date);
    const labels = {
      'online': 'Online',
      'recent': 'Recent',
      'inactive': 'Inactive'
    };
    return labels[status as keyof typeof labels] || 'Unknown';
  }

  getSkillTier(skillLevel: number): string {
    if (skillLevel <= 3) return 'beginner';
    if (skillLevel <= 6) return 'intermediate';
    if (skillLevel <= 8) return 'advanced';
    return 'expert';
  }

  getWinRate(stats: { wins: number; gamesPlayed: number }): number {
    if (stats.gamesPlayed === 0) return 0;
    return Math.round((stats.wins / stats.gamesPlayed) * 100);
  }
}