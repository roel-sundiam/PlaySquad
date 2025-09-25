import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { SocketService } from './socket.service';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  gender: 'male' | 'female' | 'other';
  skillLevel: number;
  preferredFormat: 'singles' | 'doubles' | 'mixed' | 'any';
  clubs: any[];
  stats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender: 'male' | 'female' | 'other';
  skillLevel?: number;
  preferredFormat?: 'singles' | 'doubles' | 'mixed' | 'any';
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private api: ApiService, private socketService: SocketService) {
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.loadUserProfile();
    }
  }

  register(data: RegisterData): Observable<ApiResponse<AuthResponse>> {
    return this.api.post<AuthResponse>('auth/register', data).pipe(
      tap(response => {
        if (response.success && (response as any).token && (response as any).user) {
          this.setAuthData({
            token: (response as any).token,
            user: (response as any).user
          });
        }
      })
    );
  }

  login(data: LoginData): Observable<ApiResponse<AuthResponse>> {
    return this.api.post<AuthResponse>('auth/login', data).pipe(
      tap(response => {
        if (response.success && (response as any).token && (response as any).user) {
          this.setAuthData({
            token: (response as any).token,
            user: (response as any).user
          });
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.socketService.disconnect();
  }

  loadUserProfile(): Observable<ApiResponse<User>> {
    return this.api.get<User>('auth/me').pipe(
      tap(response => {
        if (response.success && (response as any).user) {
          this.currentUserSubject.next((response as any).user);
          this.isAuthenticatedSubject.next(true);
          this.socketService.connect();
        } else {
          this.logout();
        }
      })
    );
  }

  updateProfile(data: Partial<User>): Observable<ApiResponse<User>> {
    return this.api.put<User>('auth/me', data).pipe(
      tap(response => {
        if (response.success && (response as any).user) {
          this.currentUserSubject.next((response as any).user);
        }
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<ApiResponse<any>> {
    return this.api.put('auth/change-password', {
      currentPassword,
      newPassword
    });
  }

  forgotPassword(email: string): Observable<ApiResponse<any>> {
    return this.api.post('auth/forgot-password', { email });
  }

  resetPassword(resetToken: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.api.put<AuthResponse>(`auth/reset-password/${resetToken}`, { password }).pipe(
      tap(response => {
        if (response.success && (response as any).token && (response as any).user) {
          this.setAuthData({
            token: (response as any).token,
            user: (response as any).user
          });
        }
      })
    );
  }

  private setAuthData(authData: AuthResponse): void {
    localStorage.setItem('token', authData.token);
    this.currentUserSubject.next(authData.user);
    this.isAuthenticatedSubject.next(true);
    this.socketService.connect();
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  isAdmin(): boolean {
    const user = this.currentUser;
    return !!(user && user.email && (user.email.includes('admin') || user.email.includes('superadmin')));
  }
}