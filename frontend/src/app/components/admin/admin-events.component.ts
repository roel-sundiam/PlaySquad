import { Component, OnInit } from '@angular/core';
import { AdminService, AdminEvent } from '../../services/admin.service';

@Component({
  selector: 'app-admin-events',
  template: `
    <!-- Navigation Header (Required by Design Guide) -->
    <app-header></app-header>

    <!-- Main Content -->
    <div class="dashboard-layout">
      <div class="main-content">
        <!-- Header Section -->
        <div class="page-header">
          <div class="header-content">
            <h1 class="page-title">Events Management</h1>
            <div class="header-actions">
              <select [(ngModel)]="statusFilter" (change)="loadEvents()" class="filter-select">
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select [(ngModel)]="dateRangeFilter" (change)="loadEvents()" class="filter-select">
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="this_week">This Week</option>
              </select>
              <button class="btn btn-primary" (click)="refreshEvents()" [disabled]="loading">
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
            <p>Loading events data...</p>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && events.length === 0" class="empty-state">
          <div class="empty-content">
            <i class="material-icons">event_busy</i>
            <h3>No events found</h3>
            <p>{{ statusFilter || dateRangeFilter !== 'all' ? 'Try adjusting your filters' : 'No events have been created yet' }}</p>
          </div>
        </div>

        <!-- Statistics Section -->
        <div *ngIf="!loading && events.length > 0" class="stats-section">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <i class="material-icons">event</i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ pagination.total | number }}</div>
                <div class="stat-label">Total Events</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="material-icons">people</i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ getTotalAttending() | number }}</div>
                <div class="stat-label">Total Attending</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="material-icons">trending_up</i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ getAverageAttendance() | number }}%</div>
                <div class="stat-label">Avg Fill Rate</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="material-icons">schedule</i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ getUpcomingEvents() | number }}</div>
                <div class="stat-label">Upcoming Events</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Events Section -->
        <div *ngIf="!loading && events.length > 0" class="events-section">
          <div class="events-grid">
            <div *ngFor="let event of events" class="event-card">
              <!-- Event Header -->
              <div class="event-header">
                <div class="event-title-section">
                  <h3 class="event-title">{{ event.title }}</h3>
                  <div class="event-badges">
                    <span class="event-type-badge" [class]="'type-' + event.eventType">
                      {{ event.eventType | titlecase }}
                    </span>
                    <span class="status-badge" [class]="'status-' + event.status">
                      {{ event.status | titlecase }}
                    </span>
                  </div>
                </div>
                <div class="event-id">#{{ event._id.slice(-6) }}</div>
              </div>

              <!-- Event Description -->
              <div class="event-description" *ngIf="event.description">
                {{ event.description }}
              </div>

              <!-- Club & Organizer Info -->
              <div class="event-club-info">
                <div class="club-section">
                  <i class="material-icons">groups</i>
                  <div class="club-details">
                    <div class="club-name">{{ event.club.name }}</div>
                    <div class="club-id">#{{ event.club._id.slice(-6) }}</div>
                  </div>
                </div>
                <div class="organizer-section">
                  <i class="material-icons">person</i>
                  <div class="organizer-details">
                    <div class="organizer-name">{{ event.organizer.firstName }} {{ event.organizer.lastName }}</div>
                    <div class="organizer-email">{{ event.organizer.email }}</div>
                  </div>
                </div>
              </div>

              <!-- Schedule Information -->
              <div class="event-schedule">
                <div class="schedule-item">
                  <i class="material-icons">event</i>
                  <div class="schedule-details">
                    <div class="schedule-date">{{ formatDate(event.dateTime) }}</div>
                    <div class="schedule-time">{{ formatTime(event.dateTime) }}</div>
                  </div>
                </div>
                <div class="duration-item">
                  <i class="material-icons">timer</i>
                  <span class="duration-text">{{ event.duration }} minutes</span>
                </div>
              </div>

              <!-- Attendance Section -->
              <div class="event-attendance">
                <div class="attendance-header">
                  <i class="material-icons">people</i>
                  <h4>Attendance ({{ event.totalRsvps }})</h4>
                  <button 
                    class="toggle-attendees-btn"
                    (click)="toggleAttendeesView(event._id)"
                    [class.expanded]="expandedEvents.has(event._id)"
                    *ngIf="event.totalRsvps > 0">
                    <i class="material-icons">{{ expandedEvents.has(event._id) ? 'expand_less' : 'expand_more' }}</i>
                  </button>
                </div>
                <div class="attendance-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="(event.attendingCount / event.maxParticipants) * 100"></div>
                  </div>
                  <div class="capacity-text">
                    {{ event.attendingCount }}/{{ event.maxParticipants }} participants
                  </div>
                </div>
                <div class="attendance-breakdown">
                  <div class="attendance-item attending">
                    <span class="count">{{ event.attendingCount }}</span>
                    <span class="label">Attending</span>
                  </div>
                  <div class="attendance-item maybe" *ngIf="event.maybeCount > 0">
                    <span class="count">{{ event.maybeCount }}</span>
                    <span class="label">Maybe</span>
                  </div>
                  <div class="attendance-item declined" *ngIf="event.declinedCount > 0">
                    <span class="count">{{ event.declinedCount }}</span>
                    <span class="label">Declined</span>
                  </div>
                </div>

                <!-- Expandable Attendee List -->
                <div class="attendees-list" [class.expanded]="expandedEvents.has(event._id)" *ngIf="event.rsvps && event.rsvps.length > 0">
                  <div *ngFor="let rsvp of event.rsvps" class="attendee-item">
                    <div class="attendee-avatar">
                      <span>{{ getAttendeeInitials(rsvp) }}</span>
                    </div>
                    <div class="attendee-info">
                      <div class="attendee-name">{{ rsvp.user.firstName }} {{ rsvp.user.lastName }}</div>
                      <div class="attendee-details">
                        <span class="attendee-status" [class]="'status-' + rsvp.status">{{ rsvp.status | titlecase }}</span>
                        <span class="rsvp-date">RSVP'd {{ formatDate(rsvp.rsvpedAt) }}</span>
                      </div>
                    </div>
                    <div class="skill-level" *ngIf="rsvp.skillLevel">
                      Skill: {{ rsvp.skillLevel }}/10
                    </div>
                  </div>
                </div>
              </div>

              <!-- Event Footer -->
              <div class="event-footer">
                <span class="created-date">Created {{ formatDate(event.createdAt) }}</span>
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
                <span class="total-text">({{ pagination.total }} total events)</span>
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
            <button class="btn btn-primary" (click)="refreshEvents()">
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

    /* Events Section */
    .events-section {
      padding: 2rem;
      background: rgba(255, 255, 255, 0.3);
    }

    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    /* Event Cards (Design Guide Pattern) */
    .event-card {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.08) 0%, rgba(255, 255, 255, 0.2) 100%);
      border: 1px solid rgba(251, 146, 60, 0.2);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .event-card:hover {
      border-color: rgba(251, 146, 60, 0.8);
      box-shadow: 0 8px 25px rgba(251, 146, 60, 0.2);
      transform: translateY(-2px);
    }

    .event-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(251, 146, 60, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .event-title {
      color: #000000;
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      font-family: 'Poppins', sans-serif;
    }

    .event-badges {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .event-type-badge, .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      backdrop-filter: blur(10px);
    }

    .type-sports { background: rgba(59, 130, 246, 0.2); color: #1e40af; border: 1px solid rgba(59, 130, 246, 0.3); }
    .type-social { background: rgba(34, 197, 94, 0.2); color: #16a34a; border: 1px solid rgba(34, 197, 94, 0.3); }
    .type-tournament { background: rgba(245, 158, 11, 0.2); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3); }
    .type-training { background: rgba(139, 69, 19, 0.2); color: #7c3aed; border: 1px solid rgba(139, 69, 19, 0.3); }

    .status-draft { background: rgba(107, 114, 128, 0.2); color: #64748b; border: 1px solid rgba(107, 114, 128, 0.3); }
    .status-published { background: rgba(59, 130, 246, 0.2); color: #1e40af; border: 1px solid rgba(59, 130, 246, 0.3); }
    .status-ongoing { background: rgba(245, 158, 11, 0.2); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3); }
    .status-completed { background: rgba(34, 197, 94, 0.2); color: #16a34a; border: 1px solid rgba(34, 197, 94, 0.3); }
    .status-cancelled { background: rgba(220, 38, 38, 0.2); color: #dc2626; border: 1px solid rgba(220, 38, 38, 0.3); }

    .event-id {
      font-family: 'Courier New', monospace;
      background: rgba(251, 146, 60, 0.1);
      border: 1px solid rgba(251, 146, 60, 0.3);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      color: #fb923c;
      font-weight: 600;
    }

    .event-description {
      padding: 0 1.5rem 1rem 1.5rem;
      color: #475569;
      line-height: 1.5;
      font-size: 0.95rem;
    }

    .event-club-info {
      padding: 0 1.5rem 1rem 1.5rem;
    }

    .club-section, .organizer-section {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .club-section .material-icons, .organizer-section .material-icons {
      color: #fb923c;
      font-size: 20px;
      margin-top: 2px;
    }

    .club-name, .organizer-name {
      color: #1e293b;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .club-id, .organizer-email {
      color: #475569;
      font-size: 0.875rem;
    }

    .club-id {
      font-family: 'Courier New', monospace;
    }

    .event-schedule {
      padding: 1rem 1.5rem;
      background: rgba(251, 146, 60, 0.05);
      border-top: 1px solid rgba(251, 146, 60, 0.1);
      border-bottom: 1px solid rgba(251, 146, 60, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .schedule-item, .duration-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .schedule-item .material-icons, .duration-item .material-icons {
      color: #fb923c;
      font-size: 20px;
    }

    .schedule-date {
      color: #1e293b;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .schedule-time {
      color: #475569;
      font-size: 0.85rem;
    }

    .duration-text {
      color: #1e293b;
      font-weight: 500;
      font-size: 0.9rem;
    }

    /* Event Attendance */
    .event-attendance {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(251, 146, 60, 0.1);
    }

    .attendance-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .attendance-header .material-icons {
      color: #fb923c;
    }

    .attendance-header h4 {
      color: #000000;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .toggle-attendees-btn {
      background: rgba(251, 146, 60, 0.1);
      border: 1px solid rgba(251, 146, 60, 0.3);
      border-radius: 8px;
      padding: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .toggle-attendees-btn:hover {
      background: rgba(251, 146, 60, 0.2);
      transform: scale(1.05);
    }

    .toggle-attendees-btn .material-icons {
      color: #fb923c;
    }

    .attendance-progress {
      margin-bottom: 1rem;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: rgba(251, 146, 60, 0.1);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      transition: width 0.3s ease;
    }

    .capacity-text {
      color: #475569;
      font-size: 0.875rem;
      text-align: center;
    }

    .attendance-breakdown {
      display: flex;
      gap: 1rem;
      justify-content: space-around;
    }

    .attendance-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .attendance-item .count {
      font-weight: 700;
      font-size: 1.1rem;
    }

    .attendance-item.attending .count {
      color: #16a34a;
    }

    .attendance-item.maybe .count {
      color: #d97706;
    }

    .attendance-item.declined .count {
      color: #dc2626;
    }

    .attendance-item .label {
      color: #475569;
      font-size: 0.8rem;
    }

    /* Attendees List */
    .attendees-list {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
      margin-top: 1rem;
    }

    .attendees-list.expanded {
      max-height: 600px;
    }

    .attendee-item {
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

    .attendee-item:hover {
      border-color: rgba(251, 146, 60, 0.8);
      box-shadow: 0 4px 12px rgba(251, 146, 60, 0.15);
    }

    .attendee-avatar {
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

    .attendee-info {
      flex: 1;
    }

    .attendee-name {
      color: #1e293b;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .attendee-details {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .attendee-status {
      padding: 0.125rem 0.5rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .attendee-status.status-attending { 
      background: rgba(34, 197, 94, 0.2); 
      color: #16a34a; 
    }

    .attendee-status.status-maybe { 
      background: rgba(245, 158, 11, 0.2); 
      color: #d97706; 
    }

    .attendee-status.status-declined { 
      background: rgba(220, 38, 38, 0.2); 
      color: #dc2626; 
    }

    .rsvp-date {
      color: #475569;
      font-size: 0.875rem;
    }

    .skill-level {
      color: #6b7280;
      font-size: 0.8rem;
      font-weight: 500;
      background: rgba(251, 146, 60, 0.1);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    /* Event Footer */
    .event-footer {
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
      
      .events-grid {
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

      .events-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .stats-section, .events-section, .pagination-section {
        padding: 1rem;
      }

      .event-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .event-schedule {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .attendance-breakdown {
        flex-direction: column;
        gap: 0.5rem;
        align-items: center;
      }

      .pagination-container {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `]
})
export class AdminEventsComponent implements OnInit {
  events: AdminEvent[] = [];
  loading = false;
  error: string | null = null;
  
