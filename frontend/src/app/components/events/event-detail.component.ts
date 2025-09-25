import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { EventService, Event } from '../../services/event.service';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-event-detail',
  template: `
    <div class="event-detail-page" *ngIf="event">
      <app-header></app-header>
      
      <!-- Page Navigation -->
      <div class="page-nav">
        <div class="nav-container">
          <button class="btn-ghost" (click)="router.navigate(['/events'])">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
            Back to Events
          </button>
          <button class="btn-ghost" (click)="router.navigate(['/dashboard'])">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9,22 9,12 15,12 15,22"></polyline>
            </svg>
            Dashboard
          </button>
        </div>
      </div>

      <main class="main-content">
        <div class="event-header">
          <div class="event-title">
            <h1>{{ event.title }}</h1>
            <span class="status-badge" [class]="'status-' + event.status">
              {{ event.status | titlecase }}
            </span>
          </div>
          <p class="event-club">{{ event.club.name }}</p>
        </div>

        <div class="event-content">
          <div class="event-info">
            <div class="info-section">
              <h3>📅 Event Details</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Date & Time</span>
                  <span class="value">{{ formatDate(event.dateTime) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Duration</span>
                  <span class="value">{{ event.duration }} minutes</span>
                </div>
                <div class="info-item" *ngIf="event.format">
                  <span class="label">Format</span>
                  <span class="value">{{ event.format | titlecase }}</span>
                </div>
                <div class="info-item" *ngIf="!event.format">
                  <span class="label">Event Type</span>
                  <span class="value">{{ event.eventType | titlecase }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Location</span>
                  <span class="value">{{ event.location.name }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Address</span>
                  <span class="value">{{ event.location.address }}</span>
                </div>
                <div class="info-item" *ngIf="event.skillLevelRange && event.skillLevelRange.min">
                  <span class="label">Skill Level</span>
                  <span class="value">{{ event.skillLevelRange.min }} - {{ event.skillLevelRange.max }}</span>
                </div>
              </div>
            </div>

            <div class="info-section" *ngIf="event.description">
              <h3>📋 Description</h3>
              <p>{{ event.description }}</p>
            </div>

            <div class="info-section">
              <h3>👥 RSVP Status ({{ event.attendingCount }}/{{ event.maxParticipants }})</h3>
              <div class="rsvp-stats">
                <div class="stat">
                  <span class="count">{{ getAttendingCount() }}</span>
                  <span class="label">Attending</span>
                </div>
                <div class="stat">
                  <span class="count">{{ getMaybeCount() }}</span>
                  <span class="label">Maybe</span>
                </div>
                <div class="stat">
                  <span class="count">{{ getDeclinedCount() }}</span>
                  <span class="label">Declined</span>
                </div>
              </div>

              <div class="attendees-list" *ngIf="getAttendingRsvps().length > 0">
                <h4>Attending Players</h4>
                <div class="attendee-cards">
                  <div class="attendee-card" *ngFor="let rsvp of getAttendingRsvps()">
                    <div class="attendee-info">
                      <div class="attendee-avatar" [style.background-image]="rsvp.user.avatar ? 'url(' + rsvp.user.avatar + ')' : 'none'">
                        <span *ngIf="!rsvp.user.avatar" class="avatar-placeholder">{{ (rsvp.user.firstName || 'U').charAt(0).toUpperCase() }}</span>
                      </div>
                      <div>
                        <p class="attendee-name">{{ rsvp.user.firstName }} {{ rsvp.user.lastName }}</p>
                        <p class="attendee-skill" *ngIf="rsvp.skillLevel">Skill Level: {{ rsvp.skillLevel }}</p>
                      </div>
                    </div>
                    <span class="format-badge" *ngIf="rsvp.preferredFormat">{{ rsvp.preferredFormat | titlecase }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Organizer Controls -->
            <div class="organizer-controls" *ngIf="canManageEvent()">
              <h3>🎾 Organizer Controls</h3>
              <div class="control-actions">
                <button
                  class="btn-primary"
                  (click)="generateMatches()"
                  [disabled]="!canGenerateMatches() || generatingMatches"
                  *ngIf="!event.matchesGenerated"
                >
                  {{ generatingMatches ? 'Generating Matches...' : 'Generate Matches' }}
                </button>
                <button
                  class="btn-secondary"
                  (click)="generateMatches()"
                  [disabled]="generatingMatches"
                  *ngIf="event.matchesGenerated"
                >
                  {{ generatingMatches ? 'Regenerating...' : 'Regenerate Matches' }}
                </button>
                <div class="status-dropdown">
                  <button class="btn-outline dropdown-toggle" (click)="toggleStatusDropdown()">
                    Update Status
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
                         [class.rotated]="statusDropdownOpen">
                      <polyline points="6,9 12,15 18,9"></polyline>
                    </svg>
                  </button>
                  <div class="dropdown-menu" *ngIf="statusDropdownOpen">
                    <button class="dropdown-item" 
                            *ngFor="let status of availableStatuses" 
                            [class.current]="status.value === event.status"
                            (click)="updateEventStatus(status.value)">
                      <span class="status-dot" [class]="'dot-' + status.value"></span>
                      {{ status.label }}
                      <span class="current-badge" *ngIf="status.value === event.status">Current</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="match-requirements" *ngIf="!canGenerateMatches() && getAttendingCount() > 0 && event.format">
                <p class="warning">
                  ⚠️ Need at least {{ event.format === 'doubles' ? '4' : '2' }} attending players to generate matches.
                  Currently have {{ getAttendingCount() }} players.
                </p>
              </div>
            </div>
          </div>

          <!-- Matches Section -->
          <div class="matches-section" *ngIf="event.matchesGenerated && event.matches.length > 0">
            <div class="section-header">
              <h2>🏆 Generated Matches</h2>
              <p class="matchmaking-note">
                ✨ <strong>Automated Matchmaking:</strong> Our AI algorithm has created balanced teams based on skill levels and preferences!
              </p>
            </div>

            <div class="matches-grid">
              <div class="match-card" *ngFor="let match of event.matches; let i = index">
                <div class="match-header">
                  <h4>{{ match.court }}</h4>
                  <span class="match-time">{{ formatMatchTime(match.startTime, match.endTime) }}</span>
                  <span class="match-status" [class]="'status-' + match.status">{{ match.status | titlecase }}</span>
                </div>

                <div class="match-teams">
                  <div class="team">
                    <h5>Team 1</h5>
                    <div class="team-players">
                      <div class="player" *ngFor="let player of match.players.team1">
                        <div class="player-avatar" [style.background-image]="player.avatar ? 'url(' + player.avatar + ')' : 'none'">
                          <span *ngIf="!player.avatar" class="avatar-placeholder">{{ (player.firstName || 'P').charAt(0).toUpperCase() }}</span>
                        </div>
                        <div>
                          <p class="player-name">{{ player.firstName }} {{ player.lastName }}</p>
                          <p class="player-skill">Level {{ player.skillLevel }}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="vs-divider">VS</div>

                  <div class="team">
                    <h5>Team 2</h5>
                    <div class="team-players">
                      <div class="player" *ngFor="let player of match.players.team2">
                        <div class="player-avatar" [style.background-image]="player.avatar ? 'url(' + player.avatar + ')' : 'none'">
                          <span *ngIf="!player.avatar" class="avatar-placeholder">{{ (player.firstName || 'P').charAt(0).toUpperCase() }}</span>
                        </div>
                        <div>
                          <p class="player-name">{{ player.firstName }} {{ player.lastName }}</p>
                          <p class="player-skill">Level {{ player.skillLevel }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


              </div>
            </div>

            <div class="matchmaking-info">
              <h4>🤖 How Our Matchmaking Works</h4>
              <ul>
                <li><strong>Skill Balance:</strong> Players are paired to create balanced teams</li>
                <li><strong>Format Preferences:</strong> We consider your preferred playing style</li>
                <li><strong>Fair Distribution:</strong> Strongest players are paired with newer players</li>
                <li><strong>Court Assignment:</strong> Matches are automatically assigned to available courts</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    /* Global Background - Design Guide Standard */
    .event-detail-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #cbd5e1 100%);
    }

    .page-nav {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      padding: 12px 0;
    }

    .nav-container {
      max-width: 1536px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .btn-ghost {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: transparent;
      border: none;
      border-radius: 8px;
      color: #64748b;
      font-weight: 500;
      cursor: pointer;
      transition: all 200ms ease;
    }

    .btn-ghost:hover {
      background: rgba(100, 116, 139, 0.1);
      color: #334155;
    }

    /* Main Content Container - Design Guide Standard */
    .main-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      margin-top: 24px;
      margin-bottom: 24px;
    }

    /* Hero Section - Design Guide Standard */
    .hero-section {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(34, 197, 94, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%);
      border: 1px solid rgba(251, 146, 60, 0.3);
      padding: 2rem;
      border-radius: 16px;
      backdrop-filter: blur(20px);
      margin-bottom: 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 24px;
    }

    .hero-content h1 {
      margin: 0 0 12px 0;
      color: #000000;
      font-size: 2.5rem;
      font-weight: 700;
      font-family: 'Poppins', sans-serif;
    }

    .event-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 8px;
    }

    .club-name {
      color: #fb923c;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .status-badge {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .status-published {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.1));
      color: #16a34a;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .status-ongoing {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(251, 146, 60, 0.1));
      color: #ea580c;
      border: 1px solid rgba(251, 146, 60, 0.3);
    }

    .status-completed {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.1));
      color: #2563eb;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .event-subtitle {
      color: #475569;
      font-size: 1rem;
      margin: 0;
    }

    .hero-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    /* Statistics Grid - Design Guide Standard */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-bottom: 32px;
    }

    @media (min-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
      }
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.4);
      padding: 1.5rem;
      min-height: 120px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 200ms ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(251, 146, 60, 0.15);
      border-color: rgba(251, 146, 60, 0.4);
    }

    .stat-card.attendees .stat-icon {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
    }

    .stat-card.duration .stat-icon {
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      color: white;
    }

    .stat-card.capacity .stat-icon {
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white;
    }

    .stat-card.matches .stat-icon {
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      color: white;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-number {
      font-size: 1.875rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #475569;
      font-weight: 500;
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      gap: 24px;
      grid-template-columns: 1fr;
    }

    @media (min-width: 768px) {
      .content-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .content-grid {
        grid-template-columns: repeat(1, 1fr);
      }
    }

    /* Content Cards - Design Guide Standard */
    .content-card {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.08) 0%, rgba(255, 255, 255, 0.2) 100%);
      border: 1px solid rgba(251, 146, 60, 0.2);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      overflow: hidden;
      transition: all 200ms ease;
    }

    .content-card:hover {
      border-color: rgba(251, 146, 60, 0.4);
      box-shadow: 0 8px 25px rgba(251, 146, 60, 0.15);
      transform: translateY(-2px);
    }

    .card-header {
      padding: 24px 24px 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .card-header h2 {
      margin: 0;
      color: #000000;
      font-size: 1.5rem;
      font-weight: 600;
      font-family: 'Poppins', sans-serif;
    }

    .badge {
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      color: white;
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .card-content {
      padding: 0 24px 24px 24px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item .label {
      font-size: 0.9em;
      color: #666;
      font-weight: 500;
    }

    .info-item .value {
      font-weight: 600;
      color: #1e293b;
    }

    .description-text {
      color: #475569;
      line-height: 1.6;
      margin: 0;
    }

    /* RSVP Statistics */
    .rsvp-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .rsvp-stat {
      text-align: center;
      padding: 16px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.5);
      border: 1px solid rgba(251, 146, 60, 0.1);
    }

    .rsvp-stat.attending {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
      border-color: rgba(34, 197, 94, 0.3);
    }

    .rsvp-stat.maybe {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(251, 146, 60, 0.05));
      border-color: rgba(251, 146, 60, 0.3);
    }

    .rsvp-stat.declined {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
      border-color: rgba(239, 68, 68, 0.3);
    }

    .rsvp-stat .count {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1;
      margin-bottom: 4px;
    }

    .rsvp-stat .label {
      display: block;
      color: #475569;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .attendees-list h4 {
      margin: 0 0 16px 0;
      color: #1e293b;
      font-weight: 600;
    }

    .attendee-cards {
      display: grid;
      gap: 12px;
    }

    /* List Items - Design Guide Standard */
    .list-item {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(249, 115, 22, 0.1) 100%);
      border: 1px solid rgba(251, 146, 60, 0.3);
      border-radius: 12px;
      padding: 16px;
      transition: all 200ms ease;
    }

    .list-item:hover {
      border-color: rgba(251, 146, 60, 0.8);
      box-shadow: 0 8px 25px rgba(251, 146, 60, 0.2);
      transform: translateY(-2px);
    }

    .attendee-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .attendee-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .attendee-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-size: cover;
      background-position: center;
      background-color: #00C853;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 16px;
      flex-shrink: 0;
    }

    .attendee-name {
      margin: 0 0 4px 0;
      font-weight: 600;
      color: #1e293b;
    }

    .attendee-skill {
      margin: 0;
      font-size: 0.875rem;
      color: #475569;
    }

    .format-badge {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .control-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .warning-card {
      color: #ea580c;
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(249, 115, 22, 0.05));
      border: 1px solid rgba(251, 146, 60, 0.3);
      padding: 16px;
      border-radius: 12px;
      margin: 16px 0 0 0;
      font-weight: 500;
    }

    .matches-card {
      grid-column: 1 / -1;
    }

    .matchmaking-note {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
      border: 1px solid rgba(34, 197, 94, 0.3);
      padding: 16px;
      border-radius: 12px;
      margin: 0 0 24px 0;
      color: #16a34a;
      font-weight: 500;
    }

    .matches-grid {
      display: grid;
      gap: 20px;
      margin-bottom: 32px;
    }

    .match-card {
      padding: 20px;
    }

    .match-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .match-header h4 {
      margin: 0;
      color: #1e293b;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .match-time {
      color: #475569;
      font-size: 0.875rem;
    }

    .match-status {
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      color: white;
    }

    .match-teams {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 20px;
      align-items: center;
      margin-bottom: 16px;
    }

    .team h5 {
      margin: 0 0 12px 0;
      color: #1e293b;
      text-align: center;
      font-weight: 600;
    }

    .team-players {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .player {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.3);
      border: 1px solid rgba(251, 146, 60, 0.2);
      border-radius: 8px;
    }

    .player-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-size: cover;
      background-position: center;
      background-color: #00C853;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }

    .avatar-placeholder {
      display: block;
    }

    .player-name {
      margin: 0;
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
    }

    .player-skill {
      margin: 0;
      color: #475569;
      font-size: 0.75rem;
    }

    .vs-divider {
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      color: white;
      padding: 12px 20px;
      border-radius: 50px;
      font-weight: 700;
      text-align: center;
      font-size: 0.875rem;
      box-shadow: 0 4px 12px rgba(251, 146, 60, 0.3);
    }


    .winner-badge {
      background: linear-gradient(135deg, #00C853, #4CAF50);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      display: inline-block;
    }

    .match-actions {
      text-align: center;
    }

    .matchmaking-info {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.08), rgba(255, 255, 255, 0.1));
      border: 1px solid rgba(251, 146, 60, 0.2);
      padding: 20px;
      border-radius: 12px;
      margin-top: 24px;
    }

    .matchmaking-info h4 {
      margin: 0 0 12px 0;
      color: #1e293b;
      font-weight: 600;
    }

    .matchmaking-info ul {
      margin: 0;
      padding-left: 20px;
    }

    .matchmaking-info li {
      margin-bottom: 8px;
      color: #475569;
    }

    /* Button Styles - Design Guide Standard */
    .btn-primary, .btn-secondary, .btn-outline {
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 200ms ease;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.8);
      color: #475569;
      border: 1px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.9);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    }

    .btn-outline {
      background: transparent;
      color: #fb923c;
      border: 2px solid #fb923c;
    }

    .btn-outline:hover:not(:disabled) {
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(251, 146, 60, 0.3);
    }

    /* Status Dropdown Styles - Design Guide Standard */
    .status-dropdown {
      position: relative;
      display: inline-block;
    }

    .dropdown-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dropdown-toggle svg {
      transition: transform 200ms ease;
    }

    .dropdown-toggle svg.rotated {
      transform: rotate(180deg);
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(251, 146, 60, 0.3);
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      overflow: hidden;
      margin-top: 8px;
      min-width: 180px;
    }

    .dropdown-item {
      width: 100%;
      padding: 12px 16px;
      background: transparent;
      border: none;
      text-align: left;
      cursor: pointer;
      transition: all 200ms ease;
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 500;
      color: #1e293b;
      position: relative;
    }

    .dropdown-item:hover {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(251, 146, 60, 0.05));
      color: #ea580c;
    }

    .dropdown-item.current {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(251, 146, 60, 0.08));
      color: #ea580c;
      font-weight: 600;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-dot.dot-published {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);
    }

    .status-dot.dot-ongoing {
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      box-shadow: 0 2px 4px rgba(251, 146, 60, 0.3);
    }

    .status-dot.dot-completed {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
    }

    .status-dot.dot-cancelled {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
    }

    .current-badge {
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      color: white;
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-left: auto;
    }

    /* Responsive Design - Design Guide Standard */
    @media (max-width: 768px) {
      .main-content {
        margin: 12px;
        padding: 24px 16px;
      }

      .hero-section {
        flex-direction: column;
        align-items: flex-start;
        padding: 1.5rem;
      }

      .hero-content h1 {
        font-size: 2rem;
      }

      .hero-actions {
        width: 100%;
        justify-content: center;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .stat-card {
        min-height: 100px;
        padding: 1rem;
      }

      .stat-number {
        font-size: 1.5rem;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .rsvp-stats {
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }

      .rsvp-stat {
        padding: 12px 8px;
      }

      .rsvp-stat .count {
        font-size: 1.5rem;
      }

      .match-teams {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .vs-divider {
        order: -1;
        align-self: center;
        margin: 0 auto;
      }

      .control-actions {
        flex-direction: column;
      }

      .card-header {
        padding: 16px 16px 0 16px;
      }

      .card-content {
        padding: 0 16px 16px 16px;
      }
    }

    @media (max-width: 480px) {
      .main-content {
        margin: 8px;
        padding: 16px 12px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .rsvp-stats {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .hero-actions {
        flex-direction: column;
        width: 100%;
      }

      .hero-actions .btn-primary,
      .hero-actions .btn-secondary {
        width: 100%;
      }
    }
  `]
})
export class EventDetailComponent implements OnInit {
  event: Event | null = null;
  eventId: string = '';
  generatingMatches = false;
  statusDropdownOpen = false;
  
