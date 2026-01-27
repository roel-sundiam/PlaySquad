import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ClubService, Club } from '../../services/club.service';
import { MessageService, Message } from '../../services/message.service';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { EventService, Event as ClubEvent, RSVPData } from '../../services/event.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-club-detail',
  template: `
    <div class="club-detail-page" *ngIf="club">
      <app-header></app-header>
      
      <!-- Page Navigation -->
      <div class="page-nav">
        <div class="nav-container">
          <button class="btn-ghost" (click)="router.navigate(['/clubs'])">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
            Back to Clubs
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
        <!-- Hero Section -->
        <div class="hero-section">
          <div class="hero-content">
            <!-- App Logo for Mobile -->
            <div class="app-logo mobile-only">
              <img src="assets/playsquad-logo.png" alt="PlaySquad" />
            </div>
            <!-- Club Avatar for Desktop -->
            <div class="club-avatar desktop-only" [style.background-image]="club.avatar ? 'url(' + club.avatar + ')' : 'none'">
              <span *ngIf="!club.avatar" class="avatar-placeholder">{{ (club.name || 'C').charAt(0).toUpperCase() }}</span>
            </div>
            <div class="club-info">
              <h1>{{ club.name }}</h1>
              <div class="club-meta">
                <span class="club-sport">{{ club.sport | titlecase }}</span>
                <span class="member-badge" *ngIf="isMember">✓ Member</span>
              </div>
              <p class="club-subtitle">📍 {{ club.location.name }}</p>
              <p class="club-description" *ngIf="club.description">{{ club.description }}</p>
            </div>
          </div>
          <div class="hero-actions" *ngIf="!isMember">
            <button class="btn-primary" (click)="joinClub()">
              {{ club.isPrivate ? 'Request to Join' : 'Join Club' }}
            </button>
          </div>
        </div>

        <!-- Statistics Cards -->
        <div class="stats-grid">
          <div class="stat-card members">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ club.memberCount }}</span>
              <span class="stat-label">Members</span>
            </div>
          </div>
          
          <div class="stat-card events">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ club.stats.totalEvents }}</span>
              <span class="stat-label">Events</span>
            </div>
          </div>
          
          <div class="stat-card skill">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ club.settings.minSkillLevel }}-{{ club.settings.maxSkillLevel }}</span>
              <span class="stat-label">Skill Range</span>
            </div>
          </div>
          
          <div class="stat-card matches">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 17l4 4 4-4m-4-5v9"></path>
                <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ club.stats.totalMatches }}</span>
              <span class="stat-label">Matches</span>
            </div>
          </div>
        </div>

        <div class="club-content">
          <!-- Tab Navigation -->
          <div class="tab-navigation" *ngIf="isMember">
            <button
              class="tab-btn"
              [class.active]="activeTab === 'info'"
              (click)="activeTab = 'info'">
              <i class="material-icons">info</i>
              Information
            </button>
            <button
              class="tab-btn"
              [class.active]="activeTab === 'events'"
              (click)="selectEventsTab()">
              <i class="material-icons">event</i>
              Events
            </button>
            <button
              class="tab-btn"
              [class.active]="activeTab === 'chat'"
              (click)="activeTab = 'chat'">
              <i class="material-icons">chat</i>
              Chat
            </button>
            <button
              class="tab-btn"
              [class.active]="activeTab === 'coins'"
              (click)="activeTab = 'coins'"
              *ngIf="isAdminOrOwner">
              <i class="material-icons">account_balance_wallet</i>
              Club Coins
            </button>
          </div>

          <!-- Club Information Tab -->
          <div class="tab-content" *ngIf="activeTab === 'info' || !isMember">
            <div class="content-card">
              <div class="card-header">
                <h2>🏓 Club Information</h2>
              </div>
              <div class="card-content">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">Members</span>
                    <span class="value">{{ club.memberCount }}</span>
                  </div>
                  <div class="info-item hide-on-mobile">
                    <span class="label">Skill Level Range</span>
                    <span class="value">{{ club.settings.minSkillLevel }} - {{ club.settings.maxSkillLevel }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Total Events</span>
                    <span class="value">{{ club.stats.totalEvents }}</span>
                  </div>
                  <div class="info-item hide-on-mobile">
                    <span class="label">Total Matches</span>
                    <span class="value">{{ club.stats.totalMatches }}</span>
                  </div>
                  <div class="info-item" *ngIf="clubCoinBalance !== null">
                    <span class="label">Club Coins</span>
                    <span class="value coin-balance">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="m9 12 2 2 4-4"></path>
                      </svg>
                      {{ formatCoins(clubCoinBalance) }}
                    </span>
                  </div>
                </div>

                <div class="members-section" *ngIf="club.members && club.members.length > 0">
                  <h3>Club Members</h3>
                  <div class="members-list">
                    <div class="list-item member-card" *ngFor="let member of club.members">
                      <div class="member-avatar" [style.background-image]="member.user.avatar ? 'url(' + member.user.avatar + ')' : 'none'">
                        <span *ngIf="!member.user.avatar" class="avatar-placeholder">{{ (member.user.firstName || 'M').charAt(0).toUpperCase() }}</span>
                      </div>
                      <div class="member-info">
                        <span class="member-name">{{ member.user.firstName }} {{ member.user.lastName }}</span>
                        <span class="member-role" *ngIf="member.role !== 'member'">{{ member.role | titlecase }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Events Tab -->
          <div class="tab-content" *ngIf="activeTab === 'events' && isMember">
            <div class="content-card">
              <div class="card-header">
                <h2>📅 Club Events</h2>
              </div>
              <div class="card-content">
                <div class="loading-section" *ngIf="loadingEvents">
                  <p>Loading events...</p>
                </div>
                <div class="events-list" *ngIf="!loadingEvents">
                  <div class="event-card" *ngFor="let event of clubEvents">
                    <div class="event-header">
                      <h3>{{ event.title }}</h3>
                      <span class="event-badge" [class]="event.status">{{ event.status | titlecase }}</span>
                    </div>
                    <p class="event-description" *ngIf="event.description">{{ event.description }}</p>
                    <div class="event-meta">
                      <div class="event-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12,6 12,12 16,14"></polyline>
                        </svg>
                        <span>{{ event.dateTime | date:'MMM d, y h:mm a' }}</span>
                      </div>
                      <div class="event-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>{{ event.location.name }}</span>
                      </div>
                      <div class="event-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>{{ event.attendingCount }} / {{ event.maxParticipants }}</span>
                      </div>
                    </div>
                    <div class="event-rsvp-status" *ngIf="getUserEventRsvp(event) as rsvp">
                      <span class="rsvp-badge" [ngClass]="rsvp.status">
                        {{ getRsvpStatusText(rsvp.status) }}
                      </span>
                    </div>
                    <div class="event-actions">
                      <button
                        class="btn-primary"
                        (click)="openRsvpModal(event)"
                        *ngIf="event.isRsvpOpen && !getUserEventRsvp(event)">
                        RSVP
                      </button>
                      <button
                        class="btn-secondary"
                        (click)="openRsvpModal(event)"
                        *ngIf="event.isRsvpOpen && getUserEventRsvp(event)">
                        Update RSVP
                      </button>
                      <span class="rsvp-closed" *ngIf="!event.isRsvpOpen">RSVP Closed</span>
                    </div>

                    <!-- Attendees List -->
                    <div class="event-attendees" *ngIf="event.attendingCount > 0">
                      <h4>Attendees ({{ event.attendingCount }})</h4>
                      <div class="attendees-list">
                        <div class="attendee-item" *ngFor="let rsvp of getSortedRsvps(event)">
                          <div class="attendee-avatar" [style.background-image]="rsvp.user.avatar ? 'url(' + rsvp.user.avatar + ')' : 'none'">
                            <span *ngIf="!rsvp.user.avatar" class="avatar-placeholder">{{ getInitial(rsvp.user.firstName) }}</span>
                          </div>
                          <div class="attendee-info">
                            <span class="attendee-name">{{ rsvp.user.firstName }} {{ rsvp.user.lastName }}</span>
                            <span class="attendee-status" [ngClass]="rsvp.status">{{ formatRsvpStatus(rsvp.status) }}</span>
                          </div>
                          <div class="attendee-meta">
                            <span class="rsvp-date">{{ rsvp.rsvpedAt | date:'MMM d' }}</span>
                            <span class="skill-level" *ngIf="rsvp.skillLevel">Skill: {{ rsvp.skillLevel }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="empty-state" *ngIf="clubEvents.length === 0">
                    <p>No events scheduled yet.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Chat Tab -->
          <div class="tab-content" *ngIf="activeTab === 'chat' && isMember">
            <div class="content-card">
              <div class="card-header">
                <h2>💬 Club Chat</h2>
              </div>
              <div class="card-content chat-section">
            <div class="chat-container">
              <div class="messages-container" #messagesContainer>
                <div class="message" *ngFor="let message of messages" [class.own-message]="isOwnMessage(message)">
                  <div class="message-header">
                    <div class="user-avatar" [style.background-image]="message.user.avatar ? 'url(' + message.user.avatar + ')' : 'none'">
                      <span *ngIf="!message.user.avatar" class="avatar-placeholder">{{ (message.user.firstName || 'U').charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="message-info">
                      <span class="user-name">{{ message.user.firstName }} {{ message.user.lastName }}</span>
                      <span class="message-time">{{ message.createdAt | date:'short' }}</span>
                    </div>
                  </div>
                  <div class="message-content">
                    <p [innerHTML]="formatMessageContent(message.content)"></p>
                    <div class="message-actions" *ngIf="isOwnMessage(message)">
                      <button class="action-btn" (click)="editMessage(message)" *ngIf="message.type === 'text'">Edit</button>
                      <button class="action-btn delete" (click)="deleteMessage(message)">Delete</button>
                    </div>
                  </div>
                  <div class="message-reactions" *ngIf="message.reactions && message.reactions.length > 0">
                    <span class="reaction" *ngFor="let reaction of getUniqueReactions(message)"
                          (click)="toggleReaction(message, reaction.emoji)">
                      {{ reaction.emoji }} {{ reaction.count }}
                    </span>
                  </div>
                </div>
                <div class="typing-indicator" *ngIf="typingUsers.length > 0">
                  <span>{{ getTypingText() }}</span>
                </div>
              </div>

              <div class="chat-input-container">
                <form [formGroup]="messageForm" (ngSubmit)="sendMessage()">
                  <div class="input-row">
                    <input
                      type="text"
                      formControlName="content"
                      placeholder="Type your message..."
                      class="message-input"
                      (focus)="startTyping()"
                      (blur)="stopTyping()"
                      (keyup)="onTyping()"
                      maxlength="500"
                    >
                    <button type="submit" class="send-btn" [disabled]="messageForm.invalid || sending">
                      {{ sending ? '...' : 'Send' }}
                    </button>
                  </div>
                  <div class="character-count">
                    {{ messageForm.get('content')?.value?.length || 0 }}/500
                  </div>
                </form>
              </div>
            </div>
              </div>
            </div>
          </div>

          <!-- Club Coins Tab -->
          <div class="tab-content" *ngIf="activeTab === 'coins' && isAdminOrOwner && club?.id">
            <app-club-coin-wallet [clubId]="club.id"></app-club-coin-wallet>
          </div>
        </div>

        <!-- RSVP Modal -->
        <div class="modal" *ngIf="showRsvpModal" (click)="closeRsvpModal($event)">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>RSVP to {{ selectedEvent?.title }}</h3>
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

        <!-- Edit Message Modal -->
      <div class="modal" *ngIf="editingMessage" (click)="closeEditModal($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Edit Message</h3>
            <button class="close-btn" (click)="editingMessage = null">×</button>
          </div>
          <form [formGroup]="editForm" (ngSubmit)="saveEditedMessage()">
            <div class="form-group">
              <textarea
                formControlName="content"
                class="form-control"
                rows="3"
                maxlength="500"
                placeholder="Enter your message..."
              ></textarea>
              <div class="character-count">
                {{ editForm.get('content')?.value?.length || 0 }}/500
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="editingMessage = null">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="editForm.invalid || saving">
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
      </main>
    </div>

    <div class="loading" *ngIf="loading">
      <p>Loading club details...</p>
    </div>

    <div class="error" *ngIf="error">
      <p>{{ error }}</p>
      <button class="btn-primary" (click)="router.navigate(['/clubs'])">Back to Clubs</button>
    </div>
  `,
  styles: [`
    /* Global Background - Design Guide Standard */
    .club-detail-page {
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

    .hero-content {
      display: flex;
      align-items: center;
      gap: 24px;
      flex: 1;
    }

    .club-avatar {
      width: 96px;
      height: 96px;
      border-radius: 20px;
      background-size: cover;
      background-position: center;
      background-color: #fb923c;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 2.5rem;
      flex-shrink: 0;
      box-shadow: 0 8px 25px rgba(251, 146, 60, 0.3);
    }

    .app-logo {
      width: 96px;
      height: 96px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      padding: 8px;
    }

    .app-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 12px;
    }

    .mobile-only {
      display: none;
    }

    .desktop-only {
      display: flex;
    }

    .club-info h1 {
      margin: 0 0 12px 0;
      color: #000000;
      font-size: 2.5rem;
      font-weight: 700;
      font-family: 'Poppins', sans-serif;
    }

    .club-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 8px;
    }

    .club-sport {
      color: #fb923c;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .member-badge {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
    }

    .club-subtitle {
      color: #475569;
      font-size: 1rem;
      margin: 0 0 8px 0;
    }

    .club-description {
      color: #475569;
      line-height: 1.6;
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
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
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

    .stat-card.members .stat-icon {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
    }

    .stat-card.events .stat-icon {
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      color: white;
    }

    .stat-card.skill .stat-icon {
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white;
    }

    .stat-card.matches .stat-icon {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
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

    .club-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Tab Navigation - Design Guide Standard */
    .tab-navigation {
      display: flex;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(251, 146, 60, 0.2);
      border-radius: 16px;
      padding: 8px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      gap: 4px;
      margin-bottom: 24px;
    }

    .tab-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 16px;
      border: none;
      background: transparent;
      color: #475569;
      border-radius: 12px;
      cursor: pointer;
      transition: all 200ms ease;
      font-weight: 500;
    }

    .tab-btn:hover {
      background: rgba(251, 146, 60, 0.1);
      color: #ea580c;
      transform: translateY(-1px);
    }

    .tab-btn.active {
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      color: white;
      box-shadow: 0 4px 12px rgba(251, 146, 60, 0.3);
      transform: translateY(-2px);
    }

    .tab-btn .material-icons {
      font-size: 20px;
    }

    /* Content Cards - Design Guide Standard */
    .tab-content {
      margin-bottom: 24px;
    }

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
      margin-bottom: 16px;
    }

    .card-header h2 {
      margin: 0;
      color: #000000;
      font-size: 1.5rem;
      font-weight: 600;
      font-family: 'Poppins', sans-serif;
    }

    .card-content {
      padding: 0 24px 24px 24px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item .label {
      font-size: 0.875rem;
      color: #475569;
      font-weight: 500;
    }

    .info-item .value {
      font-weight: 600;
      color: #1e293b;
      font-size: 1rem;
    }

    .coin-balance {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #fb923c;
      font-weight: 600;
    }

    .coin-balance svg {
      color: #22c55e;
    }

    /* Members Section */
    .members-section h3 {
      margin: 0 0 16px 0;
      color: #1e293b;
      font-weight: 600;
      font-size: 1.125rem;
    }

    .members-list {
      display: grid;
      gap: 12px;
    }

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

    .member-card {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .member-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-size: cover;
      background-position: center;
      background-color: #fb923c;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .member-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .member-name {
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .member-role {
      font-size: 0.875rem;
      color: #fb923c;
      font-weight: 500;
    }

    /* Chat Section Styles */
    .chat-section {
      padding: 0;
    }

    .chat-container {
      height: 500px;
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(251, 146, 60, 0.2);
      border-radius: 12px;
      overflow: hidden;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.3) 100%);
      backdrop-filter: blur(10px);
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: transparent;
    }

    .message {
      margin-bottom: 16px;
      max-width: 80%;
    }

    .message.own-message {
      margin-left: auto;
      text-align: right;
    }

    .message-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .message.own-message .message-header {
      flex-direction: row-reverse;
    }

    .user-avatar {
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
      font-size: 12px;
      flex-shrink: 0;
    }

    .message-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .user-name {
      font-weight: 600;
      color: #333;
      font-size: 0.9em;
    }

    .message-time {
      color: #666;
      font-size: 0.75em;
    }

    .message-content {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      padding: 12px 16px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(251, 146, 60, 0.1);
      position: relative;
    }

    .message.own-message .message-content {
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      color: white;
      border-color: rgba(251, 146, 60, 0.3);
    }

    .message-content p {
      margin: 0;
      line-height: 1.4;
    }

    .message-actions {
      position: absolute;
      top: -8px;
      right: 8px;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: none;
      gap: 4px;
      padding: 4px;
    }

    .message:hover .message-actions {
      display: flex;
    }

    .action-btn {
      background: none;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75em;
      cursor: pointer;
      color: #666;
    }

    .action-btn:hover {
      background: #f0f0f0;
    }

    .action-btn.delete {
      color: #f44336;
    }

    .message-reactions {
      display: flex;
      gap: 4px;
      margin-top: 4px;
      flex-wrap: wrap;
    }

    .reaction {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 0.8em;
      cursor: pointer;
      border: 1px solid transparent;
    }

    .reaction:hover {
      border-color: #00C853;
    }

    .typing-indicator {
      padding: 8px;
      color: #666;
      font-style: italic;
      font-size: 0.9em;
    }

    .chat-input-container {
      border-top: 1px solid rgba(251, 146, 60, 0.2);
      padding: 16px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
    }

    .input-row {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .message-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid rgba(251, 146, 60, 0.3);
      border-radius: 20px;
      font-size: 14px;
      outline: none;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
    }

    .message-input:focus {
      border-color: #fb923c;
      box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.1);
    }

    .send-btn {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 20px;
      cursor: pointer;
      font-weight: 600;
      transition: all 200ms ease;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .send-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }

    .send-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .character-count {
      text-align: right;
      font-size: 0.75em;
      color: #666;
      margin-top: 4px;
    }

    /* Events Tab Styles */
    .events-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .event-card {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
      border: 1px solid rgba(251, 146, 60, 0.3);
      border-radius: 12px;
      padding: 20px;
      transition: all 200ms ease;
    }

    .event-card:hover {
      border-color: rgba(251, 146, 60, 0.6);
      box-shadow: 0 8px 25px rgba(251, 146, 60, 0.2);
      transform: translateY(-2px);
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .event-header h3 {
      margin: 0;
      color: #1e293b;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .event-description {
      margin: 12px 0;
      color: #475569;
      font-size: 0.875rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .event-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .event-badge.published {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
    }

    .event-badge.ongoing {
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      color: white;
    }

    .event-badge.completed {
      background: linear-gradient(135deg, #64748b, #475569);
      color: white;
    }

    .event-badge.cancelled {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
    }

    .event-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 12px;
    }

    .event-detail {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #475569;
      font-size: 0.875rem;
    }

    .event-detail svg {
      color: #fb923c;
    }

    .event-rsvp-status {
      margin-bottom: 12px;
    }

    .rsvp-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .rsvp-badge.attending {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
    }

    .rsvp-badge.maybe {
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      color: white;
    }

    .rsvp-badge.declined {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
    }

    .event-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .rsvp-closed {
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #64748b;
    }

    .loading-section {
      text-align: center;
      padding: 40px 20px;
      color: #64748b;
    }

    /* RSVP Form Styles */
    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid rgba(251, 146, 60, 0.3);
      border-radius: 8px;
      cursor: pointer;
      transition: all 200ms ease;
    }

    .radio-option:hover {
      border-color: rgba(251, 146, 60, 0.6);
      background: rgba(251, 146, 60, 0.05);
    }

    .radio-option input[type="radio"] {
      margin: 0;
      cursor: pointer;
    }

    .radio-option input[type="radio"]:checked + span {
      color: #fb923c;
      font-weight: 600;
    }

    /* Attendees Section Styles */
    .event-attendees {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(251, 146, 60, 0.2);
    }

    .event-attendees h4 {
      margin: 0 0 16px 0;
      color: #1e293b;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .attendees-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .attendee-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(251, 146, 60, 0.15);
      border-radius: 8px;
      transition: all 200ms ease;
    }

    .attendee-item:hover {
      background: rgba(255, 255, 255, 0.9);
      border-color: rgba(251, 146, 60, 0.3);
      transform: translateX(4px);
    }

    .attendee-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-size: cover;
      background-position: center;
      background-color: #fb923c;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 1rem;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(251, 146, 60, 0.3);
    }

    .attendee-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .attendee-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
    }

    .attendee-status {
      font-size: 0.75rem;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 8px;
      display: inline-block;
      width: fit-content;
    }

    .attendee-status.attending {
      background: rgba(34, 197, 94, 0.15);
      color: #16a34a;
    }

    .attendee-status.maybe {
      background: rgba(251, 146, 60, 0.15);
      color: #ea580c;
    }

    .attendee-status.declined {
      background: rgba(239, 68, 68, 0.15);
      color: #dc2626;
    }

    .attendee-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      font-size: 0.75rem;
      color: #64748b;
    }

    .rsvp-date {
      font-weight: 500;
    }

    .skill-level {
      background: rgba(59, 130, 246, 0.1);
      color: #2563eb;
      padding: 2px 8px;
      border-radius: 8px;
      font-weight: 600;
    }

    .loading, .error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 50vh;
      text-align: center;
      color: #666;
    }

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
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 20px 16px 20px;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h3 {
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
      padding: 20px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
      box-sizing: border-box;
      font-family: inherit;
      resize: vertical;
    }

    .form-control:focus {
      outline: none;
      border-color: #00C853;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    /* Button Styles - Design Guide Standard */
    .btn-primary, .btn-secondary {
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
        text-align: center;
      }

      .hero-content {
        flex-direction: column;
        text-align: center;
        width: 100%;
      }

      .club-info h1 {
        font-size: 2rem;
      }

      .hero-actions {
        width: 100%;
        justify-content: center;
      }

      .stats-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
      }

      .stat-card {
        min-height: 90px;
        padding: 0.75rem;
        flex-direction: column;
        text-align: center;
        gap: 8px;
      }

      .stat-icon {
        width: 32px;
        height: 32px;
      }

      .stat-number {
        font-size: 1.25rem;
      }

      .stat-label {
        font-size: 0.75rem;
      }

      .info-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }

      .hide-on-mobile {
        display: none;
      }

      .info-item {
        text-align: center;
      }

      .info-item .label {
        font-size: 0.75rem;
        margin-bottom: 4px;
      }

      .info-item .value {
        font-size: 0.875rem;
        font-weight: 600;
      }

      .mobile-only {
        display: flex;
      }

      .desktop-only {
        display: none;
      }

      .chat-container {
        height: 400px;
      }

      .message {
        max-width: 95%;
      }

      .tab-btn {
        font-size: 0.875rem;
        padding: 10px 12px;
      }

      .tab-btn .material-icons {
        font-size: 18px;
      }

      .card-header {
        padding: 16px 16px 0 16px;
      }

      .card-content {
        padding: 0 16px 16px 16px;
      }

      .attendee-item {
        flex-wrap: wrap;
        padding: 10px;
      }

      .attendee-avatar {
        width: 36px;
        height: 36px;
        font-size: 0.875rem;
      }

      .attendee-info {
        flex: 1;
        min-width: 0;
      }

      .attendee-name {
        font-size: 0.813rem;
      }

      .attendee-meta {
        width: 100%;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
      }
    }

    @media (max-width: 480px) {
      .main-content {
        margin: 8px;
        padding: 16px 12px;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
      }

      .stat-card {
        min-height: 80px;
        padding: 0.5rem;
        gap: 6px;
      }

      .stat-icon {
        width: 28px;
        height: 28px;
      }

      .stat-number {
        font-size: 1.125rem;
      }

      .stat-label {
        font-size: 0.7rem;
      }

      .hero-actions .btn-primary {
        width: 100%;
      }

      .tab-navigation {
        flex-direction: row;
        gap: 4px;
        padding: 6px;
      }

      .tab-btn {
        flex: 1;
        font-size: 0.75rem;
        padding: 8px 6px;
        gap: 4px;
      }

      .tab-btn .material-icons {
        font-size: 16px;
      }
    }
  `]
})
export class ClubDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  club: Club | null = null;
  messages: Message[] = [];
  typingUsers: string[] = [];
  loading = true;
  error = '';
  editingMessage: Message | null = null;
  sending = false;
  saving = false;
  activeTab = 'info';
  clubCoinBalance: number | null = null;

  // Events tab properties
  clubEvents: ClubEvent[] = [];
  loadingEvents = false;
  showRsvpModal = false;
  selectedEvent: ClubEvent | null = null;
  submittingRsvp = false;
  skillLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  messageForm = this.fb.group({
    content: ['', [Validators.required, Validators.maxLength(500)]]
  });

  editForm = this.fb.group({
    content: ['', [Validators.required, Validators.maxLength(500)]]
  });

  rsvpForm = this.fb.group({
    status: ['attending', [Validators.required]],
    skillLevel: [''],
    preferredFormat: ['any'],
    notes: ['']
  });

  private typingTimer: any;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private clubService: ClubService,
    private messageService: MessageService,
    private authService: AuthService,
    private socketService: SocketService,
    private eventService: EventService,
    private modalService: ModalService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    console.log('🚀 ClubDetailComponent ngOnInit called');
    const clubId = this.route.snapshot.paramMap.get('id');
    console.log('🔍 Route club ID:', clubId);

    // Check for tab query parameter
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam === 'events') {
      this.activeTab = 'events';
      console.log('📅 Opening Events tab from query parameter');
    }

    if (clubId) {
      console.log('✅ Valid club ID, starting load sequence...');
      this.loadClubDetails(clubId);
      // Note: loadMessages and setupSocketListeners will be called after club details load
      this.setupSocketListeners(clubId);

      // Load events if Events tab is pre-selected
      if (this.activeTab === 'events') {
        this.loadClubEvents(clubId);
      }
    } else {
      console.log('❌ Invalid club ID');
      this.error = 'Invalid club ID';
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.club) {
      this.socketService.leaveClub(this.club.id);
    }

    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
  }

  private loadClubDetails(clubId: string): void {
    console.log('🏢 Loading club details for:', clubId);
    this.clubService.getClub(clubId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('🏢 Club details response:', response);
          if (response.success && response.data) {
            this.club = response.data;
            console.log('✅ Club loaded:', this.club);
            console.log('🔍 Club ID value:', this.club?.id);
            console.log('🔍 Club ID type:', typeof this.club?.id);
            
            // Load club coin balance
            this.loadClubCoinBalance(clubId);
            
            console.log('🔍 After loading club, checking isMember...');
            if (this.isMember) {
              console.log('✅ User is member, joining socket room and loading messages');
              this.socketService.joinClub(clubId);
              this.loadMessages(clubId); // Load messages AFTER club is loaded and membership confirmed
            } else {
              console.log('❌ User is not member, not joining socket room or loading messages');
            }
          } else {
            console.log('❌ Club not found in response');
            this.error = 'Club not found';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error loading club details:', error);
          this.error = error.error?.message || 'Failed to load club details';
          this.loading = false;
        }
      });
  }

  private loadMessages(clubId: string): void {
    console.log('🔍 loadMessages called with clubId:', clubId);
    console.log('🔍 isMember check result:', this.isMember);
    console.log('🔍 Current user:', this.authService.currentUser);
    console.log('🔍 Club object:', this.club);
    
    if (!this.isMember) {
      console.log('❌ Not a member, skipping message load');
      return;
    }

    console.log('✅ Member check passed, loading messages...');
    this.messageService.getClubMessages(clubId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('📨 Message API response:', response);
          if (response.success && response.data) {
            console.log('✅ Messages received:', response.data.messages.length);
            console.log('📋 Message details:', response.data.messages);
            this.messages = response.data.messages;
            this.scrollToBottom();
          } else {
            console.log('❌ No message data in response');
          }
        },
        error: (error) => {
          console.error('❌ Failed to load messages:', error);
        }
      });
  }

  private setupSocketListeners(clubId: string): void {
    this.socketService.onNewMessage()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data.clubId === clubId) {
          this.messages.push(data.message);
          this.scrollToBottom();
        }
      });

    this.socketService.onUserTyping()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data.clubId === clubId) {
          if (data.isTyping) {
            if (!this.typingUsers.includes(data.socketId)) {
              this.typingUsers.push(data.socketId);
            }
          } else {
            this.typingUsers = this.typingUsers.filter(id => id !== data.socketId);
          }
        }
      });
  }

  get isMember(): boolean {
    console.log('🔍 isMember check starting...');
    
    if (!this.club) {
      console.log('❌ No club object');
      return false;
    }
    
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      console.log('❌ No current user');
      return false;
    }
    
    console.log('🔍 Current user clubs array:', currentUser.clubs);
    console.log('🔍 Target club ID (this.club.id):', this.club.id);
    
    const result = currentUser.clubs.some(userClub => {
      // Handle both populated and non-populated club references
      const clubId = typeof userClub.club === 'string' ? userClub.club : userClub.club?._id || userClub.club?.id;
      // Convert both to strings for comparison since ObjectId objects don't equal strings
      const clubIdStr = clubId?.toString();
      const thisClubIdStr = this.club!.id?.toString();
      
      console.log(`🔍 Comparing user club ${clubIdStr} with target ${thisClubIdStr}`);
      const match = clubIdStr === thisClubIdStr;
      console.log(`🔍 Match result: ${match}`);
      
      return match;
    });
    
    console.log('🔍 Final isMember result:', result);
    return result;
  }

  get isAdminOrOwner(): boolean {
    if (!this.club || !this.isMember) {
      return false;
    }
    
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      return false;
    }
    
    // Check if user is the club owner
    if (this.club.owner.id === currentUser.id) {
      console.log('🔍 User is club owner');
      return true;
    }
    
    // Check if user has admin role in this club
    const userClub = currentUser.clubs.find(userClub => {
      const clubId = typeof userClub.club === 'string' ? userClub.club : userClub.club?._id || userClub.club?.id;
      return clubId?.toString() === this.club!.id?.toString();
    });
    
    const isAdmin = userClub?.role === 'admin';
    console.log('🔍 User club role:', userClub?.role, 'isAdmin:', isAdmin);
    
    return isAdmin;
  }

  isOwnMessage(message: Message): boolean {
    const currentUser = this.authService.currentUser;
    return currentUser ? message.user._id === currentUser.id : false;
  }

  sendMessage(): void {
    if (!this.club || !this.messageForm.valid || this.sending) return;

    this.sending = true;
    const content = this.messageForm.get('content')?.value?.trim();

    if (content) {
      this.messageService.sendMessage(this.club.id, content)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.messageForm.reset();
              this.stopTyping();
            }
            this.sending = false;
          },
          error: (error) => {
            console.error('Failed to send message:', error);
            this.sending = false;
          }
        });
    } else {
      this.sending = false;
    }
  }

  editMessage(message: Message): void {
    this.editingMessage = message;
    this.editForm.patchValue({ content: message.content });
  }

  saveEditedMessage(): void {
    if (!this.editingMessage || !this.editForm.valid || this.saving) return;

    this.saving = true;
    const content = this.editForm.get('content')?.value?.trim();

    if (content) {
      this.messageService.editMessage(this.editingMessage._id, content)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              const index = this.messages.findIndex(m => m._id === this.editingMessage!._id);
              if (index !== -1) {
                this.messages[index] = response.data;
              }
              this.editingMessage = null;
            }
            this.saving = false;
          },
          error: (error) => {
            console.error('Failed to edit message:', error);
            this.saving = false;
          }
        });
    } else {
      this.saving = false;
    }
  }

  deleteMessage(message: Message): void {
    if (confirm('Are you sure you want to delete this message?')) {
      this.messageService.deleteMessage(message._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.messages = this.messages.filter(m => m._id !== message._id);
            }
          },
          error: (error) => {
            console.error('Failed to delete message:', error);
          }
        });
    }
  }

  toggleReaction(message: Message, emoji: string): void {
    const currentUser = this.authService.currentUser;
    if (!currentUser) return;

    const userReaction = message.reactions?.find(r =>
      r.user === currentUser.id && r.emoji === emoji
    );

    if (userReaction) {
      this.messageService.removeReaction(message._id, emoji)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success && message.reactions) {
              message.reactions = message.reactions.filter(r =>
                !(r.user === currentUser.id && r.emoji === emoji)
              );
            }
          },
          error: (error) => {
            console.error('Failed to remove reaction:', error);
          }
        });
    } else {
      this.messageService.addReaction(message._id, emoji)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              if (!message.reactions) {
                message.reactions = [];
              }
              message.reactions.push({
                user: currentUser.id,
                emoji,
                createdAt: new Date()
              });
            }
          },
          error: (error) => {
            console.error('Failed to add reaction:', error);
          }
        });
    }
  }

  getUniqueReactions(message: Message): { emoji: string; count: number }[] {
    if (!message.reactions) return [];

    const reactionCounts: { [emoji: string]: number } = {};
    message.reactions.forEach(reaction => {
      reactionCounts[reaction.emoji] = (reactionCounts[reaction.emoji] || 0) + 1;
    });

    return Object.entries(reactionCounts).map(([emoji, count]) => ({ emoji, count }));
  }

  startTyping(): void {
    if (this.club) {
      this.socketService.startTyping(this.club.id);
    }
  }

  stopTyping(): void {
    if (this.club) {
      this.socketService.stopTyping(this.club.id);
    }
  }

  onTyping(): void {
    this.startTyping();

    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    this.typingTimer = setTimeout(() => {
      this.stopTyping();
    }, 1000);
  }

  getTypingText(): string {
    if (this.typingUsers.length === 0) return '';
    if (this.typingUsers.length === 1) return 'Someone is typing...';
    return `${this.typingUsers.length} people are typing...`;
  }

  formatMessageContent(content: string): string {
    // Simple URL detection and linking
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector('.messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  closeEditModal(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.editingMessage = null;
    }
  }

  joinClub(): void {
    if (!this.club) return;
    // Implementation would be similar to the clubs list component
    console.log('Join club functionality to be implemented');
  }

  private loadClubCoinBalance(clubId: string): void {
    this.clubService.getClubCoinWallet(clubId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.clubCoinBalance = response.data.balance;
        }
      },
      error: (error) => {
        console.error('Error loading club coin balance:', error);
        // Don't show error to user, just hide the coin balance
        this.clubCoinBalance = null;
      }
    });
  }

  formatCoins(amount: number): string {
    return amount.toLocaleString();
  }

  // Events tab methods
  selectEventsTab(): void {
    this.activeTab = 'events';
    if (this.clubEvents.length === 0 && this.club) {
      this.loadClubEvents(this.club.id);
    }
  }

  private loadClubEvents(clubId: string): void {
    this.loadingEvents = true;
    this.eventService.getEvents({ club: clubId }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.clubEvents = response.data;
        }
        this.loadingEvents = false;
      },
      error: (error) => {
        console.error('Error loading club events:', error);
        this.loadingEvents = false;
      }
    });
  }

  getUserEventRsvp(event: ClubEvent): any {
    const currentUser = this.authService.currentUser;
    if (!currentUser) return null;
    return event.rsvps?.find(rsvp => rsvp.user.id === currentUser.id);
  }

  getRsvpStatusText(status: string): string {
    switch (status) {
      case 'attending':
        return '✓ You\'re attending';
      case 'maybe':
        return '? You might attend';
      case 'declined':
        return '✗ You declined';
      default:
        return '';
    }
  }

  getSortedRsvps(event: ClubEvent): any[] {
    if (!event.rsvps || event.rsvps.length === 0) return [];
    // Filter only attending RSVPs and sort by rsvpedAt date in ascending order (earliest first)
    return [...event.rsvps]
      .filter(rsvp => rsvp.status === 'attending')
      .sort((a, b) => {
        const dateA = new Date(a.rsvpedAt).getTime();
        const dateB = new Date(b.rsvpedAt).getTime();
        return dateA - dateB;
      });
  }

  formatRsvpStatus(status: string): string {
    switch (status) {
      case 'attending':
        return 'Attending';
      case 'maybe':
        return 'Maybe';
      case 'declined':
        return 'Declined';
      default:
        return status;
    }
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  openRsvpModal(event: ClubEvent): void {
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

    // Pre-fill form with existing RSVP if exists
    const existingRsvp = this.getUserEventRsvp(event);
    if (existingRsvp) {
      this.rsvpForm.patchValue({
        status: existingRsvp.status,
        skillLevel: existingRsvp.skillLevel ? existingRsvp.skillLevel.toString() : '',
        preferredFormat: existingRsvp.preferredFormat || 'any',
        notes: existingRsvp.notes || ''
      });
    } else {
      // Pre-fill with user's default values
      const currentUser = this.authService.currentUser;
      if (currentUser) {
        this.rsvpForm.patchValue({
          status: 'attending',
          skillLevel: currentUser.skillLevel?.toString() || '',
          preferredFormat: currentUser.preferredFormat || 'any',
          notes: ''
        });
      }
    }
  }

  onRsvp(): void {
    if (this.rsvpForm.valid && this.selectedEvent) {
      this.submittingRsvp = true;

      const isSportsEvent = this.selectedEvent.eventType === 'sports' || this.selectedEvent.eventType === 'tournament';

      const rsvpData: RSVPData = {
        status: this.rsvpForm.value.status as 'attending' | 'maybe' | 'declined',
        notes: this.rsvpForm.value.notes || ''
      };

      // Only include sports-specific fields for sports events
      if (isSportsEvent && this.rsvpForm.value.skillLevel) {
        rsvpData.skillLevel = parseInt(this.rsvpForm.value.skillLevel);
      }
      if (isSportsEvent && this.rsvpForm.value.preferredFormat) {
        rsvpData.preferredFormat = this.rsvpForm.value.preferredFormat as 'singles' | 'doubles' | 'mixed' | 'any';
      }

      this.eventService.rsvpToEvent(this.selectedEvent.id, rsvpData).subscribe({
        next: async (response) => {
          this.submittingRsvp = false;
          if (response.success) {
            this.showRsvpModal = false;
            // Reload events to show updated RSVP
            if (this.club) {
              this.loadClubEvents(this.club.id);
            }
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

  isSportsEventForRsvp(): boolean {
    if (!this.selectedEvent) return false;
    return this.selectedEvent.eventType === 'sports' || this.selectedEvent.eventType === 'tournament';
  }

  closeRsvpModal(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.showRsvpModal = false;
    }
  }
}