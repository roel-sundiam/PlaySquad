import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { EventService, Event, EventSearchParams, CreateEventData, RSVPData } from '../../services/event.service';
import { ClubService, Club } from '../../services/club.service';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-events-list',
  template: `
    <div class="events-page">
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
            <p class="achievement-text">Discover amazing events and experience automated matchmaking</p>
            <div class="hero-actions">
              <button 
                class="btn-primary" 
                (click)="showCreateEvent = true"
                *ngIf="canUserCreateEvents()"
                [disabled]="getOrganizerClubs().length === 0 && !loadingClubs">
                <span class="btn-icon">➕</span>
                Create Event
              </button>
              <button class="btn-secondary" (click)="router.navigate(['/clubs'])">
                <span class="btn-icon">🏸</span>
                Browse Clubs
              </button>
            </div>
          </div>
        </section>

        <!-- Statistics Cards -->
        <section class="stats-section">
          <div class="stats-grid">
            <div class="stat-card events-stat">
              <div class="stat-icon">📅</div>
              <div class="stat-value">{{ getTotalEvents() }}</div>
              <div class="stat-label">Total Events</div>
            </div>
            <div class="stat-card upcoming-stat">
              <div class="stat-icon">⏰</div>
              <div class="stat-value">{{ getUpcomingEvents() }}</div>
              <div class="stat-label">Upcoming</div>
            </div>
            <div class="stat-card attending-stat">
              <div class="stat-icon">✓</div>
              <div class="stat-value">{{ getMyAttendingCount() }}</div>
              <div class="stat-label">Attending</div>
            </div>
            <div class="stat-card completed-stat">
              <div class="stat-icon">🏆</div>
              <div class="stat-value">{{ getCompletedEvents() }}</div>
              <div class="stat-label">Completed</div>
            </div>
          </div>
        </section>

        <!-- Events Content Card -->
        <section class="content-card">
          <div class="card-header">
            <h2>Browse Events</h2>
            <span class="event-count">{{ events.length }} events</span>
            <a href="#" class="view-all" (click)="loadAllEvents($event)">
              View All <span class="arrow">→</span>
            </a>
          </div>

          <div class="filters">
            <div class="filter-tabs">
              <button
                class="tab-btn"
                [class.active]="filterType === 'upcoming'"
                (click)="setFilter('upcoming')"
              >
                <span class="tab-icon">⏰</span> Upcoming
              </button>
              <button
                class="tab-btn"
                [class.active]="filterType === 'all'"
                (click)="setFilter('all')"
              >
                <span class="tab-icon">📅</span> All Events
              </button>
              <button
                class="tab-btn"
                [class.active]="filterType === 'my-events'"
                (click)="setFilter('my-events')"
              >
                <span class="tab-icon">👤</span> My Events
              </button>
              <button
                class="tab-btn"
                [class.active]="filterType === 'my-drafts'"
                (click)="setFilter('my-drafts')"
                *ngIf="canUserCreateEvents()"
              >
                <span class="tab-icon">📝</span> Drafts
              </button>
            </div>
          </div>

          <div class="events-grid" *ngIf="events.length > 0; else noEvents">
          <div class="event-card" *ngFor="let event of events">
            <div class="event-header">
              <div class="event-info">
                <h3>{{ event.title }}</h3>
                <p class="event-club">{{ event.club.name }}</p>
                <div class="event-meta">
                  <span class="event-date">📅 {{ formatDate(event.dateTime) }}</span>
                  <span class="event-location">📍 {{ event.location.name }}</span>
                  <span class="event-format" *ngIf="event.format">🎾 {{ event.format | titlecase }}</span>
                <span class="event-type" *ngIf="!event.format">{{ getEventTypeIcon(event.eventType) }} {{ event.eventType | titlecase }}</span>
                </div>
              </div>
              <div class="event-status">
                <span class="status-badge" [class]="'status-' + event.status">
                  {{ event.status | titlecase }}
                </span>
              </div>
            </div>

            <div class="event-details" *ngIf="event.description">
              <p>{{ event.description }}</p>
            </div>

            <div class="event-stats">
              <div class="stat">
                <span class="stat-label">Participants</span>
                <span class="stat-value">{{ event.attendingCount }}/{{ event.maxParticipants }}</span>
              </div>
              <div class="stat" *ngIf="event.skillLevelRange && event.skillLevelRange.min">
                <span class="stat-label">Skill Level</span>
                <span class="stat-value">{{ event.skillLevelRange.min }}-{{ event.skillLevelRange.max }}</span>
              </div>
              <div class="stat" *ngIf="event.registrationFee.amount > 0">
                <span class="stat-label">Fee</span>
                <span class="stat-value">\${{ event.registrationFee.amount }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Duration</span>
                <span class="stat-value">{{ event.duration }}min</span>
              </div>
            </div>

            <div class="rsvp-status" *ngIf="getUserRsvp(event) as rsvp">
              <span class="rsvp-badge" [class]="'rsvp-' + rsvp.status">
                {{ rsvp.status === 'attending' ? '✓ Attending' : rsvp.status === 'maybe' ? '? Maybe' : '✗ Declined' }}
              </span>
            </div>

            <div class="event-actions">
              <button class="btn-outline" (click)="viewEvent(event.id)">View Details</button>
              <button
                class="btn-primary"
                (click)="openRsvpModal(event)"
                *ngIf="event.isRsvpOpen && !getUserRsvp(event)"
              >
                RSVP
              </button>
              <button
                class="btn-secondary"
                (click)="openRsvpModal(event)"
                *ngIf="event.isRsvpOpen && getUserRsvp(event)"
              >
                Update RSVP
              </button>
              <button
                class="btn-secondary"
                (click)="editEvent(event)"
                *ngIf="canManageEvent(event) && !event.hasStarted"
              >
                Edit Event
              </button>
              <button
                class="btn-primary"
                (click)="publishEvent(event)"
                *ngIf="event.status === 'draft' && canManageEvent(event)"
              >
                Publish Event
              </button>
              <button
                class="btn-danger"
                (click)="deleteEventFromList(event)"
                *ngIf="canManageEvent(event) && !event.hasStarted"
                [disabled]="deletingEventId === event.id"
              >
                <svg *ngIf="deletingEventId !== event.id" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                <span class="spinner" *ngIf="deletingEventId === event.id"></span>
                {{ deletingEventId === event.id ? 'Deleting...' : 'Delete' }}
              </button>
              <span class="rsvp-closed" *ngIf="!event.isRsvpOpen && event.status !== 'draft'">RSVP Closed</span>
              <span class="draft-status" *ngIf="event.status === 'draft'">📝 Draft - Not visible to members</span>
            </div>

            <div class="matches-info" *ngIf="event.matchesGenerated && event.matches.length > 0">
              <h4>🏆 Matches Generated ({{ event.matches.length }})</h4>
              <p>Automated matchmaking complete - view details to see court assignments</p>
            </div>
          </div>
        </div>

          <ng-template #noEvents>
            <div class="empty-state">
              <div class="empty-icon">📅</div>
              <h3>No events found</h3>
              <p>Be the first to create an event in your club and bring the community together!</p>
              <button class="btn-primary" (click)="showCreateEvent = true" *ngIf="canUserCreateEvents()">
                <span class="btn-icon">➕</span>
                Create Your First Event
              </button>
            </div>
          </ng-template>
        </section>
      </main>

      <!-- RSVP Modal -->
      <div class="modal" *ngIf="showRsvpModal" (click)="closeModal($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>RSVP to {{ selectedEvent?.title }}</h2>
            <button class="close-btn" (click)="showRsvpModal = false">×</button>
          </div>

          <form [formGroup]="rsvpForm" (ngSubmit)="onRsvp()">
            <div class="form-group">
              <label>RSVP Status</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input type="radio" formControlName="status" value="attending">
                  <span>✓ Attending</span>
                </label>
                <label class="radio-option">
                  <input type="radio" formControlName="status" value="maybe">
                  <span>? Maybe</span>
                </label>
                <label class="radio-option">
                  <input type="radio" formControlName="status" value="declined">
                  <span>✗ Can't Attend</span>
                </label>
              </div>
            </div>

            <div class="form-group" *ngIf="rsvpForm.get('status')?.value === 'attending' && isSportsEventForRsvp()">
              <label for="skillLevel">Your Skill Level (1-10)</label>
              <select id="skillLevel" formControlName="skillLevel" class="form-control">
                <option value="">Select your skill level</option>
                <option *ngFor="let level of skillLevels" [value]="level">{{ level }}</option>
              </select>
            </div>

            <div class="form-group" *ngIf="rsvpForm.get('status')?.value === 'attending' && isSportsEventForRsvp()">
              <label for="preferredFormat">Preferred Format</label>
              <select id="preferredFormat" formControlName="preferredFormat" class="form-control">
                <option value="any">Any</option>
                <option value="singles">Singles</option>
                <option value="doubles">Doubles</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div class="form-group">
              <label for="notes">Notes (optional)</label>
              <textarea id="notes" formControlName="notes" class="form-control" rows="3" placeholder="Any special requests or notes..."></textarea>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="showRsvpModal = false">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="rsvpForm.invalid || submittingRsvp">
                {{ submittingRsvp ? 'Submitting...' : 'Submit RSVP' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Event Modal -->
      <div class="modal" *ngIf="showEditEvent" (click)="closeModal($event)">
        <div class="modal-content large-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Edit Event</h2>
            <button class="close-btn" (click)="showEditEvent = false">×</button>
          </div>

          <form [formGroup]="editEventForm" (ngSubmit)="onEditEvent()">
            <div class="form-group">
              <label for="editTitle">Event Title</label>
              <input type="text" id="editTitle" formControlName="title" class="form-control">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="editEventDate">Event Date</label>
                <input type="date" id="editEventDate" formControlName="eventDate" class="form-control">
              </div>
              <div class="form-group">
                <label for="editEventTime">Event Time</label>
                <select id="editEventTime" formControlName="eventTime" class="form-control">
                  <option *ngFor="let time of timeOptions" [value]="time">{{ time }}</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="editDuration">Duration (minutes)</label>
              <input type="number" id="editDuration" formControlName="duration" class="form-control" min="30" max="480">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="editFormat">Format</label>
                <select id="editFormat" formControlName="format" class="form-control">
                  <option value="singles">Singles</option>
                  <option value="doubles">Doubles</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div class="form-group">
                <label for="editMaxParticipants">Max Participants</label>
                <input type="number" id="editMaxParticipants" formControlName="maxParticipants" class="form-control" min="2" max="100">
              </div>
            </div>

            <div class="form-group">
              <label for="editDescription">Description</label>
              <textarea id="editDescription" formControlName="description" class="form-control" rows="3"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="editLocationName">Location Name</label>
                <input type="text" id="editLocationName" formControlName="locationName" class="form-control">
              </div>
              <div class="form-group">
                <label for="editLocationAddress">Address</label>
                <input type="text" id="editLocationAddress" formControlName="locationAddress" class="form-control">
              </div>
            </div>

            <div class="form-group">
              <label for="editRsvpDeadline">RSVP Deadline</label>
              <input type="date" id="editRsvpDeadline" formControlName="rsvpDeadline" class="form-control">
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="showEditEvent = false">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="editEventForm.invalid || updating">
                {{ updating ? 'Updating...' : 'Update Event' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Create Event Modal -->
      <div class="modal" *ngIf="showCreateEvent">
        <div class="modal-content large-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Create New Event</h2>
            <button class="close-btn" (click)="closeCreateEventModal()">×</button>
          </div>

          <form [formGroup]="createEventForm" (ngSubmit)="onCreateEvent()">
            <div class="form-group">
              <label for="title">Event Title</label>
              <input type="text" id="title" formControlName="title" class="form-control">
            </div>

            <div class="form-group">
              <label>{{ isClubPreSelected ? 'Selected Club' : 'Select Club' }}</label>
              
              <!-- Pre-selected Club Display -->
              <div class="pre-selected-club" *ngIf="isClubPreSelected && getSelectedClub()">
                <div class="selected-club-card">
                  <div class="club-avatar">
                    <img *ngIf="getSelectedClub()?.avatar" [src]="getSelectedClub()?.avatar" [alt]="getSelectedClub()?.name" class="club-image">
                    <div *ngIf="!getSelectedClub()?.avatar" class="club-initials">
                      {{ getClubInitials(getSelectedClub()?.name || '') }}
                    </div>
                  </div>
                  <div class="club-info">
                    <h4>{{ getSelectedClub()?.name }}</h4>
                    <p>{{ getSelectedClub()?.sport | titlecase }}</p>
                    <div class="coin-display">
                      💰 {{ clubCoinBalances[getSelectedClub()?.id || ''] || 0 }} coins
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Loading State -->
              <div class="club-cards-loading" *ngIf="loadingClubs && !isClubPreSelected">
                <div class="loading-message">Loading clubs...</div>
              </div>

              <!-- No Clubs Message -->
              <div class="no-clubs-message" *ngIf="!loadingClubs && getOrganizerClubs().length === 0 && !isClubPreSelected">
                <p>You need organizer or admin permissions in a club to create events.</p>
                <a href="/clubs" target="_blank" class="help-link">Contact a club admin for permissions</a>
              </div>

              <!-- Club Selection Cards -->
              <div class="club-cards-container" *ngIf="!loadingClubs && getOrganizerClubs().length > 0 && !isClubPreSelected">
                <div 
                  class="club-card" 
                  *ngFor="let club of getOrganizerClubs()" 
                  [class.selected]="createEventForm.get('club')?.value === club.id"
                  [class.insufficient-coins]="clubCoinBalances[club.id] < 10"
                  (click)="selectClub(club.id)"
                >
                  <div class="club-card-header">
                    <div class="club-avatar">
                      <img *ngIf="club.avatar" [src]="club.avatar" [alt]="club.name" class="club-image">
                      <div *ngIf="!club.avatar" class="club-initials">
                        {{ getClubInitials(club.name) }}
                      </div>
                    </div>
                    <div class="club-info">
                      <h4 class="club-name">{{ club.name }}</h4>
                      <span class="club-sport">{{ club.sport | titlecase }}</span>
                    </div>
                    <div class="selection-indicator">
                      <div class="check-icon" *ngIf="createEventForm.get('club')?.value === club.id">✓</div>
                    </div>
                  </div>
                  
                  <div class="club-card-footer">
                    <div class="club-stats">
                      <span class="member-count">👥 {{ club.memberCount }}</span>
                      <span class="location">📍 {{ club.location?.name || 'Location not set' }}</span>
                    </div>
                    <div class="coin-balance" [ngClass]="{'low-balance': clubCoinBalances[club.id] < 10}">
                      💰 {{ clubCoinBalances[club.id] || 0 | number }} coins
                      <div class="insufficient-badge" *ngIf="clubCoinBalances[club.id] < 10">
                        Insufficient
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="eventType">Event Type</label>
              <select id="eventType" formControlName="eventType" class="form-control" (change)="onEventTypeChange()">
                <option value="sports">🎾 Open Play (matches, skill levels)</option>
                <option value="social">🎉 Social Event (party, meeting)</option>
                <option value="tournament">🏆 Tournament (competitive)</option>
                <option value="training">🏃 Training Session</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="eventDate">Event Date</label>
                <input type="date" id="eventDate" formControlName="eventDate" class="form-control">
              </div>
              <div class="form-group">
                <label for="eventTime">Event Time</label>
                <select id="eventTime" formControlName="eventTime" class="form-control">
                  <option *ngFor="let time of timeOptions" [value]="time">{{ time }}</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="duration">Duration (minutes)</label>
              <input type="number" id="duration" formControlName="duration" class="form-control" min="30" max="480">
            </div>

            <div class="form-row" *ngIf="isSportsEvent()">
              <div class="form-group">
                <label for="format">Format</label>
                <select id="format" formControlName="format" class="form-control">
                  <option value="singles">Singles</option>
                  <option value="doubles">Doubles</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div class="form-group">
                <label for="maxParticipants">Max Participants</label>
                <input type="number" id="maxParticipants" formControlName="maxParticipants" class="form-control" min="2" max="100">
              </div>
            </div>

            <div class="form-group" *ngIf="!isSportsEvent()">
              <label for="maxParticipants">Max Participants</label>
              <input type="number" id="maxParticipants" formControlName="maxParticipants" class="form-control" min="2" max="100">
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
              <label for="rsvpDeadline">RSVP Deadline</label>
              <input type="date" id="rsvpDeadline" formControlName="rsvpDeadline" class="form-control">
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeCreateEventModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="createEventForm.invalid || creating || getSelectedClubCoinBalance() < 10">
                {{ creating ? 'Creating...' : 'Create Event (10 coins)' }}
              </button>
            </div>
          </form>

          <!-- Debug Panel -->
          <div class="debug-panel" *ngIf="showDebugPanel">
            <div class="debug-header">
              <h3>Debug Information</h3>
              <button type="button" class="close-debug-btn" (click)="showDebugPanel = false">×</button>
            </div>
            <div class="debug-content">
              <div class="debug-section">
                <h4>Step: {{ debugInfo.step }}</h4>
                <p><strong>Timestamp:</strong> {{ debugInfo.timestamp | date:'medium' }}</p>
              </div>
              
              <div class="debug-section" *ngIf="debugInfo.formValid !== undefined">
                <h4>Form Validation</h4>
                <p><strong>Form Valid:</strong> {{ debugInfo.formValid ? 'Yes' : 'No' }}</p>
                <p><strong>Selected Club ID:</strong> {{ debugInfo.selectedClubId || 'None' }}</p>
                <p><strong>Available Clubs:</strong> {{ debugInfo.userClubs?.length || 0 }}</p>
              </div>

              <div class="debug-section" *ngIf="debugInfo.formValues">
                <h4>Form Values</h4>
                <pre>{{ debugInfo.formValues | json }}</pre>
              </div>

              <div class="debug-section" *ngIf="debugInfo.clubSelection">
                <h4>Club Selection</h4>
                <pre>{{ debugInfo.clubSelection | json }}</pre>
              </div>

              <div class="debug-section" *ngIf="debugInfo.apiRequest">
                <h4>API Request</h4>
                <p><strong>Endpoint:</strong> {{ debugInfo.apiRequest.endpoint }}</p>
                <p><strong>Method:</strong> {{ debugInfo.apiRequest.method }}</p>
                <p><strong>Club ID in Request:</strong> {{ debugInfo.apiRequest.data?.club }}</p>
                <details>
                  <summary>Full Request Data</summary>
                  <pre>{{ debugInfo.apiRequest.data | json }}</pre>
                </details>
              </div>

              <div class="debug-section" *ngIf="debugInfo.healthStatus">
                <h4>Backend Health Check</h4>
                <p><strong>Status:</strong> {{ debugInfo.healthStatus.status }} {{ debugInfo.healthStatus.statusText }}</p>
                <p><strong>Backend OK:</strong> {{ debugInfo.healthStatus.ok ? 'Yes' : 'No' }}</p>
                <div *ngIf="debugInfo.healthResponse">
                  <p><strong>Health Response:</strong></p>
                  <pre>{{ debugInfo.healthResponse | json }}</pre>
                </div>
              </div>

              <div class="debug-section error" *ngIf="debugInfo.healthError">
                <h4>Backend Health Error</h4>
                <p><strong>Error:</strong> {{ debugInfo.healthError.name }}: {{ debugInfo.healthError.message }}</p>
                <p>This means the backend server is not running or not accessible at http://localhost:3000</p>
              </div>

              <div class="debug-section" *ngIf="debugInfo.testRequest">
                <h4>Backend Test Request</h4>
                <p><strong>Endpoint:</strong> {{ debugInfo.testRequest.endpoint }}</p>
                <p><strong>Method:</strong> {{ debugInfo.testRequest.method }}</p>
                <p><strong>Club ID:</strong> {{ debugInfo.testRequest.data?.club }}</p>
                <pre>{{ debugInfo.testRequest.data | json }}</pre>
              </div>

              <div class="debug-section" *ngIf="debugInfo.testResponse">
                <h4>Backend Test Response</h4>
                <p><strong>Backend Received Club ID:</strong> {{ debugInfo.testResponse.data?.receivedClubId || 'MISSING' }}</p>
                <p><strong>Body Keys Backend Saw:</strong> {{ debugInfo.testResponse.data?.bodyKeys?.join(', ') || 'None' }}</p>
                <details>
                  <summary>Full Backend Response</summary>
                  <pre>{{ debugInfo.testResponse | json }}</pre>
                </details>
              </div>

              <div class="debug-section error" *ngIf="debugInfo.testError">
                <h4>Backend Test Error</h4>
                <p><strong>Status:</strong> {{ debugInfo.testError.status }}</p>
                <pre>{{ debugInfo.testError.error | json }}</pre>
              </div>

              <div class="debug-section" *ngIf="debugInfo.apiResponse">
                <h4>API Response (Success)</h4>
                <pre>{{ debugInfo.apiResponse | json }}</pre>
              </div>

              <div class="debug-section error" *ngIf="debugInfo.apiError">
                <h4>API Error Response</h4>
                <p><strong>Status:</strong> {{ debugInfo.apiError.status }} {{ debugInfo.apiError.statusText }}</p>
                <p><strong>URL:</strong> {{ debugInfo.apiError.url }}</p>
                <p><strong>Error Message:</strong> {{ debugInfo.apiError.error?.message }}</p>
                <p><strong>Response Time:</strong> {{ debugInfo.apiError.timestamp | date:'medium' }}</p>
                <details>
                  <summary>Response Headers</summary>
                  <pre>{{ debugInfo.apiError.headers | json }}</pre>
                </details>
                <details>
                  <summary>Full Error Response</summary>
                  <pre>{{ debugInfo.apiError | json }}</pre>
                </details>
              </div>

              <div class="debug-section error" *ngIf="debugInfo.error">
                <h4>Error</h4>
                <p>{{ debugInfo.error }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Global styles following DASHBOARD_DESIGN_GUIDE.md */
    .events-page {
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

    .events-stat { background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%); }
    .upcoming-stat { background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%); }
    .attending-stat { background: linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%); }
    .completed-stat { background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%); }

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

    .event-count {
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
      margin-bottom: 1.5rem;
    }

    .filter-tabs {
      display: flex;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 0.25rem;
      border: 1px solid rgba(251, 146, 60, 0.2);
      justify-content: center;
      gap: 0.25rem;
    }

    .tab-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      color: #475569;
      font-weight: 500;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.3s;
      font-size: 0.875rem;
    }

    .tab-btn.active {
      background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(251, 146, 60, 0.3);
    }

    .tab-btn:hover:not(.active) {
      background: rgba(251, 146, 60, 0.1);
      color: #fb923c;
    }

    .tab-icon {
      font-size: 1rem;
    }

    /* Events Grid */
    .events-grid {
      display: grid;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .event-card {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(249, 115, 22, 0.1) 100%);
      border: 1px solid rgba(251, 146, 60, 0.3);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 1.5rem;
      transition: all 0.3s;
    }

    .event-card:hover {
      border-color: rgba(251, 146, 60, 0.8);
      box-shadow: 0 8px 25px rgba(251, 146, 60, 0.2);
      transform: translateY(-2px);
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .event-info h3 {
      margin: 0 0 0.5rem 0;
      color: #1e293b;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .event-club {
      margin: 0 0 0.75rem 0;
      color: #fb923c;
      font-weight: 600;
      font-size: 1rem;
    }

    .event-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.875rem;
      color: #475569;
    }

    .event-meta span {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .status-badge {
      padding: 0.375rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
      border: 1px solid rgba(251, 146, 60, 0.2);
    }

    .status-published {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%);
      color: #16a34a;
      border-color: rgba(34, 197, 94, 0.3);
    }

    .status-ongoing {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%);
      color: #f59e0b;
      border-color: rgba(251, 146, 60, 0.3);
    }

    .status-completed {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%);
      color: #2563eb;
      border-color: rgba(59, 130, 246, 0.3);
    }

    .status-cancelled {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%);
      color: #dc2626;
      border-color: rgba(239, 68, 68, 0.3);
    }

    .event-details {
      margin-bottom: 1rem;
      color: #475569;
      line-height: 1.5;
    }

    .event-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 1rem;
      background: rgba(251, 146, 60, 0.1);
      border: 1px solid rgba(251, 146, 60, 0.2);
      border-radius: 12px;
    }

    .stat {
      text-align: center;
    }

    .stat-label {
      display: block;
      font-size: 0.75rem;
      color: #475569;
      margin-bottom: 0.25rem;
      font-weight: 500;
    }

    .stat-value {
      display: block;
      font-weight: 600;
      color: #1e293b;
      font-size: 0.9rem;
    }

    .rsvp-status {
      margin-bottom: 16px;
    }

    .rsvp-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9em;
    }

    .rsvp-attending {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .rsvp-maybe {
      background: #fff3e0;
      color: #f57c00;
    }

    .rsvp-declined {
      background: #ffebee;
      color: #c62828;
    }

    .event-actions {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 16px;
    }

    .rsvp-closed {
      color: #666;
      font-style: italic;
    }

    .draft-status {
      color: #f57c00;
      font-style: italic;
      font-weight: 500;
    }

    .matches-info {
      background: #e8f5e8;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #00C853;
    }

    .matches-info h4 {
      margin: 0 0 8px 0;
      color: #2e7d32;
    }

    .matches-info p {
      margin: 0;
      color: #555;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-state h3 {
      color: #333;
      margin-bottom: 12px;
    }

    /* Modal Styles */
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .large-modal {
      max-width: 800px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 24px 16px 24px;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
      margin: 0;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 32px;
      height: 32px;
    }

    .modal form {
      padding: 24px;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .form-group {
      margin-bottom: 20px;
      flex: 1;
    }

    .coin-balance-info {
      margin-top: 8px;
    }

    .coin-balance {
      display: block;
      color: #00C853;
      font-weight: 500;
    }

    .coin-balance.low-balance {
      color: #d32f2f;
    }

    .insufficient-warning {
      color: #d32f2f;
      font-weight: 600;
    }

    /* Club Cards Styling */
    .club-cards-loading {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .loading-message {
      font-size: 16px;
      color: #666;
    }

    .no-clubs-message {
      text-align: center;
      padding: 40px 20px;
      background: #f9f9f9;
      border-radius: 12px;
      border: 2px dashed #ddd;
    }

    .no-clubs-message p {
      margin: 0 0 12px 0;
      color: #666;
    }

    .help-link {
      color: #00C853;
      text-decoration: none;
      font-weight: 500;
    }

    .help-link:hover {
      text-decoration: underline;
    }

    /* Pre-selected Club Display */
    .pre-selected-club {
      margin-top: 12px;
    }

    .selected-club-card {
      background: linear-gradient(135deg, #00C853 0%, #00e676 100%);
      border: 2px solid #00C853;
      border-radius: 12px;
      padding: 16px;
      color: white;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .selected-club-card .club-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 18px;
      flex-shrink: 0;
    }

    .selected-club-card .club-image {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .selected-club-card .club-initials {
      color: white;
      font-weight: bold;
    }

    .selected-club-card .club-info h4 {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .selected-club-card .club-info p {
      margin: 0 0 8px 0;
      opacity: 0.9;
      font-size: 14px;
    }

    .selected-club-card .coin-display {
      font-size: 14px;
      font-weight: 500;
      opacity: 0.9;
    }

    .club-cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-top: 12px;
    }

    .club-card {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .club-card:hover {
      border-color: #00C853;
      box-shadow: 0 4px 12px rgba(0, 200, 83, 0.15);
      transform: translateY(-2px);
    }

    .club-card.selected {
      border-color: #00C853;
      background: #f8fff9;
      box-shadow: 0 4px 12px rgba(0, 200, 83, 0.2);
    }

    .club-card.insufficient-coins {
      border-color: #ffcdd2;
      background: #fdf2f2;
    }

    .club-card.insufficient-coins:hover {
      border-color: #f44336;
      box-shadow: 0 4px 12px rgba(244, 67, 54, 0.15);
    }

    .club-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .club-avatar {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      overflow: hidden;
      background: #00C853;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .club-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .club-initials {
      color: white;
      font-weight: 600;
      font-size: 18px;
    }

    .club-info {
      flex: 1;
      min-width: 0;
    }

    .club-name {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .club-sport {
      color: #666;
      font-size: 14px;
      background: #f5f5f5;
      padding: 2px 8px;
      border-radius: 12px;
    }

    .selection-indicator {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .check-icon {
      width: 20px;
      height: 20px;
      background: #00C853;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }

    .club-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 12px;
    }

    .club-stats {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 0;
    }

    .member-count,
    .location {
      font-size: 12px;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .coin-balance {
      font-size: 14px;
      font-weight: 600;
      color: #00C853;
      text-align: right;
      position: relative;
    }

    .coin-balance.low-balance {
      color: #d32f2f;
    }

    .insufficient-badge {
      font-size: 10px;
      background: #d32f2f;
      color: white;
      padding: 2px 6px;
      border-radius: 8px;
      margin-top: 2px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      color: #333;
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 16px;
      box-sizing: border-box;
      background-color: white;
    }

    .form-control:focus {
      outline: none;
      border-color: #00C853;
    }

    select.form-control {
      cursor: pointer;
      appearance: none;
      background-image: url('data:image/svg+xml;charset=UTF-8,<svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L6 6L11 1" stroke="%2364748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 40px;
    }

    .radio-group {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 8px 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      transition: all 0.3s;
    }

    .radio-option:hover {
      border-color: #00C853;
    }

    .radio-option input[type="radio"]:checked + span {
      color: #00C853;
      font-weight: 600;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
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

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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

    .btn-danger {
      background: transparent;
      color: #ef4444;
      border: 2px solid #fee2e2;
      position: relative;
      overflow: hidden;
      z-index: 1;
    }

    .btn-danger::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      transition: left 0.3s ease;
      z-index: -1;
    }

    .btn-danger:hover:not(:disabled) {
      color: white;
      border-color: #ef4444;
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(239, 68, 68, 0.25);
    }

    .btn-danger:hover:not(:disabled)::before {
      left: 0;
    }

    .btn-danger:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #f3f4f6;
      color: #9ca3af;
      border-color: #e5e7eb;
    }

    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid #fee2e2;
      border-top-color: #ef4444;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 4px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .btn-danger svg {
      transition: transform 0.2s ease;
    }

    .btn-danger:hover:not(:disabled) svg {
      transform: scale(1.1);
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

    .event-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .rsvp-status {
      margin-bottom: 1rem;
    }

    .rsvp-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 1rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.875rem;
      border: 1px solid rgba(251, 146, 60, 0.2);
    }

    .rsvp-attending {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%);
      color: #16a34a;
      border-color: rgba(34, 197, 94, 0.3);
    }

    .rsvp-maybe {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%);
      color: #f59e0b;
      border-color: rgba(251, 146, 60, 0.3);
    }

    .rsvp-declined {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%);
      color: #dc2626;
      border-color: rgba(239, 68, 68, 0.3);
    }

    .rsvp-closed {
      color: #475569;
      font-style: italic;
    }

    .draft-status {
      color: #f59e0b;
      font-style: italic;
      font-weight: 500;
    }

    .matches-info {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%);
      padding: 1rem;
      border-radius: 12px;
      border-left: 4px solid #22c55e;
      margin-top: 1rem;
    }

    .matches-info h4 {
      margin: 0 0 0.5rem 0;
      color: #16a34a;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .matches-info p {
      margin: 0;
      color: #475569;
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

    .large-modal {
      max-width: 800px;
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

    select.form-control {
      cursor: pointer;
      appearance: none;
      background-image: url('data:image/svg+xml;charset=UTF-8,<svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L6 6L11 1" stroke="%2364748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 40px;
    }

    .radio-group {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      padding: 0.5rem 0.75rem;
      border: 2px solid rgba(251, 146, 60, 0.2);
      border-radius: 8px;
      transition: all 0.3s;
    }

    .radio-option:hover {
      border-color: #fb923c;
      background: rgba(251, 146, 60, 0.05);
    }

    .radio-option input[type="radio"]:checked + span {
      color: #fb923c;
      font-weight: 600;
    }

    .modal-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }

    /* Club Cards (for create modal) */
    .club-cards-loading {
      text-align: center;
      padding: 2.5rem 1.25rem;
      color: #475569;
    }

    .loading-message {
      font-size: 1rem;
      color: #475569;
    }

    .no-clubs-message {
      text-align: center;
      padding: 2.5rem 1.25rem;
      background: rgba(251, 146, 60, 0.05);
      border-radius: 12px;
      border: 2px dashed rgba(251, 146, 60, 0.3);
    }

    .no-clubs-message p {
      margin: 0 0 0.75rem 0;
      color: #475569;
    }

    .help-link {
      color: #fb923c;
      text-decoration: none;
      font-weight: 500;
    }

    .help-link:hover {
      text-decoration: underline;
    }

    .club-cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
      margin-top: 0.75rem;
    }

    .club-card {
      background: rgba(255, 255, 255, 0.8);
      border: 2px solid rgba(251, 146, 60, 0.2);
      border-radius: 12px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .club-card:hover {
      border-color: #fb923c;
      box-shadow: 0 4px 12px rgba(251, 146, 60, 0.15);
      transform: translateY(-2px);
    }

    .club-card.selected {
      border-color: #fb923c;
      background: rgba(251, 146, 60, 0.1);
      box-shadow: 0 4px 12px rgba(251, 146, 60, 0.2);
    }

    .club-card.insufficient-coins {
      border-color: #fca5a5;
      background: rgba(239, 68, 68, 0.05);
    }

    .club-card.insufficient-coins:hover {
      border-color: #ef4444;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
    }

    .club-card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .club-avatar {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      overflow: hidden;
      background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .club-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .club-initials {
      color: white;
      font-weight: 600;
      font-size: 1.125rem;
    }

    .club-info {
      flex: 1;
      min-width: 0;
    }

    .club-name {
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .club-sport {
      color: #475569;
      font-size: 0.875rem;
      background: rgba(251, 146, 60, 0.1);
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
    }

    .selection-indicator {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .check-icon {
      width: 20px;
      height: 20px;
      background: #fb923c;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .club-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 0.75rem;
    }

    .club-stats {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
      min-width: 0;
    }

    .member-count,
    .location {
      font-size: 0.75rem;
      color: #475569;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .coin-balance {
      font-size: 0.875rem;
      font-weight: 600;
      color: #22c55e;
      text-align: right;
      position: relative;
    }

    .coin-balance.low-balance {
      color: #dc2626;
    }

    .insufficient-badge {
      font-size: 0.625rem;
      background: #dc2626;
      color: white;
      padding: 0.125rem 0.375rem;
      border-radius: 8px;
      margin-top: 0.125rem;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .stats-grid {
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

      .event-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .event-meta {
        flex-direction: column;
        gap: 0.5rem;
      }

      .event-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .event-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-tabs {
        flex-wrap: wrap;
        gap: 0.25rem;
      }

      .tab-btn {
        font-size: 0.8rem;
        padding: 0.5rem 0.75rem;
      }

      .tab-icon {
        font-size: 0.875rem;
      }

      .radio-group {
        flex-direction: column;
      }

      .form-row {
        flex-direction: column;
      }

      .club-cards-container {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .club-card {
        padding: 0.75rem;
      }

      .club-card-header {
        gap: 0.625rem;
        margin-bottom: 0.625rem;
      }

      .club-avatar {
        width: 40px;
        height: 40px;
      }

      .club-initials {
        font-size: 1rem;
      }

      .club-name {
        font-size: 0.875rem;
      }

      .club-sport {
        font-size: 0.75rem;
      }

      .club-card-footer {
        gap: 0.625rem;
      }

      .member-count,
      .location {
        font-size: 0.6875rem;
      }

      .coin-balance {
        font-size: 0.75rem;
      }

      .insufficient-badge {
        font-size: 0.5625rem;
        padding: 0.0625rem 0.25rem;
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

    /* Debug Panel Styles */
    .debug-panel {
      margin-top: 1rem;
      border: 2px solid #ef4444;
      border-radius: 8px;
      background: #fef2f2;
      max-height: 60vh;
      overflow-y: auto;
    }

    .debug-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #ef4444;
      color: white;
      border-radius: 6px 6px 0 0;
    }

    .debug-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .close-debug-btn {
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-debug-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }

    .debug-content {
      padding: 1rem;
    }

    .debug-section {
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: white;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .debug-section.error {
      background: #fef2f2;
      border-color: #fca5a5;
    }

    .debug-section h4 {
      margin: 0 0 0.5rem 0;
      color: #ef4444;
      font-size: 0.9rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .debug-section p {
      margin: 0.25rem 0;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .debug-section pre {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 0.5rem;
      font-size: 0.75rem;
      overflow-x: auto;
      margin: 0.5rem 0;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .debug-section details {
      margin-top: 0.5rem;
    }

    .debug-section summary {
      cursor: pointer;
      font-weight: 600;
      color: #6366f1;
      font-size: 0.875rem;
    }

    .debug-section summary:hover {
      color: #4f46e5;
    }
  `]
})
export class EventsListComponent implements OnInit {
  events: Event[] = [];
  userClubs: Club[] = [];
  loadingClubs = false;
  filterType: 'upcoming' | 'all' | 'my-events' | 'my-drafts' = 'upcoming';
  showRsvpModal = false;
  showCreateEvent = false;
  showEditEvent = false;
  editingEvent: Event | null = null;
  isClubPreSelected = false;
  preSelectedClubId: string | null = null;
  selectedEvent: Event | null = null;
  submittingRsvp = false;
  creating = false;
  updating = false;
  deletingEventId: string | null = null;
  skillLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  clubCoinBalances: { [clubId: string]: number } = {};
  
