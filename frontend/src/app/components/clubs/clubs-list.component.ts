import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { ClubService, Club, ClubSearchParams } from '../../services/club.service';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-clubs-list',
  template: `
    <div class="clubs-page">
      <app-header></app-header>

      <main class="main-content">
        <!-- Hero Section -->
        <section class="hero-section">
          <div class="hero-content">
            <div class="hero-branding">
              <div class="app-logo-large">
                <img src="assets/playsquad-logo.png" alt="PlaySquad Logo">
              </div>
              <h1><span class="highlight">PlaySquad</span></h1>
            </div>
            <p class="achievement-text">Discover sports clubs and connect with fellow players in your area</p>
            <div class="hero-actions">
              <button class="btn-primary" (click)="showCreateClub = true">
                <span class="btn-icon">🏆</span>
                Create Club
              </button>
              <button class="btn-secondary" (click)="router.navigate(['/events'])">
                <span class="btn-icon">📅</span>
                Browse Events
              </button>
            </div>
          </div>
        </section>

        <!-- Statistics Cards -->
        <section class="stats-section">
          <div class="stats-grid">
            <div class="stat-card clubs-stat">
              <div class="stat-icon">🏸</div>
              <div class="stat-value">{{ totalClubs }}</div>
              <div class="stat-label">Total Clubs</div>
            </div>
            <div class="stat-card joined-stat">
              <div class="stat-icon">⭐</div>
              <div class="stat-value">{{ joinedClubs }}</div>
              <div class="stat-label">Joined Clubs</div>
            </div>
            <div class="stat-card sports-stat">
              <div class="stat-icon">🎾</div>
              <div class="stat-value">{{ availableSports }}</div>
              <div class="stat-label">Sports Available</div>
            </div>
            <div class="stat-card matches-stat">
              <div class="stat-icon">🏆</div>
              <div class="stat-value">{{ totalMatches }}</div>
              <div class="stat-label">Total Matches</div>
            </div>
          </div>
        </section>

        <!-- Clubs Content Card -->
        <section class="content-card">
          <div class="card-header">
            <h2>Discover Clubs</h2>
            <span class="club-count">{{ clubs.length }} clubs</span>
            <a href="#" class="view-all" (click)="loadAllClubs($event)">
              View All <span class="arrow">→</span>
            </a>
          </div>

          <div class="filters">
            <div class="search-bar">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="onSearch()"
                placeholder="🔍 Search clubs by name, sport, or location..."
                class="search-input"
              >
            </div>
            <div class="filter-options">
              <select [(ngModel)]="selectedSport" (change)="onFilterChange()" class="filter-select">
                <option value="">🏃 All Sports</option>
                <option value="tennis">🎾 Tennis</option>
                <option value="badminton">🏸 Badminton</option>
                <option value="squash">🟡 Squash</option>
                <option value="table-tennis">🏓 Table Tennis</option>
                <option value="pickleball">🥒 Pickleball</option>
              </select>
            </div>
          </div>

          <div class="clubs-grid" *ngIf="clubs.length > 0; else noClubs">
          <div class="club-card" *ngFor="let club of clubs">
            <div class="club-header">
              <div class="club-logo">
                <img src="assets/playsquad-logo.png" alt="PlaySquad Logo" class="logo-image">
              </div>
              <div class="club-info">
                <h3>{{ club.name }}</h3>
                <p class="club-sport">{{ club.sport | titlecase }}</p>
                <p class="club-location">📍 {{ club.location.name }}</p>
              </div>
              <div class="club-privacy" *ngIf="club.isPrivate">🔒</div>
            </div>

            <div class="club-details">
              <p class="club-description" *ngIf="club.description">{{ club.description }}</p>

              <div class="club-stats">
                <span class="stat">👥 {{ club.memberCount }} members</span>
                <span class="stat">🎾 {{ club.stats.totalEvents }} events</span>
                <span class="stat">🏆 {{ club.stats.totalMatches }} matches</span>
                <span class="stat" *ngIf="isClubAdmin(club)">💰 {{ getClubCoinBalance(club.id) | number }} coins</span>
              </div>

              <div class="skill-range">
                <span>Skill Level: {{ club.settings.minSkillLevel }} - {{ club.settings.maxSkillLevel }}</span>
              </div>
            </div>

            <div class="club-actions">
              <button class="btn-outline" (click)="viewClub(club.id)">View Details</button>
              <button class="btn-primary" (click)="joinClub(club)" *ngIf="!isMemberOfClub(club)">
                {{ club.isPrivate ? 'Request to Join' : 'Join Club' }}
              </button>
              <span class="member-badge" *ngIf="isMemberOfClub(club)">✓ Member</span>
            </div>
            
            <!-- Join Requests Section for Admins -->
            <div class="join-requests" *ngIf="isClubAdmin(club) && hasPendingRequests(club)">
              <h4>Pending Join Requests ({{ getPendingRequestsCount(club) }})</h4>
              <div class="request-item" *ngFor="let request of getPendingRequests(club)">
                <div class="request-user">
                  <div class="user-avatar">
                    <span class="avatar-placeholder">{{ (request.user.firstName || 'U').charAt(0).toUpperCase() }}</span>
                  </div>
                  <div class="user-info">
                    <div class="user-name">{{ request.user.firstName }} {{ request.user.lastName }}</div>
                    <div class="user-skill">Skill Level: {{ request.user.skillLevel }}</div>
                    <div class="request-message" *ngIf="request.message">{{ request.message }}</div>
                    <div class="request-date">Requested: {{ request.requestedAt | date:'short' }}</div>
                  </div>
                </div>
                <div class="request-actions">
                  <button class="btn-success" (click)="processJoinRequest(club.id, request._id, 'approve')">
                    Approve
                  </button>
                  <button class="btn-danger" (click)="processJoinRequest(club.id, request._id, 'reject')">
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

          <ng-template #noClubs>
            <div class="empty-state">
              <div class="empty-icon">🏸</div>
              <h3>No clubs found</h3>
              <p>Try adjusting your search filters or create a new club to get started!</p>
              <button class="btn-primary" (click)="showCreateClub = true">
                <span class="btn-icon">➕</span>
                Create Your First Club
              </button>
            </div>
          </ng-template>

          <div class="pagination" *ngIf="totalPages > 1">
            <button
              (click)="previousPage()"
              [disabled]="currentPage === 1"
              class="btn-outline"
            >
              ← Previous
            </button>
            <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
            <button
              (click)="nextPage()"
              [disabled]="currentPage === totalPages"
              class="btn-outline"
            >
              Next →
            </button>
          </div>
        </section>
      </main>

      <!-- Create Club Modal -->
      <div class="modal" *ngIf="showCreateClub" (click)="closeModal($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Create New Club</h2>
            <button class="close-btn" (click)="showCreateClub = false">×</button>
          </div>

          <form [formGroup]="createClubForm" (ngSubmit)="onCreateClub()">
            <div class="form-group">
              <label for="name">Club Name</label>
              <input type="text" id="name" formControlName="name" class="form-control">
            </div>

            <div class="form-group">
              <label for="sport">Sport</label>
              <select id="sport" formControlName="sport" class="form-control">
                <option value="">Select a sport</option>
                <option value="tennis">Tennis</option>
                <option value="badminton">Badminton</option>
                <option value="squash">Squash</option>
                <option value="table-tennis">Table Tennis</option>
                <option value="pickleball">Pickleball</option>
              </select>
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" formControlName="description" class="form-control" rows="3"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="locationName">Location Name</label>
                <input type="text" id="locationName" formControlName="locationName" class="form-control">
              </div>
              <div class="form-group">
                <label for="locationAddress">Address</label>
                <input type="text" id="locationAddress" formControlName="locationAddress" class="form-control">
              </div>
            </div>

            <div class="form-group">
              <label>
                <input type="checkbox" formControlName="isPrivate">
                Private Club (requires invite code)
              </label>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="showCreateClub = false">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="createClubForm.invalid || creating">
                {{ creating ? 'Creating...' : 'Create Club' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Global styles following DASHBOARD_DESIGN_GUIDE.md */
    .clubs-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #cbd5e1 100%);
    }


    /* Main Content */
    .main-content {
      max-width: 1200px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      margin-top: 2rem;
      margin-bottom: 2rem;
    }

    /* Hero Section */
    .hero-section {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(34, 197, 94, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%);
      border: 1px solid rgba(251, 146, 60, 0.3);
      padding: 2rem;
      border-radius: 16px;
      backdrop-filter: blur(20px);
      margin: 2rem;
      margin-bottom: 1.5rem;
    }

    .hero-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1.5rem;
    }

    .hero-branding {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .app-logo-large {
      width: 120px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .app-logo-large img {
      width: 120px;
      height: 120px;
      object-fit: contain;
    }

    .hero-branding h1 {
      color: #1e293b;
      margin: 0;
      font-size: 3rem;
      font-weight: 700;
    }

    .highlight {
      color: #fb923c;
    }

    .achievement-text {
      color: #475569;
      margin: 0.5rem 0 0 0;
      font-size: 1.1rem;
    }

    .hero-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    /* Statistics Cards */
    .stats-section {
      padding: 0 2rem 1.5rem 2rem;
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
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .clubs-stat { background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%); }
    .joined-stat { background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%); }
    .sports-stat { background: linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%); }
    .matches-stat { background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%); }

    .stat-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #475569;
      font-weight: 500;
    }

    /* Content Card */
    .content-card {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.08) 0%, rgba(255, 255, 255, 0.2) 100%);
      border: 1px solid rgba(251, 146, 60, 0.2);
      backdrop-filter: blur(20px);
      margin: 0 2rem 2rem 2rem;
      border-radius: 16px;
      padding: 1.5rem;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .card-header h2 {
      color: #000000;
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .club-count {
      background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .view-all {
      color: #fb923c;
      text-decoration: none;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .arrow {
      transition: transform 0.2s;
    }

    .view-all:hover .arrow {
      transform: translateX(2px);
    }

    /* Filters */
    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-bar {
      flex: 1;
      min-width: 300px;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid rgba(251, 146, 60, 0.3);
      border-radius: 12px;
      font-size: 1rem;
      box-sizing: border-box;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
    }

    .search-input:focus {
      outline: none;
      border-color: #fb923c;
      box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.1);
    }

    .filter-select {
      padding: 0.75rem 1rem;
      border: 2px solid rgba(251, 146, 60, 0.3);
      border-radius: 12px;
      font-size: 1rem;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
    }

    /* Clubs Grid */
    .clubs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .club-card {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(249, 115, 22, 0.1) 100%);
      border: 1px solid rgba(251, 146, 60, 0.3);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 1.5rem;
      transition: all 0.3s;
    }

    .club-card:hover {
      border-color: rgba(251, 146, 60, 0.8);
      box-shadow: 0 8px 25px rgba(251, 146, 60, 0.2);
      transform: translateY(-2px);
    }

    .club-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
      position: relative;
    }

    .club-logo {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
    }

    .logo-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .club-info h3 {
      margin: 0 0 0.25rem 0;
      color: #1e293b;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .club-sport {
      margin: 0 0 0.25rem 0;
      color: #fb923c;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .club-location {
      margin: 0;
      color: #475569;
      font-size: 0.9rem;
    }

    .club-privacy {
      position: absolute;
      top: 0;
      right: 0;
      color: #475569;
      font-size: 1.2rem;
    }

    .club-details {
      margin-bottom: 1.25rem;
    }

    .club-description {
      color: #475569;
      margin: 0 0 1rem 0;
      line-height: 1.5;
    }

    .club-stats {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .stat {
      background: rgba(251, 146, 60, 0.1);
      border: 1px solid rgba(251, 146, 60, 0.2);
      padding: 0.375rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      color: #1e293b;
      font-weight: 500;
    }

    .skill-range {
      color: #475569;
      font-size: 0.9rem;
      font-weight: 500;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 3rem 1.25rem;
      color: #475569;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      color: #1e293b;
      margin-bottom: 0.75rem;
      font-size: 1.5rem;
    }

    .empty-state p {
      margin-bottom: 1.5rem;
      font-size: 1.1rem;
    }

    /* Buttons */
    .btn-primary, .btn-secondary, .btn-outline {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.3s;
      text-decoration: none;
      font-size: 0.9rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-secondary {
      background: transparent;
      color: #475569;
      border: 2px solid #e2e8f0;
    }

    .btn-secondary:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .btn-outline {
      background: transparent;
      color: #fb923c;
      border: 2px solid #fb923c;
    }

    .btn-outline:hover:not(:disabled) {
      background: #fb923c;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(251, 146, 60, 0.3);
    }

    .btn-icon {
      font-size: 1rem;
    }

    .club-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .member-badge {
      color: #22c55e;
      font-weight: 600;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1.25rem;
      margin-top: 2rem;
    }

    .page-info {
      color: #475569;
      font-weight: 500;
    }

    /* Modal Styles */
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 1.5rem 1rem 1.5rem;
      border-bottom: 1px solid rgba(251, 146, 60, 0.2);
    }

    .modal-header h2 {
      margin: 0;
      color: #1e293b;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #475569;
      padding: 0.25rem;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .modal form {
      padding: 1.5rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
      flex: 1;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #1e293b;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid rgba(251, 146, 60, 0.2);
      border-radius: 8px;
      font-size: 1rem;
      box-sizing: border-box;
      background: rgba(255, 255, 255, 0.8);
    }

    .form-control:focus {
      outline: none;
      border-color: #fb923c;
      box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.1);
    }

    .modal-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }

    /* Join Requests */
    .join-requests {
      margin-top: 1.25rem;
      padding: 1rem;
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%);
      border-radius: 12px;
      border-left: 4px solid #22c55e;
    }

    .join-requests h4 {
      margin: 0 0 1rem 0;
      color: #1e293b;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .request-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: rgba(255, 255, 255, 0.8);
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 0.75rem;
      border: 1px solid rgba(34, 197, 94, 0.2);
    }

    .request-user {
      display: flex;
      gap: 0.75rem;
      flex: 1;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .user-info {
      flex: 1;
    }

    .user-name {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .user-skill {
      font-size: 0.875rem;
      color: #475569;
      margin-bottom: 0.25rem;
    }

    .request-message {
      font-size: 0.9rem;
      color: #475569;
      font-style: italic;
      margin-bottom: 0.25rem;
    }

    .request-date {
      font-size: 0.8rem;
      color: #64748b;
    }

    .request-actions {
      display: flex;
      gap: 0.5rem;
      margin-left: 0.75rem;
    }

    .btn-success {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-success:hover {
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    }

    .btn-danger {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-danger:hover {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .clubs-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .nav-container {
        height: 64px;
        padding: 0 1rem;
      }

      .user-info, .wallet-label, .admin-label {
        display: none;
      }

      .hero-section {
        margin: 1rem;
        padding: 1.5rem;
      }

      .hero-branding {
        flex-direction: column;
        gap: 0.5rem;
      }

      .app-logo-large {
        width: 80px;
        height: 80px;
      }

      .app-logo-large img {
        width: 80px;
        height: 80px;
      }

      .hero-branding h1 {
        font-size: 2rem;
      }

      .hero-actions {
        flex-direction: row;
        width: 100%;
      }

      .stats-section {
        padding: 0 1rem 1rem 1rem;
      }

      .content-card {
        margin: 0 1rem 1rem 1rem;
        padding: 1rem;
      }

      .clubs-grid {
        grid-template-columns: 1fr;
      }

      .filters {
        flex-direction: column;
      }

      .search-bar {
        min-width: auto;
      }

      .club-stats {
        flex-direction: column;
        gap: 0.5rem;
      }

      .club-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .request-item {
        flex-direction: column;
        gap: 0.75rem;
      }

      .request-actions {
        margin-left: 0;
        justify-content: center;
      }
    }

    @media (max-width: 640px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
      }

      .stat-card {
        padding: 1rem;
        min-height: 100px;
      }

      .stat-value {
        font-size: 1.5rem;
      }
    }

    /* Desktop styles */
    @media (min-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
      }
    }
  `]
})
export class ClubsListComponent implements OnInit {
  clubs: Club[] = [];
  searchQuery = '';
  selectedSport = '';
  currentPage = 1;
  totalPages = 1;
  showCreateClub = false;
  creating = false;
  clubCoinBalances: { [clubId: string]: number } = {};
  
