import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface Event {
  id: string;
  title: string;
  description?: string;
  club: {
    id: string;
    name: string;
    avatar?: string;
    location: any;
    sport: string;
  };
  organizer: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  dateTime: string;
  duration: number;
  location: {
    name: string;
    address: string;
    courts: Court[];
  };
  eventType: 'sports' | 'social' | 'tournament' | 'training';
  format?: 'singles' | 'doubles' | 'mixed';
  skillLevelRange?: {
    min: number;
    max: number;
  };
  maxParticipants: number;
  rsvpDeadline: string;
  registrationFee: {
    amount: number;
    currency: string;
  };
  rsvps: RSVP[];
  matches: Match[];
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  matchesGenerated: boolean;
  settings: {
    allowWaitlist: boolean;
    autoGenerateMatches: boolean;
    requireSkillLevel: boolean;
  };
  attendingCount: number;
  isRsvpOpen: boolean;
  isEventActive: boolean;
  hasStarted: boolean;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface Court {
  name: string;
  isAvailable: boolean;
}

export interface RSVP {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    skillLevel?: number;
    preferredFormat?: string;
  };
  status: 'attending' | 'maybe' | 'declined';
  skillLevel?: number;
  preferredFormat?: 'singles' | 'doubles' | 'mixed' | 'any';
  partnerPreference?: string;
  notes?: string;
  rsvpedAt: string;
  isPaid: boolean;
}

export interface Match {
  court: string;
  startTime: string;
  endTime: string;
  format: 'singles' | 'doubles';
  players: {
    team1: any[];
    team2: any[];
  };
  score: {
    team1: number;
    team2: number;
    sets: Array<{
      team1: number;
      team2: number;
    }>;
  };
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  winner?: 'team1' | 'team2' | 'draw';
}

export interface CreateEventData {
  title: string;
  description?: string;
  club: string;
  eventType: 'sports' | 'social' | 'tournament' | 'training';
  dateTime: string;
  duration: number;
  location: {
    name: string;
    address: string;
    courts: Court[];
  };
  format?: 'singles' | 'doubles' | 'mixed';
  skillLevelRange?: {
    min: number;
    max: number;
  };
  maxParticipants: number;
  rsvpDeadline: string;
  registrationFee?: {
    amount: number;
    currency: string;
  };
  settings?: {
    allowWaitlist?: boolean;
    autoGenerateMatches?: boolean;
    requireSkillLevel?: boolean;
  };
}

export interface EventSearchParams {
  page?: number;
  limit?: number;
  club?: string;
  status?: string;
  upcoming?: boolean;
  myEvents?: boolean;
}

export interface RSVPData {
  status: 'attending' | 'maybe' | 'declined';
  skillLevel?: number;
  preferredFormat?: 'singles' | 'doubles' | 'mixed' | 'any';
  partnerPreference?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  constructor(private api: ApiService) {}

  getEvents(params?: EventSearchParams): Observable<ApiResponse<Event[]>> {
    return this.api.get<Event[]>('events', params);
  }

  getEvent(id: string): Observable<ApiResponse<Event>> {
    return this.api.get<Event>(`events/${id}`);
  }

  createEvent(data: CreateEventData): Observable<ApiResponse<Event>> {
    return this.api.post<Event>('events', data);
  }

  testBackendBody(data: any): Observable<ApiResponse<any>> {
    return this.api.post<any>('events/test-body', data);
  }

  testDirect(data: any): Observable<ApiResponse<any>> {
    return this.api.post<any>('test-direct', data);
  }

  updateEvent(id: string, data: Partial<CreateEventData>): Observable<ApiResponse<Event>> {
    return this.api.put<Event>(`events/${id}`, data);
  }

  deleteEvent(id: string): Observable<ApiResponse<any>> {
    return this.api.delete(`events/${id}`);
  }

  rsvpToEvent(eventId: string, rsvpData: RSVPData): Observable<ApiResponse<Event>> {
    return this.api.post<Event>(`events/${eventId}/rsvp`, rsvpData);
  }

  cancelRsvp(eventId: string): Observable<ApiResponse<any>> {
    return this.api.delete(`events/${eventId}/rsvp`);
  }

  generateMatches(eventId: string): Observable<ApiResponse<Event>> {
    return this.api.post<Event>(`events/${eventId}/generate-matches`, {});
  }

  updateMatchScore(
    eventId: string,
    matchIndex: number,
    score: { team1: number; team2: number; sets?: any[] }
  ): Observable<ApiResponse<Event>> {
    return this.api.put<Event>(`events/${eventId}/matches/${matchIndex}/score`, { score });
  }

  updateEventStatus(eventId: string, status: string): Observable<ApiResponse<Event>> {
    return this.api.put<Event>(`events/${eventId}/status`, { status });
  }
}