  // Debug properties
  debugInfo: any = {};
  showDebugPanel = false;

  rsvpForm = this.fb.group({
    status: ['attending', [Validators.required]],
    skillLevel: [''],
    preferredFormat: ['any'],
    notes: ['']
  });

  timeOptions = [
    '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'
  ];

  createEventForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    club: ['', [Validators.required]],
    eventType: ['sports', [Validators.required]],
    eventDate: ['', [Validators.required]],
    eventTime: ['6:00 PM', [Validators.required]],
    duration: [120, [Validators.required, Validators.min(30)]],
    format: ['doubles'],
    maxParticipants: [8, [Validators.required, Validators.min(2)]],
    description: [''],
    locationName: ['', [Validators.required]],
    locationAddress: ['', [Validators.required]],
    rsvpDeadline: ['', [Validators.required]]
  });

  editEventForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    eventDate: ['', [Validators.required]],
    eventTime: ['6:00 PM', [Validators.required]],
    duration: [120, [Validators.required, Validators.min(30)]],
    format: ['doubles', [Validators.required]],
    maxParticipants: [8, [Validators.required, Validators.min(2)]],
    description: [''],
    locationName: ['', [Validators.required]],
    locationAddress: ['', [Validators.required]],
    rsvpDeadline: ['', [Validators.required]]
  });

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private eventService: EventService,
    private clubService: ClubService,
    private authService: AuthService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.loadEvents();
    this.loadUserClubs();
    this.setDefaultSkillLevel();
    
    // Check for clubId query parameter to pre-select club
    this.route.queryParams.subscribe(params => {
      if (params['clubId']) {
        this.preSelectedClubId = params['clubId'];
        // Process pre-selection after clubs are loaded
        this.processClubPreSelection();
      }
    });
  }

  setDefaultSkillLevel(): void {
    const currentUser = this.authService.currentUser;
    if (currentUser) {
      this.rsvpForm.patchValue({
        skillLevel: currentUser.skillLevel.toString(),
        preferredFormat: currentUser.preferredFormat
      });
    }
  }

  loadEvents(): void {
    const params: EventSearchParams = {
      limit: 20
    };

    if (this.filterType === 'upcoming') {
      params.upcoming = true;
    } else if (this.filterType === 'my-drafts') {
      params.status = 'draft';
      params.myEvents = true;
    } else if (this.filterType === 'my-events') {
      params.myEvents = true;
    }

    this.eventService.getEvents(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.events = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading events:', error);
      }
    });
  }

  loadUserClubs(): void {
    this.loadingClubs = true;
    this.clubService.getClubs().subscribe({
      next: (response) => {
        this.loadingClubs = false;
        if (response.success && response.data) {
          // Show all clubs where user is a member, not just organizer/admin
          const memberClubs = response.data.filter(club => this.isUserMemberOfClub(club));
          
          // For development: if no member clubs found, show all clubs as fallback
          if (memberClubs.length === 0) {
            console.log('No member clubs found, showing all clubs for development');
            this.userClubs = response.data;
          } else {
            this.userClubs = memberClubs;
          }
          
          console.log('Loaded user clubs:', this.userClubs.length, 'clubs found');
          console.log('User clubs:', this.userClubs.map(c => ({ id: c.id, name: c.name })));
          this.loadCoinBalancesForOrganizerClubs();
          // Process club pre-selection after clubs are loaded
          this.processClubPreSelection();
        }
      },
      error: (error) => {
        this.loadingClubs = false;
        console.error('Error loading user clubs:', error);
        // If API fails, try to get clubs from current user data
        const currentUser = this.authService.currentUser;
        if (currentUser && currentUser.clubs && currentUser.clubs.length > 0) {
          console.log('Using fallback: current user clubs data');
          // Create club objects from user's club memberships for the dropdown
          this.userClubs = currentUser.clubs.map(membership => ({
            id: membership.club,
            name: membership.clubName || `Club ${membership.club}`,
            sport: membership.sport || 'tennis',
            location: { 
              name: 'Unknown',
              address: 'Unknown'
            },
            isPrivate: false,
            memberCount: 0,
            description: '',
            owner: {
              id: 'unknown',
              firstName: 'Unknown',
              lastName: 'Owner'
            },
            members: [],
            settings: {
              maxMembers: 50,
              allowGuestPlayers: true,
              autoAcceptMembers: true,
              minSkillLevel: 1,
              maxSkillLevel: 10
            },
            stats: {
              totalEvents: 0,
              totalMatches: 0,
              activeMembersCount: 0
            },
            organizerCount: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
          console.log('Fallback clubs created:', this.userClubs.length);
          // Process club pre-selection after fallback clubs are loaded
          this.processClubPreSelection();
        } else {
          console.log('No user clubs available in currentUser data');
        }
      }
    });
  }

  processClubPreSelection(): void {
    if (this.preSelectedClubId && this.userClubs.length > 0) {
      const club = this.userClubs.find(c => c.id === this.preSelectedClubId);
      if (club && this.canUserCreateEvents()) {
        this.selectClub(this.preSelectedClubId);
        this.isClubPreSelected = true;
        this.showCreateEvent = true;
        // Clear the query parameter from URL
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
        // Clear the preselected club ID after processing
        this.preSelectedClubId = null;
      }
    }
  }

  isUserMemberOfClub(club: Club): boolean {
    const currentUser = this.authService.currentUser;
    if (!currentUser) return false;

    const membership = currentUser.clubs.find(userClub => userClub.club === club.id);
    return !!membership; // User is a member if they have any membership record
  }

  isUserOrganizerOfClub(club: Club): boolean {
    const currentUser = this.authService.currentUser;
    if (!currentUser) return false;

    const membership = currentUser.clubs.find(userClub => userClub.club === club.id);
    return membership ? ['organizer', 'admin'].includes(membership.role) : false;
  }

  canUserCreateEvents(): boolean {
    const currentUser = this.authService.currentUser;
    if (!currentUser) return false;

    return currentUser.clubs.some(membership => ['organizer', 'admin'].includes(membership.role));
  }

  getOrganizerClubs(): Club[] {
    return this.userClubs.filter(club => this.isUserOrganizerOfClub(club));
  }

  getSelectedClubCoinBalance(): number {
    const selectedClubId = this.createEventForm.get('club')?.value;
    return selectedClubId ? (this.clubCoinBalances[selectedClubId] || 0) : 0;
  }

  loadCoinBalancesForOrganizerClubs(): void {
    const organizerClubs = this.getOrganizerClubs();
    
    // Load coin balances with 200ms delay between requests to avoid rate limiting
    organizerClubs.forEach((club, index) => {
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

  selectClub(clubId: string): void {
    this.createEventForm.patchValue({ club: clubId });
    
    // Update debug info when club is selected
    if (this.showDebugPanel) {
      this.debugInfo.clubSelection = {
        selectedClubId: clubId,
        formClubValue: this.createEventForm.get('club')?.value,
        formValid: this.createEventForm.valid,
        timestamp: new Date().toISOString()
      };
    }
  }

  getSelectedClub(): Club | undefined {
    const selectedClubId = this.createEventForm.get('club')?.value;
    return selectedClubId ? this.userClubs.find(c => c.id === selectedClubId) : undefined;
  }

  closeCreateEventModal(): void {
    this.showCreateEvent = false;
    this.isClubPreSelected = false;
  }

  getClubInitials(clubName: string): string {
    return clubName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  setFilter(type: 'upcoming' | 'all' | 'my-events' | 'my-drafts'): void {
    this.filterType = type;
    this.loadEvents();
  }

  getUserRsvp(event: Event): any {
    const currentUser = this.authService.currentUser;
    if (!currentUser) return null;

    return event.rsvps.find(rsvp => rsvp.user.id === currentUser.id);
  }

  viewEvent(eventId: string): void {
    this.router.navigate(['/events', eventId]);
  }

  openRsvpModal(event: Event): void {
    this.selectedEvent = event;
    this.showRsvpModal = true;

    // Update form validators based on event type
    const skillLevelControl = this.rsvpForm.get('skillLevel');
    const preferredFormatControl = this.rsvpForm.get('preferredFormat');
    
    if (event.eventType === 'sports' || event.eventType === 'tournament') {
      skillLevelControl?.setValidators([Validators.required]);
      preferredFormatControl?.setValidators([]);
    } else {
      skillLevelControl?.clearValidators();
      preferredFormatControl?.clearValidators();
    }
    skillLevelControl?.updateValueAndValidity();
    preferredFormatControl?.updateValueAndValidity();

    const existingRsvp = this.getUserRsvp(event);
    if (existingRsvp) {
      this.rsvpForm.patchValue({
        status: existingRsvp.status,
        skillLevel: existingRsvp.skillLevel ? existingRsvp.skillLevel.toString() : '',
        preferredFormat: existingRsvp.preferredFormat || '',
        notes: existingRsvp.notes || ''
      });
    }
  }

  onRsvp(): void {
    if (this.rsvpForm.valid && this.selectedEvent) {
      this.submittingRsvp = true;

      const isSportsEvent = this.selectedEvent.eventType === 'sports' || this.selectedEvent.eventType === 'tournament';
      
      const rsvpData: any = {
        status: this.rsvpForm.value.status as 'attending' | 'maybe' | 'declined',
        notes: this.rsvpForm.value.notes || ''
      };

      // Only include sports-specific fields for sports events
      if (isSportsEvent && this.rsvpForm.value.skillLevel) {
        rsvpData.skillLevel = parseInt(this.rsvpForm.value.skillLevel);
      }
      if (isSportsEvent && this.rsvpForm.value.preferredFormat) {
        rsvpData.preferredFormat = this.rsvpForm.value.preferredFormat;
      }

      this.eventService.rsvpToEvent(this.selectedEvent.id, rsvpData).subscribe({
        next: async (response) => {
          this.submittingRsvp = false;
          if (response.success) {
            this.showRsvpModal = false;
            this.loadEvents();
            await this.modalService.showAlert('Success', 'RSVP submitted successfully!');
          }
        },
        error: async (error) => {
          this.submittingRsvp = false;
          await this.modalService.showAlert('Error', error.error?.message || 'Failed to submit RSVP');
        }
      });
    }
  }

  canManageEvent(event: Event): boolean {
    const currentUser = this.authService.currentUser;
    if (!currentUser) return false;

    // Check if user is event organizer
    if (event.organizer?.id === currentUser.id) return true;

    // Check if user is club organizer/admin
    const clubMembership = currentUser.clubs.find(club => club.club === event.club.id);
    return clubMembership ? ['organizer', 'admin'].includes(clubMembership.role) : false;
  }

  editEvent(event: Event): void {
    this.editingEvent = event;
    this.showEditEvent = true;

    // Pre-populate form with current event data
    const eventDate = new Date(event.dateTime);
    const dateStr = eventDate.toISOString().slice(0, 10);
    const timeStr = this.formatTimeToDropdown(eventDate);

    this.editEventForm.patchValue({
      title: event.title,
      eventDate: dateStr,
      eventTime: timeStr,
      duration: event.duration,
      format: event.format,
      maxParticipants: event.maxParticipants,
      description: event.description || '',
      locationName: event.location.name,
      locationAddress: event.location.address,
      rsvpDeadline: new Date(event.rsvpDeadline).toISOString().slice(0, 10)
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

  publishEvent(event: Event): void {
    this.eventService.updateEventStatus(event.id, 'published').subscribe({
      next: async (response) => {
        if (response.success) {
          await this.modalService.showAlert('Success', 'Event published successfully! Members can now RSVP.');
          this.loadEvents();
        }
      },
      error: async (error) => {
        await this.modalService.showAlert('Error', error.error?.message || 'Failed to publish event');
      }
    });
  }

  async deleteEventFromList(event: Event): Promise<void> {
    const result = await this.modalService.showConfirm(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"?\n\n` +
      `Date: ${this.formatDate(event.dateTime)}\n` +
      `RSVPs: ${event.attendingCount} attending\n\n` +
      `This action cannot be undone.`
    );

    if (result.confirmed) {
      this.deletingEventId = event.id;
      this.eventService.deleteEvent(event.id).subscribe({
        next: async (response) => {
          this.deletingEventId = null;
          if (response.success) {
            await this.modalService.showAlert('Success', 'Event deleted successfully!');
            this.loadEvents();
          }
        },
        error: async (error) => {
          this.deletingEventId = null;
          await this.modalService.showAlert('Error', error.error?.message || 'Failed to delete event');
        }
      });
    }
  }

  onEditEvent(): void {
    if (this.editEventForm.valid && this.editingEvent) {
      this.updating = true;

      const formValue = this.editEventForm.value;
      const eventDateTime = this.convertTimeToDate(formValue.eventDate!, formValue.eventTime!);

      // Use dot notation to update location fields without replacing courts
      const eventData: any = {
        title: formValue.title!,
        dateTime: eventDateTime.toISOString(),
        duration: formValue.duration!,
        format: formValue.format!,
        maxParticipants: formValue.maxParticipants!,
        description: formValue.description || '',
        'location.name': formValue.locationName!,
        'location.address': formValue.locationAddress!,
        rsvpDeadline: this.convertDateToEndOfDay(formValue.rsvpDeadline!)
      };

      this.eventService.updateEvent(this.editingEvent.id, eventData).subscribe({
        next: async (response) => {
          this.updating = false;
          if (response.success) {
            this.showEditEvent = false;
            this.editEventForm.reset();
            this.editingEvent = null;
            this.loadEvents();
            await this.modalService.showAlert('Success', 'Event updated successfully!');
          }
        },
        error: async (error) => {
          this.updating = false;
          await this.modalService.showAlert('Error', error.error?.message || 'Failed to update event');
        }
      });
    }
  }

  onCreateEvent(): void {
    // Show debug panel
    this.showDebugPanel = true;
    
    // Capture debug info for UI
    this.debugInfo = {
      timestamp: new Date().toISOString(),
      formValid: this.createEventForm.valid,
      formValues: { ...this.createEventForm.value },
      selectedClubId: this.createEventForm.get('club')?.value,
      userClubs: this.userClubs.map(c => ({ id: c.id, name: c.name })),
      step: 'Form Validation'
    };
    
    // Additional validation for club selection
    const clubId = this.createEventForm.get('club')?.value;
    if (!clubId) {
      this.debugInfo.error = 'No club selected - aborting event creation';
      this.debugInfo.step = 'Validation Failed';
      this.modalService.showAlert('Error', 'Please select a club before creating an event.');
      return;
    }
    
    if (this.createEventForm.valid) {
      this.creating = true;

      const formValue = this.createEventForm.value;
      const isSportsType = formValue.eventType === 'sports' || formValue.eventType === 'tournament';
      const eventDateTime = this.convertTimeToDate(formValue.eventDate!, formValue.eventTime!);

      const eventData: any = {
        title: formValue.title!,
        club: formValue.club!,
        eventType: formValue.eventType!,
        dateTime: eventDateTime.toISOString(),
        duration: formValue.duration!,
        maxParticipants: formValue.maxParticipants!,
        description: formValue.description || '',
        location: {
          name: formValue.locationName!,
          address: formValue.locationAddress!,
          courts: isSportsType ? [
            { name: 'Court 1', isAvailable: true },
            { name: 'Court 2', isAvailable: true }
          ] : []
        },
        rsvpDeadline: this.convertDateToEndOfDay(formValue.rsvpDeadline!)
      };

      // Only add sports-specific fields for sports events
      if (isSportsType) {
        eventData.format = formValue.format!;
        eventData.skillLevelRange = {
          min: 1,
          max: 10
        };
      }

      // Update debug info with API request data
      this.debugInfo.step = 'Sending API Request';
      this.debugInfo.apiRequest = {
        endpoint: '/api/events',
        method: 'POST',
        data: { ...eventData }
      };

      this.eventService.createEvent(eventData).subscribe({
        next: async (response) => {
          this.creating = false;
          this.debugInfo.step = 'API Success Response';
          this.debugInfo.apiResponse = response;
          
          if (response.success) {
            this.closeCreateEventModal();
            this.createEventForm.reset();
            this.loadEvents();
            await this.modalService.showAlert('Success', 'Event created successfully!');
            this.showDebugPanel = false; // Hide debug panel on success
          }
        },
        error: async (error) => {
          this.creating = false;
          
          // Capture error info for debug panel
          this.debugInfo.step = 'API Error Response';
          this.debugInfo.apiError = {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            error: error.error,
            headers: error.headers ? this.extractHeaders(error.headers) : {},
            timestamp: new Date().toISOString()
          };
          
          // Handle insufficient coins error specifically
          if (error.status === 402) {
            const errorData = error.error?.data;
            const message = errorData ? 
              `Insufficient club coins for event creation.\n\nRequired: ${errorData.required} coins\nAvailable: ${errorData.available} coins\nShortfall: ${errorData.shortfall} coins\n\nPlease purchase more coins for your club to create events.` :
              'Insufficient club coins for event creation. Please purchase more coins for your club.';
            
            await this.modalService.showAlert('Insufficient Coins', message);
          } else if (error.status === 400 && error.error?.errors) {
            // Handle validation errors
            const validationErrors = error.error.errors;
            let message = 'Please fix the following validation errors:\n\n';
            validationErrors.forEach((err: any) => {
              message += `• ${err.msg}\n`;
            });
            
            await this.modalService.showAlert('Validation Error', message);
          } else {
            await this.modalService.showAlert('Error', error.error?.message || 'Failed to create event');
          }
        }
      });
    }
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

  closeModal(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.showRsvpModal = false;
      this.showEditEvent = false;
    }
  }

  isSportsEvent(): boolean {
    const eventType = this.createEventForm.get('eventType')?.value;
    return eventType === 'sports' || eventType === 'tournament';
  }

  isSportsEventForRsvp(): boolean {
    return this.selectedEvent ? 
      (this.selectedEvent.eventType === 'sports' || this.selectedEvent.eventType === 'tournament') : 
      false;
  }

  onEventTypeChange(): void {
    const eventType = this.createEventForm.get('eventType')?.value;
    const formatControl = this.createEventForm.get('format');
    
    if (eventType === 'sports' || eventType === 'tournament') {
      // Make format required for sports events
      formatControl?.setValidators([Validators.required]);
      formatControl?.setValue('doubles');
    } else {
      // Clear format requirement for social events
      formatControl?.clearValidators();
      formatControl?.setValue('');
    }
    formatControl?.updateValueAndValidity();
  }

  getEventTypeIcon(eventType: string): string {
    switch (eventType) {
      case 'sports': return '🎾';
      case 'social': return '🎉';
      case 'tournament': return '🏆';
      case 'training': return '🏃';
      default: return '📅';
    }
  }



  loadAllEvents(event: MouseEvent): void {
    event.preventDefault();
    this.setFilter('all');
  }

  // Statistics methods
  getTotalEvents(): number {
    return this.events.length;
  }

  getUpcomingEvents(): number {
    const now = new Date();
    return this.events.filter(event => 
      new Date(event.dateTime) > now && event.status === 'published'
    ).length;
  }

  getMyAttendingCount(): number {
    const currentUser = this.authService.currentUser;
    if (!currentUser) return 0;
    
    return this.events.filter(event => {
      const rsvp = this.getUserRsvp(event);
      return rsvp && rsvp.status === 'attending';
    }).length;
  }

  getCompletedEvents(): number {
    return this.events.filter(event => event.status === 'completed').length;
  }

  extractHeaders(headers: any): any {
    const headerObj: any = {};
    if (headers.keys) {
      headers.keys().forEach((key: string) => {
        headerObj[key] = headers.get(key);
      });
    }
    return headerObj;
  }


}