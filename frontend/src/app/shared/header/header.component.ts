import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';
import { CoinService, CoinWallet } from '../../services/coin.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-header',
  template: `
    <!-- Modern Navigation Header -->
    <header class="navbar">
      <div class="nav-container">
        <div class="nav-brand" (click)="router.navigate(['/dashboard'])" style="cursor: pointer;">
          <div class="brand-logo">
            <img src="assets/playsquad-logo.png" alt="PlaySquad Logo" width="40" height="40">
          </div>
          <span class="brand-text">PlaySquad</span>
        </div>
        
        <div class="nav-actions">
          <!-- Coin Wallet -->
          <button class="nav-item wallet-btn" (click)="router.navigate(['/wallet'])" title="Coin Wallet">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
            <div class="wallet-info">
              <span class="wallet-amount">{{ formatCoins(wallet?.balance || 0) }}</span>
              <span class="wallet-label">Coins</span>
            </div>
          </button>
          
          <!-- Notifications Button -->
          <button class="nav-item notification-btn" (click)="router.navigate(['/notifications'])" title="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span class="notification-badge" *ngIf="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
            <span>Notifications</span>
          </button>
          
          <!-- Admin Button -->
          <button class="nav-item admin-btn" *ngIf="isAdmin()" (click)="router.navigate(['/admin'])" title="Admin Dashboard">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7v10c0 5.55 3.84 10 9 9 5.16 1 9-3.45 9-9V7l-10-5z"></path>
              <path d="M8 11l2 2 4-4"></path>
            </svg>
            <span>Admin</span>
          </button>
          
          <!-- User Menu -->
          <div class="user-profile">
            <div class="user-avatar">
              <div class="avatar-circle">
                <span>{{ user?.firstName?.charAt(0) || 'U' }}</span>
                <div class="status-indicator"></div>
              </div>
            </div>
            <div class="user-info">
              <span class="user-name">{{ user?.firstName }} {{ user?.lastName }}</span>
              <span class="user-role">{{ user?.preferredFormat | titlecase }} Player</span>
            </div>
            <button class="logout-btn btn-ghost" (click)="logout()" title="Logout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16,17 21,12 16,7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    // Navigation Header
    .navbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.9) 100%);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(251, 146, 60, 0.3);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .nav-container {
      max-width: 1536px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 72px;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 8px;
      }
    }

    .brand-text {
      font-family: 'Poppins', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border: none;
      border-radius: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 200ms ease;
      text-decoration: none;
    }

    .wallet-btn {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
    }

    .wallet-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
    }

    .wallet-info {
      display: flex;
      flex-direction: column;
      text-align: left;
    }

    .wallet-amount {
      font-weight: 700;
      font-size: 0.875rem;
      line-height: 1;
    }

    .wallet-label {
      font-size: 0.75rem;
      opacity: 0.9;
      line-height: 1;
    }

    .notification-btn {
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      position: relative;
    }

    .notification-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
    }

    .notification-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 10px;
      line-height: 1;
      min-width: 18px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      z-index: 1;
    }

    .admin-btn {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }

    .admin-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      
      .avatar-circle {
        width: 36px;
        height: 36px;
        font-size: 0.875rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
      }
      
      .status-indicator {
        width: 10px;
        height: 10px;
        bottom: 2px;
        right: 2px;
        border: 2px solid rgba(255, 255, 255, 0.3);
      }
    }

    .user-avatar {
      position: relative;
    }

    .logout-btn {
      padding: 8px;
      background: rgba(251, 146, 60, 0.1);
      color: #fb923c;
      border-radius: 8px;
    }

    .logout-btn:hover {
      background: rgba(251, 146, 60, 0.2);
    }

    .user-info {
      display: flex;
      flex-direction: column;
      text-align: left;
    }

    .user-name {
      font-weight: 600;
      font-size: 0.875rem;
      color: #ffffff;
      line-height: 1;
    }

    .user-role {
      font-size: 0.75rem;
      color: #cbd5e1;
      line-height: 1;
      margin-top: 2px;
    }

    // Responsive
    @media (max-width: 768px) {
      .nav-container {
        padding: 0 16px;
        height: 64px;
      }

      .brand-text {
        font-size: 1.25rem;
      }

      .nav-actions {
        gap: 12px;
      }

      .user-info {
        display: none;
      }
      
      .wallet-info {
        .wallet-label {
          display: none;
        }
        
        .wallet-amount {
          font-size: 0.75rem;
        }
      }

      .nav-item {
        padding: 10px 12px;
      }

      .user-profile {
        padding: 6px 12px;
      }
    }

    @media (max-width: 480px) {
      .nav-container {
        padding: 0 12px;
      }

      .nav-actions {
        gap: 8px;
      }

      .admin-btn span {
        display: none;
      }

      .notification-btn span:not(.notification-badge) {
        display: none;
      }
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  user: User | null = null;
  wallet: CoinWallet | null = null;
  unreadCount = 0;
  private subscription?: Subscription;

  constructor(
    public router: Router,
    private authService: AuthService,
    private coinService: CoinService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });

    // Subscribe to wallet updates
    this.coinService.wallet$.subscribe(wallet => {
      this.wallet = wallet;
    });
    
    // Subscribe to notification count updates
    this.subscription = this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    
    // Load personal wallet for coin balance display
    this.coinService.loadUserWallet();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  formatCoins(amount: number): string {
    return this.coinService.formatCoins(amount);
  }

  isAdmin(): boolean {
    return this.user?.email?.includes('admin') || this.user?.email?.includes('superadmin') || false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}