  availableStatuses = [
    { value: 'published', label: 'Published' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private eventService: EventService,
    private authService: AuthService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.eventId = this.route.snapshot.params['id'];
    this.loadEvent();

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const dropdown = target.closest('.status-dropdown');
      if (!dropdown && this.statusDropdownOpen) {
        this.statusDropdownOpen = false;
      }
    });
  }

  loadEvent(): void {
    this.eventService.getEvent(this.eventId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.event = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.router.navigate(['/events']);
      }
    });
  }

  canManageEvent(): boolean {
    if (!this.event || !this.authService.currentUser) return false;

    const currentUser = this.authService.currentUser;

    // Check if user is event organizer
    if (this.event.organizer.id === currentUser.id) return true;

    // Check if user is club organizer/admin
    const clubMembership = currentUser.clubs.find(club => club.club === this.event?.club.id);
    return clubMembership ? ['organizer', 'admin'].includes(clubMembership.role) : false;
  }

  canGenerateMatches(): boolean {
    if (!this.event) return false;
    
    // Only sports events can generate matches
    if (this.event.eventType === 'social') return false;
    if (!this.event.format) return false;

    const attendingCount = this.getAttendingCount();
    const minPlayers = this.event.format === 'doubles' ? 4 : 2;

    return attendingCount >= minPlayers;
  }


  getAttendingRsvps(): any[] {
    return this.event?.rsvps.filter(rsvp => rsvp.status === 'attending') || [];
  }

  getAttendingCount(): number {
    return this.getAttendingRsvps().length;
  }

  getMaybeCount(): number {
    return this.event?.rsvps.filter(rsvp => rsvp.status === 'maybe').length || 0;
  }

  getDeclinedCount(): number {
    return this.event?.rsvps.filter(rsvp => rsvp.status === 'declined').length || 0;
  }

  generateMatches(): void {
    if (!this.event || !this.canGenerateMatches()) return;

    this.generatingMatches = true;

    this.eventService.generateMatches(this.event.id).subscribe({
      next: async (response) => {
        this.generatingMatches = false;
        if (response.success && response.data) {
          this.event = response.data;
          await this.modalService.showAlert('Success', '✅ Matches generated successfully! Check out the balanced teams below.');
        }
      },
      error: async (error) => {
        this.generatingMatches = false;
        await this.modalService.showAlert('Error', error.error?.message || 'Failed to generate matches');
      }
    });
  }

  toggleStatusDropdown(): void {
    this.statusDropdownOpen = !this.statusDropdownOpen;
  }

  async updateEventStatus(newStatus: string): Promise<void> {
    if (!this.event || newStatus === this.event.status) {
      this.statusDropdownOpen = false;
      return;
    }

    this.statusDropdownOpen = false;

    this.eventService.updateEventStatus(this.event.id, newStatus).subscribe({
      next: async (response) => {
        if (response.success && response.data) {
          this.event = response.data;
          await this.modalService.showAlert('Success', `Event status updated to ${newStatus}!`);
        }
      },
      error: async (error) => {
        await this.modalService.showAlert('Error', error.error?.message || 'Failed to update event status');
      }
    });
  }


  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  formatMatchTime(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    const end = new Date(endTime);

    return `${start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })} - ${end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })}`;
  }
}