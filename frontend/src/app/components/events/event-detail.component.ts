import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventService, Event, CreateEventData } from '../../services/event.service';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-event-detail',
  template: `
    <div class="event-detail-page" *ngIf="event">
      <app-header></app-header>

      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <div class="breadcrumb">
            <button class="breadcrumb-link" (click)="router.navigate(['/dashboard'])">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
              Home
            </button>
            <span class="separator">/</span>
            <button class="breadcrumb-link" (click)="router.navigate(['/events'])">Events</button>
            <span class="separator">/</span>
            <span class="current">{{ event.title }}</span>
          </div>

          <div class="hero-info">
            <div class="event-badge-group">
              <span class="status-badge modern" [class]="'status-' + event.status">
                <span class="badge-dot"></span>
                {{ event.status | titlecase }}
              </span>
              <span class="format-badge" *ngIf="event.format">
                🎾 {{ event.format | titlecase }}
              </span>
            </div>

            <h1 class="event-title">{{ event.title }}</h1>
            <p class="event-subtitle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              {{ event.club.name }}
            </p>
          </div>
        </div>
      </div>

      <main class="main-container">
        <!-- Quick Stats Bar -->
        <div class="quick-stats">
          <div class="stat-item">
            <div class="stat-icon calendar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-label">Date & Time</span>
              <span class="stat-value">{{ formatDate(event.dateTime) }}</span>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon location">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-label">Location</span>
              <span class="stat-value">{{ event.location.name }}</span>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon users">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-label">Participants</span>
              <span class="stat-value">{{ event.attendingCount }}/{{ event.maxParticipants }}</span>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon clock">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-label">Duration</span>
              <span class="stat-value">{{ event.duration }} min</span>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="content-grid">
          <!-- Left Column -->
          <div class="left-column">
            <!-- Event Details Card -->
            <div class="card modern-card">
              <div class="card-header">
                <h2>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Event Details
                </h2>
              </div>
              <div class="card-body">
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-icon">📍</span>
                    <div>
                      <p class="detail-label">Venue Address</p>
                      <p class="detail-value">{{ event.location.address }}</p>
                    </div>
                  </div>

                  <div class="detail-item" *ngIf="event.skillLevelRange && event.skillLevelRange.min">
                    <span class="detail-icon">⭐</span>
                    <div>
                      <p class="detail-label">Skill Level Range</p>
                      <p class="detail-value">{{ event.skillLevelRange.min }} - {{ event.skillLevelRange.max }}</p>
                    </div>
                  </div>

                  <div class="detail-item" *ngIf="!event.format">
                    <span class="detail-icon">🎯</span>
                    <div>
                      <p class="detail-label">Event Type</p>
                      <p class="detail-value">{{ event.eventType | titlecase }}</p>
                    </div>
                  </div>
                </div>

                <div class="description-section" *ngIf="event.description">
                  <h3>About This Event</h3>
                  <p class="description-text">{{ event.description }}</p>
                </div>
              </div>
            </div>

            <!-- RSVP Status Card -->
            <div class="card modern-card">
              <div class="card-header">
                <h2>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  RSVP Overview
                </h2>
              </div>
              <div class="card-body">
                <div class="rsvp-summary">
                  <div class="rsvp-card attending">
                    <div class="rsvp-icon">✓</div>
                    <div class="rsvp-count">{{ getAttendingCount() }}</div>
                    <div class="rsvp-label">Attending</div>
                  </div>
                  <div class="rsvp-card maybe">
                    <div class="rsvp-icon">?</div>
                    <div class="rsvp-count">{{ getMaybeCount() }}</div>
                    <div class="rsvp-label">Maybe</div>
                  </div>
                  <div class="rsvp-card declined">
                    <div class="rsvp-icon">✗</div>
                    <div class="rsvp-count">{{ getDeclinedCount() }}</div>
                    <div class="rsvp-label">Declined</div>
                  </div>
                </div>

                <div class="attendees-section" *ngIf="getAttendingRsvps().length > 0">
                  <h3>Attending Players ({{ getAttendingCount() }})</h3>
                  <div class="attendees-grid">
                    <div class="attendee-item" *ngFor="let rsvp of getAttendingRsvps()">
                      <div class="attendee-avatar" [style.background-image]="rsvp.user.avatar ? 'url(' + rsvp.user.avatar + ')' : 'none'">
                        <span *ngIf="!rsvp.user.avatar" class="avatar-text">{{ (rsvp.user.firstName || 'U').charAt(0).toUpperCase() }}</span>
                      </div>
                      <div class="attendee-details">
                        <p class="attendee-name">{{ rsvp.user.firstName }} {{ rsvp.user.lastName }}</p>
                        <p class="attendee-meta">
                          <span *ngIf="rsvp.skillLevel">Level {{ rsvp.skillLevel }}</span>
                          <span *ngIf="rsvp.preferredFormat" class="format-tag">{{ rsvp.preferredFormat }}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Organizer Controls -->
            <div class="card modern-card control-card" *ngIf="canManageEvent()">
              <div class="card-header">
                <h2>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                  </svg>
                  Organizer Controls
                </h2>
              </div>
              <div class="card-body">
                <div class="control-grid">
                  <button
                    class="control-btn primary"
                    (click)="generateMatches()"
                    [disabled]="!canGenerateMatches() || generatingMatches"
                    *ngIf="!event.matchesGenerated"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                      <line x1="9" y1="9" x2="9.01" y2="9"></line>
                      <line x1="15" y1="9" x2="15.01" y2="9"></line>
                    </svg>
                    {{ generatingMatches ? 'Generating...' : 'Generate Matches' }}
                  </button>

                  <button
                    class="control-btn secondary"
                    (click)="generateMatches()"
                    [disabled]="generatingMatches"
                    *ngIf="event.matchesGenerated"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="23 4 23 10 17 10"></polyline>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    {{ generatingMatches ? 'Regenerating...' : 'Regenerate Matches' }}
                  </button>

                  <div class="status-selector">
                    <button class="control-btn status" (click)="toggleStatusDropdown()">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                      </svg>
                      Update Status
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" [class.rotated]="statusDropdownOpen" class="chevron">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                    <div class="status-menu" *ngIf="statusDropdownOpen">
                      <button
                        class="status-option"
                        *ngFor="let status of availableStatuses"
                        [class.active]="status.value === event.status"
                        (click)="updateEventStatus(status.value)"
                      >
                        <span class="status-indicator" [class]="'indicator-' + status.value"></span>
                        <span>{{ status.label }}</span>
                        <svg *ngIf="status.value === event.status" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <button
                    class="control-btn edit"
                    (click)="openEditModal()"
                    [disabled]="event.hasStarted"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit Event
                  </button>

                  <button
                    class="control-btn danger"
                    (click)="deleteEvent()"
                    [disabled]="event.hasStarted || deletingEvent"
                  >
                    <svg *ngIf="!deletingEvent" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    <span class="spinner" *ngIf="deletingEvent"></span>
                    {{ deletingEvent ? 'Deleting...' : 'Delete Event' }}
                  </button>
                </div>

                <div class="warning-message" *ngIf="!canGenerateMatches() && getAttendingCount() > 0 && event.format">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  Need at least {{ event.format === 'doubles' ? '4' : '2' }} attending players to generate matches. Currently have {{ getAttendingCount() }}.
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column - Matches -->
          <div class="right-column" *ngIf="event.matchesGenerated && event.matches.length > 0">
            <div class="card modern-card matches-card">
              <div class="card-header">
                <h2>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                    <path d="M4 22h16"></path>
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                  </svg>
                  Generated Matches
                </h2>
                <span class="matches-count">{{ event.matches.length }} matches</span>
              </div>
              <div class="card-body">
                <div class="matches-info-banner">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                  <p><strong>Automated Matchmaking:</strong> Teams are balanced based on skill levels and preferences</p>
                </div>

                <div class="matches-list">
                  <div class="match-item" *ngFor="let match of event.matches; let i = index">
                    <div class="match-info-bar">
                      <span class="court-name">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        {{ match.court }}
                      </span>
                      <span class="match-time-badge">{{ formatMatchTime(match.startTime, match.endTime) }}</span>
                      <span class="match-status-badge" [class]="'match-status-' + match.status">{{ match.status | titlecase }}</span>
                    </div>

                    <div class="teams-container">
                      <div class="team team-1">
                        <div class="team-header">Team 1</div>
                        <div class="team-members">
                          <div class="team-player" *ngFor="let player of match.players.team1">
                            <div class="player-avatar-sm" [style.background-image]="player.avatar ? 'url(' + player.avatar + ')' : 'none'">
                              <span *ngIf="!player.avatar">{{ (player.firstName || 'P').charAt(0) }}</span>
                            </div>
                            <div class="player-info">
                              <p class="player-name-sm">{{ player.firstName }} {{ player.lastName }}</p>
                              <p class="player-level">Lvl {{ player.skillLevel }}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="vs-badge">VS</div>

                      <div class="team team-2">
                        <div class="team-header">Team 2</div>
                        <div class="team-members">
                          <div class="team-player" *ngFor="let player of match.players.team2">
                            <div class="player-avatar-sm" [style.background-image]="player.avatar ? 'url(' + player.avatar + ')' : 'none'">
                              <span *ngIf="!player.avatar">{{ (player.firstName || 'P').charAt(0) }}</span>
                            </div>
                            <div class="player-info">
                              <p class="player-name-sm">{{ player.firstName }} {{ player.lastName }}</p>
                              <p class="player-level">Lvl {{ player.skillLevel }}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Edit Event Modal -->
      <div class="modal-overlay" *ngIf="showEditModal" (click)="closeEditModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit Event
            </h2>
            <button class="modal-close" (click)="closeEditModal()">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-warning" *ngIf="event.matchesGenerated">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <p>This event has generated matches. Editing may invalidate match assignments. You can regenerate matches after saving.</p>
          </div>

          <form [formGroup]="editForm" (ngSubmit)="submitEdit()">
            <div class="form-grid">
              <div class="form-field full-width">
                <label for="title">Event Title</label>
                <input type="text" id="title" formControlName="title" class="input-field">
              </div>

              <div class="form-field">
                <label for="eventDate">Event Date</label>
                <input type="date" id="eventDate" formControlName="eventDate" class="input-field">
              </div>

              <div class="form-field">
                <label for="eventTime">Event Time</label>
                <select id="eventTime" formControlName="eventTime" class="input-field">
                  <option *ngFor="let time of timeOptions" [value]="time">{{ time }}</option>
                </select>
              </div>

              <div class="form-field">
                <label for="duration">Duration (minutes)</label>
                <input type="number" id="duration" formControlName="duration" class="input-field" min="30" max="480">
              </div>

              <div class="form-field" *ngIf="event.format">
                <label for="format">Format</label>
                <select id="format" formControlName="format" class="input-field">
                  <option value="singles">Singles</option>
                  <option value="doubles">Doubles</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div class="form-field" [class.full-width]="!event.format">
                <label for="maxParticipants">Max Participants</label>
                <input type="number" id="maxParticipants" formControlName="maxParticipants" class="input-field" min="2" max="100">
              </div>

              <div class="form-field full-width">
                <label for="description">Description</label>
                <textarea id="description" formControlName="description" class="input-field textarea" rows="3"></textarea>
              </div>

              <div class="form-field">
                <label for="locationName">Location Name</label>
                <input type="text" id="locationName" formControlName="locationName" class="input-field">
              </div>

              <div class="form-field">
                <label for="locationAddress">Address</label>
                <input type="text" id="locationAddress" formControlName="locationAddress" class="input-field">
              </div>

              <div class="form-field full-width">
                <label for="rsvpDeadline">RSVP Deadline</label>
                <input type="date" id="rsvpDeadline" formControlName="rsvpDeadline" class="input-field">
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="closeEditModal()">Cancel</button>
              <button type="submit" class="btn-submit" [disabled]="editForm.invalid || updatingEvent">
                <svg *ngIf="!updatingEvent" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span class="spinner-sm" *ngIf="updatingEvent"></span>
                {{ updatingEvent ? 'Updating...' : 'Update Event' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Modern Design System */
    :host {
      --primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      --success: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      --warning: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      --danger: linear-gradient(135deg, #f857a6 0%, #ff5858 100%);
      --surface: #ffffff;
      --surface-hover: #f8f9fa;
      --border: #e9ecef;
      --text-primary: #212529;
      --text-secondary: #6c757d;
      --text-muted: #adb5bd;
      --shadow-sm: 0 2px 4px rgba(0,0,0,0.04);
      --shadow: 0 4px 6px rgba(0,0,0,0.07);
      --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
      --shadow-xl: 0 20px 25px rgba(0,0,0,0.15);
      --radius: 16px;
      --radius-sm: 12px;
      --radius-lg: 20px;
    }

    .event-detail-page {
      min-height: 100vh;
      background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
    }

    /* Hero Section */
    .hero-section {
      position: relative;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 6rem 2rem 4rem;
      overflow: hidden;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%);
    }

    .hero-content {
      position: relative;
      max-width: 1200px;
      margin: 0 auto;
      z-index: 1;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
      font-size: 0.875rem;
    }

    .breadcrumb-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .breadcrumb-link:hover {
      background: rgba(255,255,255,0.25);
      transform: translateY(-1px);
    }

    .separator {
      color: rgba(255,255,255,0.5);
    }

    .current {
      color: white;
      font-weight: 500;
    }

    .hero-info {
      color: white;
    }

    .event-badge-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .status-badge.modern {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
      backdrop-filter: blur(10px);
    }

    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .status-published {
      background: rgba(34, 197, 94, 0.2);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #fff;
    }

    .status-published .badge-dot {
      background: #22c55e;
    }

    .status-ongoing {
      background: rgba(251, 146, 60, 0.2);
      border: 1px solid rgba(251, 146, 60, 0.3);
      color: #fff;
    }

    .status-ongoing .badge-dot {
      background: #fb923c;
    }

    .status-completed {
      background: rgba(59, 130, 246, 0.2);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #fff;
    }

    .status-completed .badge-dot {
      background: #3b82f6;
    }

    .status-cancelled {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fff;
    }

    .status-cancelled .badge-dot {
      background: #ef4444;
    }

    .format-badge {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .event-title {
      font-size: 3rem;
      font-weight: 700;
      margin: 0 0 1rem;
      line-height: 1.2;
    }

    .event-subtitle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.25rem;
      margin: 0;
      opacity: 0.9;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Main Container */
    .main-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem 4rem;
      transform: translateY(-3rem);
    }

    /* Quick Stats */
    .quick-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-item {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      transition: all 0.3s;
      box-shadow: var(--shadow-sm);
    }

    .stat-item:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow);
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

    .stat-icon.calendar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .stat-icon.location {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .stat-icon.users {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }

    .stat-icon.clock {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      color: white;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .stat-value {
      font-size: 1.125rem;
      color: var(--text-primary);
      font-weight: 600;
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    @media (min-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    /* Modern Cards */
    .modern-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      transition: all 0.3s;
      margin-bottom: 1.5rem;
    }

    .modern-card:hover {
      box-shadow: var(--shadow);
    }

    .card-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border);
      background: linear-gradient(180deg, var(--surface) 0%, var(--surface-hover) 100%);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-header h2 {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .card-header h2 svg {
      color: #667eea;
    }

    .matches-count {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0.375rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .card-body {
      padding: 1.5rem;
    }

    /* Detail Grid */
    .detail-grid {
      display: grid;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .detail-item {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .detail-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .detail-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0 0 0.25rem;
    }

    .detail-value {
      font-size: 1rem;
      color: var(--text-primary);
      font-weight: 500;
      margin: 0;
    }

    .description-section {
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
    }

    .description-section h3 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.75rem;
    }

    .description-text {
      font-size: 0.9375rem;
      color: var(--text-secondary);
      line-height: 1.6;
      margin: 0;
    }

    /* RSVP Summary */
    .rsvp-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .rsvp-card {
      background: var(--surface-hover);
      border-radius: var(--radius-sm);
      padding: 1.5rem;
      text-align: center;
      transition: all 0.2s;
      border: 2px solid transparent;
    }

    .rsvp-card:hover {
      transform: translateY(-2px);
    }

    .rsvp-card.attending {
      border-color: #22c55e;
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.02) 100%);
    }

    .rsvp-card.maybe {
      border-color: #f59e0b;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%);
    }

    .rsvp-card.declined {
      border-color: #ef4444;
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%);
    }

    .rsvp-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .rsvp-count {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .rsvp-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    /* Attendees */
    .attendees-section h3 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 1rem;
      color: var(--text-primary);
    }

    .attendees-grid {
      display: grid;
      gap: 0.75rem;
    }

    .attendee-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: var(--surface-hover);
      border-radius: var(--radius-sm);
      transition: all 0.2s;
    }

    .attendee-item:hover {
      background: #e9ecef;
    }

    .attendee-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      flex-shrink: 0;
    }

    .avatar-text {
      font-size: 1.125rem;
    }

    .attendee-details {
      flex: 1;
    }

    .attendee-name {
      margin: 0 0 0.25rem;
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.9375rem;
    }

    .attendee-meta {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .format-tag {
      background: #667eea;
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    /* Control Card */
    .control-card {
      position: sticky;
      top: 1rem;
    }

    .control-grid {
      display: grid;
      gap: 0.75rem;
    }

    .control-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.25rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.9375rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .control-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .control-btn.primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .control-btn.primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    .control-btn.secondary {
      background: var(--surface-hover);
      color: var(--text-primary);
      border: 1px solid var(--border);
    }

    .control-btn.secondary:hover:not(:disabled) {
      background: #e9ecef;
    }

    .status-selector {
      position: relative;
    }

    .control-btn.status {
      background: var(--surface-hover);
      color: var(--text-primary);
      border: 1px solid var(--border);
      justify-content: space-between;
    }

    .chevron {
      transition: transform 0.2s;
    }

    .chevron.rotated {
      transform: rotate(180deg);
    }

    .status-menu {
      position: absolute;
      top: calc(100% + 0.5rem);
      left: 0;
      right: 0;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      z-index: 10;
    }

    .status-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.875rem 1.25rem;
      background: none;
      border: none;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9375rem;
    }

    .status-option:hover {
      background: var(--surface-hover);
    }

    .status-option.active {
      background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, transparent 100%);
      font-weight: 600;
    }

    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .indicator-published { background: #22c55e; }
    .indicator-ongoing { background: #fb923c; }
    .indicator-completed { background: #3b82f6; }
    .indicator-cancelled { background: #ef4444; }

    .control-btn.edit {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
    }

    .control-btn.edit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
    }

    .control-btn.danger {
      background: transparent;
      color: #ef4444;
      border: 2px solid rgba(239, 68, 68, 0.2);
      position: relative;
      overflow: hidden;
      z-index: 1;
    }

    .control-btn.danger::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #f857a6 0%, #ff5858 100%);
      z-index: -1;
      opacity: 0;
      transition: opacity 0.3s;
    }

    .control-btn.danger:hover:not(:disabled) {
      color: white;
      border-color: #ef4444;
      transform: translateY(-2px);
    }

    .control-btn.danger:hover:not(:disabled)::before {
      opacity: 1;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .warning-message {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(251, 146, 60, 0.05) 100%);
      border: 1px solid rgba(251, 146, 60, 0.2);
      border-radius: var(--radius-sm);
      color: #ea580c;
      font-size: 0.875rem;
      margin-top: 1rem;
    }

    /* Matches */
    .matches-info-banner {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(102, 126, 234, 0.05) 100%);
      border: 1px solid rgba(102, 126, 234, 0.2);
      border-radius: var(--radius-sm);
      margin-bottom: 1.5rem;
      color: #667eea;
      font-size: 0.875rem;
    }

    .matches-list {
      display: grid;
      gap: 1.5rem;
    }

    .match-item {
      background: var(--surface-hover);
      border-radius: var(--radius);
      overflow: hidden;
      border: 1px solid var(--border);
    }

    .match-info-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
    }

    .court-name {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .match-time-badge {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .match-status-badge {
      margin-left: auto;
      padding: 0.375rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .match-status-scheduled {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
    }

    .teams-container {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 1.5rem;
      padding: 1.5rem;
      align-items: center;
    }

    .team {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .team-header {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .team-members {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .team-player {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--surface);
      border-radius: 10px;
    }

    .player-avatar-sm {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .player-info {
      flex: 1;
    }

    .player-name-sm {
      margin: 0 0 0.125rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .player-level {
      margin: 0;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .vs-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 700;
      font-size: 0.875rem;
      padding: 0.75rem 1.25rem;
      border-radius: 20px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 2rem;
    }

    .modal-container {
      background: var(--surface);
      border-radius: var(--radius-lg);
      max-width: 640px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-xl);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 2rem;
      border-bottom: 1px solid var(--border);
    }

    .modal-header h2 {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .modal-header h2 svg {
      color: #667eea;
    }

    .modal-close {
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .modal-close:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    .modal-warning {
      display: flex;
      gap: 0.75rem;
      margin: 1.5rem 2rem 0;
      padding: 1rem;
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(251, 146, 60, 0.05) 100%);
      border: 1px solid rgba(251, 146, 60, 0.2);
      border-radius: var(--radius-sm);
      color: #ea580c;
      font-size: 0.875rem;
    }

    form {
      padding: 2rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
    }

    .form-field label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .input-field {
      padding: 0.875rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.9375rem;
      transition: all 0.2s;
      background: var(--surface);
    }

    .input-field:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .input-field.textarea {
      resize: vertical;
      min-height: 80px;
      font-family: inherit;
    }

    select.input-field {
      cursor: pointer;
      appearance: none;
      background-image: url('data:image/svg+xml;charset=UTF-8,<svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L6 6L11 1" stroke="%236c757d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
      background-repeat: no-repeat;
      background-position: right 0.875rem center;
      padding-right: 2.5rem;
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
      margin-top: 1.5rem;
    }

    .btn-cancel {
      padding: 0.875rem 1.5rem;
      background: var(--surface-hover);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel:hover {
      background: #e9ecef;
    }

    .btn-submit {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .hero-section {
        padding: 4rem 1rem 3rem;
      }

      .event-title {
        font-size: 2rem;
      }

      .main-container {
        padding: 0 1rem 3rem;
      }

      .quick-stats {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .content-grid {
        grid-template-columns: 1fr;
      }

      .teams-container {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .vs-badge {
        text-align: center;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .rsvp-summary {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EventDetailComponent implements OnInit {
  event: Event | null = null;
  eventId: string = '';
  generatingMatches = false;
  statusDropdownOpen = false;
  showEditModal = false;
  updatingEvent = false;
  deletingEvent = false;
  editForm: FormGroup;

  timeOptions = [
    '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'
  ];

  availableStatuses = [
    { value: 'published', label: 'Published' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private eventService: EventService,
    private authService: AuthService,
    private modalService: ModalService
  ) {
    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      eventDate: ['', [Validators.required]],
      eventTime: ['6:00 PM', [Validators.required]],
      duration: [120, [Validators.required, Validators.min(30)]],
      format: [''],
      maxParticipants: [8, [Validators.required, Validators.min(2)]],
      description: [''],
      locationName: ['', [Validators.required]],
      locationAddress: ['', [Validators.required]],
      rsvpDeadline: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.params['id'];
    this.loadEvent();

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const dropdown = target.closest('.status-selector');
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

  openEditModal(): void {
    if (!this.event) return;

    this.showEditModal = true;
    const eventDate = new Date(this.event.dateTime);
    const dateStr = eventDate.toISOString().slice(0, 10);
    const timeStr = this.formatTimeToDropdown(eventDate);

    this.editForm.patchValue({
      title: this.event.title,
      eventDate: dateStr,
      eventTime: timeStr,
      duration: this.event.duration,
      format: this.event.format || '',
      maxParticipants: this.event.maxParticipants,
      description: this.event.description || '',
      locationName: this.event.location.name,
      locationAddress: this.event.location.address,
      rsvpDeadline: new Date(this.event.rsvpDeadline).toISOString().slice(0, 10)
    });
  }

  formatTimeToDropdown(date: Date): string {
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    return `${hours}:00 ${ampm}`;
  }

  convertTimeToDate(dateStr: string, timeStr: string): Date {
    // Parse time string like "6:00 PM"
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    const date = new Date(dateStr);
    date.setHours(hours, minutes || 0, 0, 0);
    return date;
  }

  convertDateToEndOfDay(dateStr: string): string {
    // Set time to 11:59 PM (end of day)
    const date = new Date(dateStr);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editForm.reset();
  }

  submitEdit(): void {
    if (!this.editForm.valid || !this.event) return;

    this.updatingEvent = true;
    const formValue = this.editForm.value;
    const eventDateTime = this.convertTimeToDate(formValue.eventDate!, formValue.eventTime!);

    // Use dot notation to update location fields without replacing courts
    const eventData: any = {
      title: formValue.title!,
      dateTime: eventDateTime.toISOString(),
      duration: formValue.duration!,
      maxParticipants: formValue.maxParticipants!,
      description: formValue.description || '',
      'location.name': formValue.locationName!,
      'location.address': formValue.locationAddress!,
      rsvpDeadline: this.convertDateToEndOfDay(formValue.rsvpDeadline!)
    };

    if (formValue.format) {
      eventData.format = formValue.format;
    }

    this.eventService.updateEvent(this.event.id, eventData).subscribe({
      next: async (response) => {
        this.updatingEvent = false;
        if (response.success && response.data) {
          this.event = response.data;
          this.showEditModal = false;
          await this.modalService.showAlert('Success', 'Event updated successfully!');
        }
      },
      error: async (error) => {
        this.updatingEvent = false;
        await this.modalService.showAlert('Error', error.error?.message || 'Failed to update event');
      }
    });
  }

  async deleteEvent(): Promise<void> {
    if (!this.event) return;

    const result = await this.modalService.showConfirm(
      'Delete Event',
      `Are you sure you want to delete "${this.event.title}"?\n\n` +
      `Date: ${this.formatDate(this.event.dateTime)}\n` +
      `RSVPs: ${this.event.attendingCount} attending\n\n` +
      `This action cannot be undone.`
    );

    if (result.confirmed) {
      this.deletingEvent = true;
      this.eventService.deleteEvent(this.event.id).subscribe({
        next: async (response) => {
          this.deletingEvent = false;
          if (response.success) {
            await this.modalService.showAlert('Success', 'Event deleted successfully!');
            this.router.navigate(['/events']);
          }
        },
        error: async (error) => {
          this.deletingEvent = false;
          await this.modalService.showAlert('Error', error.error?.message || 'Failed to delete event');
        }
      });
    }
  }
}
