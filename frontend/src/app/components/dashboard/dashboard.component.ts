import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { ClubService, Club } from '../../services/club.service';
import { EventService, Event } from '../../services/event.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="app-container">
      <app-header></app-header>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Hero Section -->
        <section class="hero-section" *ngIf="user">
          <div class="hero-greeting">
            <div class="hero-avatar">
              <div class="avatar-circle">
                <span>{{ user?.firstName?.charAt(0) || 'U' }}</span>
                <div class="status-indicator"></div>
              </div>
            </div>
            <div class="hero-content">
              <h1 class="hero-title">
                <span class="highlight">{{ user.firstName }}</span>'s Dashboard
              </h1>
              <p class="hero-subtitle">
                {{ getAchievementText() }} • Ready to dominate the courts today?
              </p>
              <div class="hero-actions">
                <button class="btn-primary-large" (click)="router.navigate(['/clubs'])">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  Find Clubs
                </button>
                <button class="btn-secondary-medium" (click)="router.navigate(['/events'])">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Browse Events
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Stats Grid -->
        <section class="stats-section" *ngIf="user">
          <div class="stats-grid">
            <div class="stat-card clubs-stat">
              <div class="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div class="stat-content">
                <h3 class="stat-number">{{ user.clubs.length }}</h3>
                <p class="stat-label">Clubs Joined</p>
              </div>
            </div>

            <div class="stat-card games-stat">
              <div class="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
              </div>
              <div class="stat-content">
                <h3 class="stat-number">{{ user.stats.gamesPlayed }}</h3>
                <p class="stat-label">Games Played</p>
              </div>
            </div>

            <div class="stat-card skill-stat">
              <div class="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                </svg>
              </div>
              <div class="stat-content">
                <h3 class="stat-number">{{ user.skillLevel }}<span class="text-secondary">/10</span></h3>
                <p class="stat-label">Skill Level</p>
                <div class="progress-container">
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="animatedSkillWidth"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="stat-card winrate-stat">
              <div class="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m8 3 4 8 5-5v11H3V6l5 5-2-8z"></path>
                </svg>
              </div>
              <div class="stat-content">
                <h3 class="stat-number">{{ ((user.stats.wins / user.stats.gamesPlayed) * 100 || 0).toFixed(0) }}<span class="text-secondary">%</span></h3>
                <p class="stat-label">Win Rate</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Content Grid -->
        <div class="dashboard-grid">
          <!-- My Clubs -->
          <section class="content-card">
            <div class="card-header">
              <h2 class="card-title">
                My Clubs
                <span class="badge primary">{{ userClubs.length }}</span>
              </h2>
              <button class="btn-ghost" (click)="router.navigate(['/clubs'])">
                View All
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </button>
            </div>

            <div class="card-content">
              <div class="item-list" *ngIf="userClubs.length > 0; else noClubs">
                <div class="list-item" *ngFor="let club of userClubs" (click)="viewClub(club.id)">
                  <div class="item-header">
                    <div>
                      <h4 class="item-title">{{ club.name }}</h4>
                      <p class="item-meta">{{ club.sport | titlecase }} • {{ club.memberCount }} members</p>
                    </div>
                    <div class="item-actions">
                      <span class="badge" [class]="'role-' + getUserRole(club)">
                        {{ getUserRole(club) | titlecase }}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9,18 15,12 9,6"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <ng-template #noClubs>
                <div class="empty-state">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <h3>Join Your First Club</h3>
                  <p>Connect with players and start competing!</p>
                  <button class="btn-primary" (click)="router.navigate(['/clubs'])">
                    Browse Clubs
                  </button>
                </div>
              </ng-template>
            </div>
          </section>

          <!-- Upcoming Events -->
          <section class="content-card">
            <div class="card-header">
              <h2 class="card-title">
                Upcoming Events
                <span class="badge primary">{{ upcomingEvents.length }}</span>
              </h2>
              <button class="btn-ghost" (click)="router.navigate(['/events'])">
                View All
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </button>
            </div>

            <div class="card-content">
              <div class="item-list" *ngIf="upcomingEvents.length > 0; else noEvents">
                <div class="list-item" *ngFor="let event of upcomingEvents" (click)="viewEvent(event.id)" 
                     [class.event-cancelled]="event.status === 'cancelled'">
                  <div class="item-header">
                    <div>
                      <h4 class="item-title">{{ event.title }}</h4>
                      <p class="item-meta">{{ event.club.name }} • {{ getEventTime(event.dateTime) }}</p>
                      <p class="item-meta">📍 {{ event.location.name }}</p>
                      <div class="event-status-container">
                        <span class="event-status" 
                              [class.status-cancelled]="event.status === 'cancelled'"
                              [class.status-published]="event.status === 'published'"
                              [class.status-ongoing]="event.status === 'ongoing'"
                              [class.status-completed]="event.status === 'completed'"
                              [class.status-draft]="event.status === 'draft'">
                          {{ getStatusLabel(event.status) }}
                        </span>
                      </div>
                    </div>
                    <div class="item-actions">
                      <div class="event-date-badge">
                        <span class="date-day">{{ getEventDay(event.dateTime) }}</span>
                        <span class="date-month">{{ getEventMonth(event.dateTime) }}</span>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9,18 15,12 9,6"></polyline>
                      </svg>
                    </div>
                  </div>
                  <div class="progress-container">
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width.%]="(event.attendingCount / event.maxParticipants) * 100"></div>
                    </div>
                    <span class="text-body-sm text-secondary">{{ event.attendingCount }}/{{ event.maxParticipants }} participants</span>
                  </div>
                </div>
              </div>

              <ng-template #noEvents>
                <div class="empty-state">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <h3>No Upcoming Events</h3>
                  <p>Check out what's happening in your clubs!</p>
                  <button class="btn-primary" (click)="router.navigate(['/events'])">
                    Browse Events
                  </button>
                </div>
              </ng-template>
            </div>
          </section>
        </div>
      </main>
    </div>
  `,
  styles: [`

    // App Container
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }

    .main-content {
      padding: 24px;
      max-width: 1536px;
      margin: 0 auto;
    }

    // Event Date Badge
    .event-date-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px;
      background: linear-gradient(135deg, #3b82f6, #1e40af);
      color: white;
      border-radius: 8px;
      min-width: 48px;
    }

    .date-day {
      font-weight: 700;
      font-size: 1rem;
      line-height: 1;
    }

    .date-month {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      line-height: 1;
      margin-top: 2px;
    }

    // Role badges
    .role-admin .badge {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
    }

    .role-organizer .badge {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
    }

    .role-member .badge {
      background: linear-gradient(135deg, #3b82f6, #1e40af);
      color: white;
    }

    .event-status-container {
      margin-top: 8px;
    }

    .event-status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-published {
      background-color: #dcfce7;
      color: #166534;
    }

    .status-ongoing {
      background-color: #fef3c7;
      color: #92400e;
    }

    .status-completed {
      background-color: #e0e7ff;
      color: #3730a3;
    }

    .status-draft {
      background-color: #f3f4f6;
      color: #374151;
    }

    .status-cancelled {
      background-color: #fee2e2;
      color: #dc2626;
    }

    .event-cancelled {
      opacity: 0.7;
      position: relative;
    }

    .event-cancelled .item-title {
      text-decoration: line-through;
      color: #6b7280;
    }

    .event-cancelled .event-date-badge {
      opacity: 0.6;
    }

  `]
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  userClubs: Club[] = [];
  upcomingEvents: Event[] = [];
  
  // Animation properties
  animatedSkillWidth: number = 0;
  showSkillAnimation: boolean = false;
  showSkillTooltip: boolean = false;

  constructor(
    public router: Router,
    private authService: AuthService,
    private clubService: ClubService,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.loadUserData();
        this.animateSkillProgress();
      }
    });
  }

  loadUserData(): void {
    this.clubService.getUserClubs().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.userClubs = response.data.slice(0, 3);
        }
      }
    });

    this.eventService.getEvents({ upcoming: true, limit: 5 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.upcomingEvents = response.data;
        }
      }
    });
  }

  getUserRole(club: Club): string {
    if (!this.user) return 'member';
    const membership = this.user.clubs.find(c => c.club === club.id);
    return membership?.role || 'member';
  }

  viewClub(clubId: string): void {
    this.router.navigate(['/clubs', clubId]);
  }

  viewEvent(eventId: string): void {
    this.router.navigate(['/events', eventId]);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  getEventDay(dateString: string): string {
    const date = new Date(dateString);
    return date.getDate().toString();
  }

  getEventMonth(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  }

  getEventTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'draft': return 'Draft';
      case 'published': return 'Open';
      case 'ongoing': return 'Live';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  getWeeklyGames(): number {
    return this.user ? Math.floor(this.user.stats.gamesPlayed / 4) : 0;
  }

  getAchievementText(): string {
    if (!this.user) return 'Getting Started';
    
    const gamesPlayed = this.user.stats.gamesPlayed;
    const skillLevel = this.user.skillLevel;
    const winRate = this.user.stats.gamesPlayed > 0 ? 
      (this.user.stats.wins / this.user.stats.gamesPlayed) * 100 : 0;

    if (winRate > 80) return 'Court Dominator';
    if (skillLevel >= 8) return 'Advanced Player';
    if (gamesPlayed > 50) return 'Veteran Player';
    if (gamesPlayed > 20) return 'Active Player';
    if (gamesPlayed > 5) return 'Rising Star';
    return 'Getting Started';
  }

  getSkillTooltip(): string {
    if (!this.user) return '';
    const nextLevel = this.user.skillLevel + 1;
    if (nextLevel > 10) return 'Maximum skill level reached!';
    
    const gamesNeeded = Math.max(0, (nextLevel * 3) - this.user.stats.gamesPlayed);
    return gamesNeeded > 0 ? 
      `${gamesNeeded} more games to reach level ${nextLevel}` : 
      `Ready to advance to level ${nextLevel}!`;
  }

  getSkillMotivation(): string {
    if (!this.user) return '';
    const nextLevel = this.user.skillLevel + 1;
    if (nextLevel > 10) return '🏆 Master Level!';
    
    const gamesNeeded = Math.max(0, (nextLevel * 3) - this.user.stats.gamesPlayed);
    return gamesNeeded > 0 ? 
      `🎯 ${gamesNeeded} games to level ${nextLevel}` : 
      `🚀 Level ${nextLevel} unlocked!`;
  }

  animateSkillProgress(): void {
    if (!this.user) return;
    
    this.animatedSkillWidth = 0;
    this.showSkillAnimation = true;
    
    setTimeout(() => {
      this.animatedSkillWidth = this.user!.skillLevel * 10;
    }, 100);
    
    setTimeout(() => {
      this.showSkillAnimation = false;
    }, 1500);
  }

}