  // Filters and pagination
  statusFilter = '';
  dateRangeFilter = 'all';
  currentPage = 1;
  pageSize = 20;
  
  pagination = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  };

  // UI state
  expandedEvents = new Set<string>();

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;
    this.error = null;

    const params = {
      page: this.currentPage,
      limit: this.pageSize,
      status: this.statusFilter,
      dateRange: this.dateRangeFilter
    };

    this.adminService.getEvents(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.events = response.data;
          this.pagination = (response as any).pagination || this.pagination;
        } else {
          this.error = 'Failed to load events';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.error = 'Failed to load events';
        this.loading = false;
      }
    });
  }

  refreshEvents(): void {
    this.loadEvents();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.currentPage = page;
      this.loadEvents();
    }
  }

  getTotalAttending(): number {
    return this.events.reduce((total, event) => total + event.attendingCount, 0);
  }

  getAverageAttendance(): number {
    if (this.events.length === 0) return 0;
    const totalFillRate = this.events.reduce((total, event) => {
      return total + (event.attendingCount / event.maxParticipants);
    }, 0);
    return Math.round((totalFillRate / this.events.length) * 100);
  }

  getUpcomingEvents(): number {
    const now = new Date();
    return this.events.filter(event => new Date(event.dateTime) > now).length;
  }

  toggleAttendeesView(eventId: string): void {
    if (this.expandedEvents.has(eventId)) {
      this.expandedEvents.delete(eventId);
    } else {
      this.expandedEvents.add(eventId);
    }
  }

  getAttendeeInitials(rsvp: any): string {
    const firstName = rsvp.user?.firstName || '';
    const lastName = rsvp.user?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(date: string | Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateShort(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
}