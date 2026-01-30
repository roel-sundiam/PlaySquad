import { Component, OnInit } from '@angular/core';
import { AdminService, AdminClub } from '../../services/admin.service';

@Component({
  selector: 'app-admin-clubs',
  template: `
    <!-- Navigation Header (Required by Design Guide) -->
    <app-header></app-header>

    <!-- Main Content -->
    <div class="dashboard-layout">
      <div class="main-content">
        <!-- Header Section -->
        <div class="page-header">
          <div class="header-content">
            <h1 class="page-title">Clubs Management</h1>
            <div class="header-actions">
              <div class="search-container">
                <i class="material-icons">search</i>
                <input 
                  type="text" 
                  placeholder="Search clubs..." 
                  [(ngModel)]="searchTerm"
                  (input)="onSearchChange()"
                  class="search-input">
              </div>
              <select [(ngModel)]="sportFilter" (change)="loadClubs()" class="filter-select">
                <option value="">All Sports</option>
                <option value="tennis">Tennis</option>
                <option value="badminton">Badminton</option>
                <option value="squash">Squash</option>
                <option value="table-tennis">Table Tennis</option>
                <option value="pickleball">Pickleball</option>
              </select>
              <button class="btn btn-primary" (click)="refreshClubs()" [disabled]="loading">
                <i class="material-icons">refresh</i>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="loading-container">
          <div class="loading-spinner">
            <i class="material-icons spinning">hourglass_empty</i>
            <p>Loading clubs data...</p>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && clubs.length === 0" class="empty-state">
          <div class="empty-content">
            <i class="material-icons">groups_outline</i>
            <h3>No clubs found</h3>
            <p>{{ searchTerm || sportFilter ? 'Try adjusting your search criteria' : 'No clubs have been created yet' }}</p>
          </div>
        </div>

        <!-- Statistics Section -->
        <div *ngIf="!loading && clubs.length > 0" class="stats-section">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <i class="material-icons">groups</i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ pagination.total | number }}</div>
                <div class="stat-label">Total Clubs</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="material-icons">people</i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ getTotalMembers() | number }}</div>
                <div class="stat-label">Total Members</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="material-icons">monetization_on</i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ getTotalCoins() | number }}</div>
                <div class="stat-label">Total Coins</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="material-icons">trending_up</i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ getAverageMembers() | number }}</div>
                <div class="stat-label">Avg Members</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Clubs Grid -->
        <div *ngIf="!loading && clubs.length > 0" class="clubs-section">
          <div class="clubs-grid">
            <div *ngFor="let club of clubs" class="club-card">
              <!-- Club Header -->
              <div class="club-header">
                <div class="club-title-section">
                  <h3 class="club-name">{{ club.name }}</h3>
                  <div class="club-badges">
                    <span class="sport-badge" [class]="'sport-' + club.sport">
                      {{ club.sport | titlecase }}
                    </span>
                    <span class="privacy-badge" [class.private]="club.isPrivate">
                      {{ club.isPrivate ? 'Private' : 'Public' }}
                    </span>
                  </div>
                </div>
                <div class="club-id">#{{ club._id.slice(-6) }}</div>
              </div>

              <!-- Club Description -->
              <div class="club-description" *ngIf="club.description">
                {{ club.description }}
              </div>

              <!-- Club Location -->
              <div class="club-location">
                <i class="material-icons">location_on</i>
                <div class="location-details">
                  <div class="location-name">{{ club.location.name }}</div>
                  <div class="location-address">{{ club.location.address }}</div>
                </div>
              </div>

              <!-- Club Owner -->
              <div class="club-owner">
                <i class="material-icons">person_pin</i>
                <div class="owner-details">
                  <div class="owner-name">{{ club.owner.firstName }} {{ club.owner.lastName }}</div>
                  <div class="owner-email">{{ club.owner.email }}</div>
                </div>
              </div>

              <!-- Club Statistics -->
              <div class="club-stats">
                <div class="stats-row">
                  <div class="stat-item">
                    <i class="material-icons">people</i>
                    <div class="stat-info">
                      <span class="stat-value">{{ club.memberCount }}</span>
                      <span class="stat-label">Members</span>
                    </div>
                  </div>
                  <div class="stat-item">
                    <i class="material-icons">admin_panel_settings</i>
                    <div class="stat-info">
                      <span class="stat-value">{{ club.adminCount }}</span>
                      <span class="stat-label">Admins</span>
                    </div>
                  </div>
                  <div class="stat-item">
                    <i class="material-icons">how_to_reg</i>
                    <div class="stat-info">
                      <span class="stat-value">{{ club.joinRequestsCount }}</span>
                      <span class="stat-label">Requests</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- All Members List -->
              <div class="club-members-section" *ngIf="club.members && club.members.length > 0">
                <div class="members-header">
                  <h4>
                    <i class="material-icons">group</i>
                    All Members ({{ getActiveMembers(club).length }})
                  </h4>
                  <button 
                    class="toggle-members-btn"
                    (click)="toggleMembersView(club._id)"
                    [class.expanded]="expandedClubs.has(club._id)">
                    <i class="material-icons">{{ expandedClubs.has(club._id) ? 'expand_less' : 'expand_more' }}</i>
                  </button>
                </div>
                
                <div class="members-list" [class.expanded]="expandedClubs.has(club._id)">
                  <div *ngFor="let member of getActiveMembers(club)" class="member-item">
                    <div class="member-avatar">
                      <span>{{ getMemberInitials(member) }}</span>
                    </div>
                    <div class="member-info">
                      <div class="member-name">{{ member.user.firstName }} {{ member.user.lastName }}</div>
                      <div class="member-details">
                        <span class="member-email">{{ member.user.email }}</span>
                        <span class="member-role" [class]="'role-' + member.role">{{ member.role | titlecase }}</span>
                      </div>
                    </div>
                    <div class="member-date">
                      Joined {{ formatDate(member.joinedAt) }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Financial Information -->
              <div class="club-financial">
                <div class="financial-header">
                  <i class="material-icons">account_balance_wallet</i>
                  <h4>Club Wallet</h4>
                </div>
                <div class="financial-stats">
                  <div class="balance-info">
                    <div class="current-balance">
                      <span class="balance-amount">{{ club.coinWallet?.balance || 0 }}</span>
                      <span class="balance-label">Current Coins</span>
                    </div>
                    <div class="balance-breakdown">
                      <span>Earned: {{ club.coinWallet?.totalEarned || 0 }}</span>
                      <span>Spent: {{ club.coinWallet?.totalSpent || 0 }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Club Footer -->
              <div class="club-footer">
                <span class="created-date">Created {{ formatDate(club.createdAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div class="pagination-section" *ngIf="pagination.totalPages > 1">
            <div class="pagination-container">
              <button 
                class="btn btn-secondary"
                (click)="changePage(currentPage - 1)"
                [disabled]="currentPage === 1">
                <i class="material-icons">chevron_left</i>
                Previous
              </button>
              
              <div class="page-info">
                <span class="page-text">Page {{ currentPage }} of {{ pagination.totalPages }}</span>
                <span class="total-text">({{ pagination.total }} total clubs)</span>
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
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="error-container">
          <div class="error-content">
            <i class="material-icons">error</i>
            <p>{{ error }}</p>
            <button class="btn btn-primary" (click)="refreshClubs()">
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

    /* Search Container */
    .search-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-container .material-icons {
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
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      width: 250px;
    }

    .search-input:focus {
      outline: none;
      border-color: #fb923c;
      box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.1);
    }

    .filter-select {
      padding: 12px 16px;
      border: 1px solid rgba(251, 146, 60, 0.3);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      font-size: 1rem;
    }

    /* Statistics Section (Design Guide Pattern) */
    .stats-section {
      padding: 2rem;
      background: rgba(255, 255, 255, 0.5);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.4);
      padding: 1.5rem;
      border-radius: 16px;
      min-height: 120px;
      display: flex;
      align-items: center;
      gap: 1rem;
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

    /* Clubs Section */
    .clubs-section {
      padding: 2rem;
      background: rgba(255, 255, 255, 0.3);
    }

    .clubs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    /* Club Cards (Design Guide Pattern) */
    .club-card {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.08) 0%, rgba(255, 255, 255, 0.2) 100%);
      border: 1px solid rgba(251, 146, 60, 0.2);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .club-card:hover {
      border-color: rgba(251, 146, 60, 0.8);
      box-shadow: 0 8px 25px rgba(251, 146, 60, 0.2);
      transform: translateY(-2px);
    }

    .club-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(251, 146, 60, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .club-name {
      color: #000000;
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      font-family: 'Poppins', sans-serif;
    }

    .club-badges {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .sport-badge, .privacy-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      backdrop-filter: blur(10px);
    }

    .sport-tennis { background: rgba(59, 130, 246, 0.2); color: #1e40af; border: 1px solid rgba(59, 130, 246, 0.3); }
    .sport-badminton { background: rgba(34, 197, 94, 0.2); color: #16a34a; border: 1px solid rgba(34, 197, 94, 0.3); }
    .sport-squash { background: rgba(245, 158, 11, 0.2); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3); }
    .sport-table-tennis { background: rgba(139, 69, 19, 0.2); color: #7c3aed; border: 1px solid rgba(139, 69, 19, 0.3); }
    .sport-pickleball { background: rgba(236, 72, 153, 0.2); color: #be185d; border: 1px solid rgba(236, 72, 153, 0.3); }

    .privacy-badge {
      background: rgba(107, 114, 128, 0.2);
      color: #64748b;
      border: 1px solid rgba(107, 114, 128, 0.3);
    }

    .privacy-badge.private {
      background: rgba(220, 38, 38, 0.2);
      color: #dc2626;
      border: 1px solid rgba(220, 38, 38, 0.3);
    }

    .club-id {
      font-family: 'Courier New', monospace;
      background: rgba(251, 146, 60, 0.1);
      border: 1px solid rgba(251, 146, 60, 0.3);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      color: #fb923c;
      font-weight: 600;
    }

    .club-description {
      padding: 0 1.5rem 1rem 1.5rem;
      color: #475569;
      line-height: 1.5;
      font-size: 0.95rem;
    }

    .club-location, .club-owner {
      padding: 0 1.5rem 1rem 1.5rem;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .club-location .material-icons, .club-owner .material-icons {
      color: #fb923c;
      font-size: 20px;
      margin-top: 2px;
    }

    .location-name, .owner-name {
      color: #1e293b;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .location-address, .owner-email {
      color: #475569;
      font-size: 0.875rem;
    }

    /* Club Statistics */
    .club-stats {
      padding: 1rem 1.5rem;
      background: rgba(251, 146, 60, 0.05);
      border-top: 1px solid rgba(251, 146, 60, 0.1);
      border-bottom: 1px solid rgba(251, 146, 60, 0.1);
    }

    .stats-row {
      display: flex;
      justify-content: space-around;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stat-item .material-icons {
      color: #fb923c;
      font-size: 20px;
    }

    .stat-value {
      color: #1e293b;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .stat-label {
      color: #475569;
      font-size: 0.8rem;
      margin-left: 0.25rem;
    }

    /* Members Section */
    .club-members-section {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(251, 146, 60, 0.1);
    }

    .members-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .members-header h4 {
      color: #000000;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .members-header .material-icons {
      color: #fb923c;
    }

    .toggle-members-btn {
      background: rgba(251, 146, 60, 0.1);
      border: 1px solid rgba(251, 146, 60, 0.3);
      border-radius: 8px;
      padding: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .toggle-members-btn:hover {
      background: rgba(251, 146, 60, 0.2);
      transform: scale(1.05);
    }

    .toggle-members-btn .material-icons {
      color: #fb923c;
    }

    .members-list {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }

    .members-list.expanded {
      max-height: 600px;
      overflow-y: auto;
      overflow-x: hidden;

      /* Custom scrollbar styling for WebKit browsers (Chrome, Edge, Safari) */
      &::-webkit-scrollbar {
        width: 8px;
      }

      &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;

        &:hover {
          background: #555;
        }
      }

      /* Firefox scrollbar styling */
      scrollbar-width: thin;
      scrollbar-color: #888 #f1f1f1;
    }

    .member-item {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(249, 115, 22, 0.1) 100%);
      border: 1px solid rgba(251, 146, 60, 0.3);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.2s ease;
    }

    .member-item:hover {
      border-color: rgba(251, 146, 60, 0.8);
      box-shadow: 0 4px 12px rgba(251, 146, 60, 0.15);
    }

    .member-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .member-info {
      flex: 1;
    }

    .member-name {
      color: #1e293b;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .member-details {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .member-email {
      color: #475569;
      font-size: 0.875rem;
    }

    .member-role {
      padding: 0.125rem 0.5rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .role-admin { background: rgba(220, 38, 38, 0.2); color: #dc2626; }
    .role-organizer { background: rgba(245, 158, 11, 0.2); color: #d97706; }
    .role-member { background: rgba(34, 197, 94, 0.2); color: #16a34a; }

    .member-date {
      color: #6b7280;
      font-size: 0.8rem;
    }

    /* Financial Section */
    .club-financial {
      padding: 1.5rem;
      background: rgba(251, 146, 60, 0.05);
    }

    .financial-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .financial-header .material-icons {
      color: #fb923c;
    }

    .financial-header h4 {
      color: #000000;
      font-weight: 600;
      margin: 0;
    }

    .balance-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .current-balance {
      display: flex;
      flex-direction: column;
    }

    .balance-amount {
      color: #fb923c;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .balance-label {
      color: #475569;
      font-size: 0.875rem;
    }

    .balance-breakdown {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.8rem;
      color: #6b7280;
    }

    /* Club Footer */
    .club-footer {
      padding: 1rem 1.5rem;
      background: rgba(251, 146, 60, 0.03);
      text-align: center;
      border-top: 1px solid rgba(251, 146, 60, 0.1);
    }

    .created-date {
      color: #6b7280;
      font-size: 0.875rem;
    }

    /* Pagination */
    .pagination-section {
      padding: 2rem;
      background: rgba(255, 255, 255, 0.5);
    }

    .pagination-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(251, 146, 60, 0.2);
      border-radius: 12px;
      padding: 1rem 1.5rem;
    }

    .page-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .page-text {
      color: #1e293b;
      font-weight: 600;
    }

    .total-text {
      color: #475569;
      font-size: 0.875rem;
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
      background: rgba(251, 146, 60, 0.1);
      color: #fb923c;
      border: 1px solid rgba(251, 146, 60, 0.3);
      backdrop-filter: blur(10px);
    }

    .btn-secondary:hover:not(:disabled) {
      background: rgba(251, 146, 60, 0.2);
      border-color: rgba(251, 146, 60, 0.5);
      transform: translateY(-1px);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    /* Loading States */
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

    /* Empty State */
    .empty-state {
      padding: 4rem 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .empty-content {
      text-align: center;
      color: #6b7280;
    }

    .empty-content .material-icons {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-content h3 {
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    /* Error State */
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

    /* Responsive Design (Design Guide Requirements) */
    @media (min-width: 640px) {
      .dashboard-layout {
        padding: 2rem;
      }
      
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }
    }

    @media (min-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
      }
      
      .clubs-grid {
        gap: 2rem;
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

      .header-actions {
        justify-content: space-between;
        flex-wrap: wrap;
      }

      .search-input {
        width: 200px;
      }

      .clubs-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .stats-section, .clubs-section, .pagination-section {
        padding: 1rem;
      }

      .club-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .member-details {
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
      }

      .balance-info {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .pagination-container {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `]
})
export class AdminClubsComponent implements OnInit {
  clubs: AdminClub[] = [];
  loading = false;
  error: string | null = null;
  