  // Statistics
  totalClubs = 0;
  joinedClubs = 0;
  availableSports = 5;
  totalMatches = 0;

  createClubForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    sport: ['', [Validators.required]],
    description: [''],
    locationName: ['', [Validators.required]],
    locationAddress: ['', [Validators.required]],
    isPrivate: [false]
  });

  constructor(
    public router: Router,
    private clubService: ClubService,
    private fb: FormBuilder,
    private authService: AuthService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.loadClubs();
  }

  loadClubs(): void {
    const params: ClubSearchParams = {
      page: this.currentPage,
      limit: 12
    };

    if (this.searchQuery) {
      params.search = this.searchQuery;
    }

    if (this.selectedSport) {
      params.sport = this.selectedSport;
    }

    this.clubService.getClubs(params).subscribe({
      next: (response) => {
        if (response.success && response.data && response.pagination) {
          this.clubs = response.data;
          this.totalPages = response.pagination.pages;
          this.totalClubs = response.pagination.total || this.clubs.length;
          this.updateStatistics();
          this.loadCoinBalancesForAdminClubs();
        }
      },
      error: (error) => {
        console.error('Error loading clubs:', error);
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadClubs();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadClubs();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadClubs();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadClubs();
    }
  }

  viewClub(clubId: string): void {
    this.router.navigate(['/clubs', clubId]);
  }

  async joinClub(club: Club): Promise<void> {
    try {
      let inviteCode: string | undefined;

      if (club.isPrivate) {
        const result = await this.modalService.showPrompt(
          'Private Club',
          'Enter invite code to join this private club:',
          'Invite code'
        );
        if (!result.confirmed || !result.inputValue) return;
        inviteCode = result.inputValue;
      }

      // Ask for optional message
      const messageResult = await this.modalService.showPrompt(
        'Join Club',
        'Optional message for club admins:',
        'Your message here...'
      );
      if (!messageResult.confirmed) return;
      
      const message = messageResult.inputValue || undefined;
      
      this.clubService.joinClub(club.id, inviteCode, message).subscribe({
        next: async (response) => {
          if (response.success) {
            if (response.data && 'status' in response.data && response.data.status === 'pending') {
              await this.modalService.showAlert('Request Submitted', 'Join request submitted! Waiting for club admin approval.');
            } else {
              await this.modalService.showAlert('Success', 'Successfully joined the club!');
            }
            this.loadClubs();
          }
        },
        error: async (error) => {
          await this.modalService.showAlert('Error', error.error?.message || 'Failed to join club');
        }
      });
    } catch (error) {
      console.error('Error in joinClub:', error);
    }
  }

  isMemberOfClub(club: Club): boolean {
    const currentUser = this.authService.currentUser;
    if (!currentUser) return false;
    return currentUser.clubs.some(userClub => userClub.club === club.id);
  }

  isClubAdmin(club: Club): boolean {
    const currentUser = this.authService.currentUser;
    if (!currentUser) return false;
    
    const userClub = currentUser.clubs.find(userClub => userClub.club === club.id);
    return userClub ? (userClub.role === 'admin' || userClub.role === 'organizer') : false;
  }

  loadCoinBalancesForAdminClubs(): void {
    const adminClubs = this.clubs.filter(club => this.isClubAdmin(club));
    
    // Load coin balances with 200ms delay between requests to avoid rate limiting
    adminClubs.forEach((club, index) => {
      setTimeout(() => {
        this.clubService.getClubCoinWallet(club.id).subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.clubCoinBalances[club.id] = response.data.balance;
            }
          },
          error: (error) => {
            if (error.status === 429) {
              // Retry after longer delay for rate limited requests
              setTimeout(() => {
                this.loadSingleClubCoinBalance(club.id);
              }, 2000 + (index * 500));
            } else {
              console.error(`Failed to load coin balance for club ${club.id}:`, error);
            }
          }
        });
      }, index * 200);
    });
  }

  private loadSingleClubCoinBalance(clubId: string): void {
    this.clubService.getClubCoinWallet(clubId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.clubCoinBalances[clubId] = response.data.balance;
        }
      },
      error: (error) => {
        console.error(`Failed to retry coin balance for club ${clubId}:`, error);
      }
    });
  }

  getClubCoinBalance(clubId: string): number {
    return this.clubCoinBalances[clubId] || 0;
  }


  private processingRequests = new Set<string>();

  async processJoinRequest(clubId: string, requestId: string, action: 'approve' | 'reject'): Promise<void> {
    // Prevent duplicate processing
    if (this.processingRequests.has(requestId)) {
      return;
    }

    this.processingRequests.add(requestId);

    try {
      this.clubService.processJoinRequest(clubId, requestId, action).subscribe({
        next: async (response) => {
          if (response.success) {
            await this.modalService.showAlert('Success', `Join request ${action}d successfully!`);
            
            // Immediately remove the processed request from the UI
            const club = this.clubs.find(c => c.id === clubId);
            if (club && club.joinRequests) {
              club.joinRequests = club.joinRequests.filter(req => req._id !== requestId);
            }
            
            // Refresh clubs to update member count and join requests
            this.loadClubs();
          }
          this.processingRequests.delete(requestId);
        },
        error: async (error) => {
          console.error('Process join request error:', error);
          
          // Handle specific case where request has already been processed
          if (error.error?.message === 'Request has already been processed') {
            // Remove the request from UI since it's no longer valid
            const club = this.clubs.find(c => c.id === clubId);
            if (club && club.joinRequests) {
              club.joinRequests = club.joinRequests.filter(req => req._id !== requestId);
            }
            await this.modalService.showAlert('Info', 'This request has already been processed by another admin.');
            // Refresh to get the latest state
            this.loadClubs();
          } else {
            await this.modalService.showAlert('Error', error.error?.message || `Failed to ${action} join request`);
          }
          
          this.processingRequests.delete(requestId);
        }
      });
    } catch (error) {
      console.error('Error in processJoinRequest:', error);
      this.processingRequests.delete(requestId);
    }
  }

  onCreateClub(): void {
    if (this.createClubForm.valid) {
      this.creating = true;

      const formValue = this.createClubForm.value;
      const clubData = {
        name: formValue.name!,
        sport: formValue.sport!,
        description: formValue.description || '',
        location: {
          name: formValue.locationName!,
          address: formValue.locationAddress!
        },
        isPrivate: formValue.isPrivate || false
      };

      this.clubService.createClub(clubData).subscribe({
        next: (response) => {
          this.creating = false;
          if (response.success) {
            this.showCreateClub = false;
            this.createClubForm.reset();
            this.loadClubs();
            this.modalService.showAlert('Success', 'Club created successfully!');
          }
        },
        error: async (error) => {
          this.creating = false;
          await this.modalService.showAlert('Error', error.error?.message || 'Failed to create club');
        }
      });
    } else {
      // Show validation errors
      this.markFormGroupTouched();
      const errors = this.getFormValidationErrors();
      this.modalService.showAlert('Form Errors', 'Please fix the following errors:\n' + errors.join('\n'));
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.createClubForm.controls).forEach(key => {
      const control = this.createClubForm.get(key);
      control?.markAsTouched();
    });
  }

  private getFormValidationErrors(): string[] {
    const errors: string[] = [];
    
    if (this.createClubForm.get('name')?.hasError('required')) {
      errors.push('- Club name is required');
    }
    if (this.createClubForm.get('name')?.hasError('minlength')) {
      errors.push('- Club name must be at least 3 characters');
    }
    if (this.createClubForm.get('sport')?.hasError('required')) {
      errors.push('- Sport selection is required');
    }
    if (this.createClubForm.get('locationName')?.hasError('required')) {
      errors.push('- Location name is required');
    }
    if (this.createClubForm.get('locationAddress')?.hasError('required')) {
      errors.push('- Location address is required');
    }
    
    return errors;
  }

  closeModal(event: Event): void {
    if (event.target === event.currentTarget) {
      this.showCreateClub = false;
    }
  }

  hasPendingRequests(club: Club): boolean {
    return !!(club.joinRequests && club.joinRequests.some(request => request.status === 'pending'));
  }

  getPendingRequests(club: Club): any[] {
    return club.joinRequests ? club.joinRequests.filter(request => request.status === 'pending') : [];
  }

  getPendingRequestsCount(club: Club): number {
    return this.getPendingRequests(club).length;
  }


  loadAllClubs(event: Event): void {
    event.preventDefault();
    this.currentPage = 1;
    this.loadClubs();
  }

  private updateStatistics(): void {
    const currentUser = this.authService.currentUser;
    if (currentUser) {
      this.joinedClubs = currentUser.clubs.length;
    }
    
    // Calculate total matches from all clubs
    this.totalMatches = this.clubs.reduce((total, club) => {
      return total + (club.stats?.totalMatches || 0);
    }, 0);
  }
}