import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface Club {
  id: string;
  name: string;
  description?: string;
  sport: 'tennis' | 'badminton' | 'squash' | 'table-tennis' | 'pickleball';
  location: {
    name: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  isPrivate: boolean;
  inviteCode?: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  members: ClubMember[];
  joinRequests?: JoinRequest[];
  settings: {
    maxMembers: number;
    allowGuestPlayers: boolean;
    autoAcceptMembers: boolean;
    minSkillLevel: number;
    maxSkillLevel: number;
  };
  avatar?: string;
  coverImage?: string;
  stats: {
    totalEvents: number;
    totalMatches: number;
    activeMembersCount: number;
  };
  memberCount: number;
  organizerCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClubMember {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    skillLevel: number;
    preferredFormat: string;
    stats: any;
  };
  role: 'member' | 'organizer' | 'admin';
  joinedAt: string;
  isActive: boolean;
}

export interface JoinRequest {
  _id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    skillLevel: number;
  };
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  respondedAt?: string;
  respondedBy?: string;
}

export interface CreateClubData {
  name: string;
  description?: string;
  sport: string;
  location: {
    name: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  isPrivate?: boolean;
  settings?: {
    maxMembers?: number;
    allowGuestPlayers?: boolean;
    autoAcceptMembers?: boolean;
    minSkillLevel?: number;
    maxSkillLevel?: number;
  };
}

export interface ClubSearchParams {
  page?: number;
  limit?: number;
  sport?: string;
  search?: string;
  includePrivate?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ClubService {
  constructor(private api: ApiService) {}

  getClubs(params?: ClubSearchParams): Observable<ApiResponse<Club[]>> {
    return this.api.get<Club[]>('clubs/browse', params);
  }

  getUserClubs(params?: ClubSearchParams): Observable<ApiResponse<Club[]>> {
    return this.api.get<Club[]>('clubs', params);
  }

  getClub(id: string): Observable<ApiResponse<Club>> {
    return this.api.get<Club>(`clubs/${id}`);
  }

  createClub(data: CreateClubData): Observable<ApiResponse<Club>> {
    return this.api.post<Club>('clubs', data);
  }

  updateClub(id: string, data: Partial<CreateClubData>): Observable<ApiResponse<Club>> {
    return this.api.put<Club>(`clubs/${id}`, data);
  }

  deleteClub(id: string): Observable<ApiResponse<any>> {
    return this.api.delete(`clubs/${id}`);
  }

  joinClub(id: string, inviteCode?: string, message?: string): Observable<ApiResponse<Club>> {
    return this.api.post<Club>(`clubs/${id}/join`, { inviteCode, message });
  }

  leaveClub(id: string): Observable<ApiResponse<any>> {
    return this.api.post(`clubs/${id}/leave`, {});
  }

  getJoinRequests(clubId: string): Observable<ApiResponse<any[]>> {
    return this.api.get<any[]>(`clubs/${clubId}/requests`);
  }

  processJoinRequest(clubId: string, requestId: string, action: 'approve' | 'reject'): Observable<ApiResponse<any>> {
    return this.api.put(`clubs/${clubId}/requests/${requestId}`, { action });
  }

  updateMemberRole(clubId: string, userId: string, role: 'member' | 'organizer' | 'admin'): Observable<ApiResponse<Club>> {
    return this.api.put<Club>(`clubs/${clubId}/members/${userId}/role`, { role });
  }

  removeMember(clubId: string, userId: string): Observable<ApiResponse<any>> {
    return this.api.delete(`clubs/${clubId}/members/${userId}`);
  }

  // ===== CLUB COIN MANAGEMENT METHODS =====

  getClubCoinWallet(clubId: string): Observable<ApiResponse<any>> {
    if (!clubId) {
      throw new Error('Club ID is required');
    }
    const url = `clubs/${clubId}/coins/wallet-simple`;
    console.log('Club coin wallet API URL:', url);
    return this.api.get(url);
  }

  purchaseClubCoins(clubId: string, purchaseData: { packageId: string; paymentMethod: string; paymentToken?: string }): Observable<ApiResponse<any>> {
    console.log('Calling purchase API with:', purchaseData);
    return this.api.post(`clubs/${clubId}/coins/purchase-simple`, purchaseData);
  }

  transferCoinsToClub(clubId: string, transferData: { amount: number; message?: string }): Observable<ApiResponse<any>> {
    return this.api.post(`clubs/${clubId}/coins/transfer`, transferData);
  }

  getClubCoinTransactions(clubId: string, page: number = 1, limit: number = 20): Observable<ApiResponse<any>> {
    return this.api.get(`clubs/${clubId}/coins/transactions?page=${page}&limit=${limit}`);
  }

  getClubFeatures(clubId: string): Observable<ApiResponse<any>> {
    return this.api.get(`clubs/${clubId}/coins/features`);
  }

  createClubCoinPurchaseRequest(clubId: string, requestData: { 
    packageId: string; 
    paymentMethod: string; 
    paymentDetails: any 
  }): Observable<ApiResponse<any>> {
    console.log('Creating coin purchase request with:', requestData);
    return this.api.post(`clubs/${clubId}/coins/purchase-request`, requestData);
  }
}