  // Filters and pagination
  searchTerm = '';
  sportFilter = '';
  currentPage = 1;
  pageSize = 12;
  
  pagination = {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  };

  // UI state
  expandedClubs = new Set<string>();

  private searchTimeout: any;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadClubs();
  }

  loadClubs(): void {
    this.loading = true;
    this.error = null;

    const params = {
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchTerm,
      sport: this.sportFilter
    };

    this.adminService.getClubs(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.clubs = response.data;
          this.pagination = (response as any).pagination || this.pagination;
        } else {
          this.error = 'Failed to load clubs';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading clubs:', error);
        this.error = 'Failed to load clubs';
        this.loading = false;
      }
    });
  }

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadClubs();
    }, 500);
  }

  refreshClubs(): void {
    this.loadClubs();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.currentPage = page;
      this.loadClubs();
    }
  }

  toggleMembersView(clubId: string): void {
    if (this.expandedClubs.has(clubId)) {
      this.expandedClubs.delete(clubId);
    } else {
      this.expandedClubs.add(clubId);
    }
  }

  getActiveMembers(club: AdminClub): any[] {
    return club.members.filter(member => member.isActive !== false);
  }

  getMemberInitials(member: any): string {
    const firstName = member.user?.firstName || '';
    const lastName = member.user?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getTotalMembers(): number {
    return this.clubs.reduce((total, club) => total + club.memberCount, 0);
  }

  getTotalCoins(): number {
    return this.clubs.reduce((total, club) => total + (club.coinWallet?.balance || 0), 0);
  }

  getAverageMembers(): number {
    if (this.clubs.length === 0) return 0;
    return Math.round(this.getTotalMembers() / this.clubs.length);
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}