import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-wallet-page',
  template: `
    <div class="wallet-page">
      <app-header></app-header>
      
      <!-- Page Navigation -->
      <div class="page-nav">
        <div class="nav-container">
          <button class="btn-ghost" (click)="goBack()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
            Back to Dashboard
          </button>
          <h1 class="page-title">My Coin Wallet</h1>
        </div>
      </div>

      <!-- Wallet Component -->
      <div class="wallet-content">
        <app-coin-wallet></app-coin-wallet>
      </div>
    </div>
  `,
  styles: [`
    .wallet-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      background-attachment: fixed;
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

    .page-title {
      margin: 0;
      color: #1a202c;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .spacer {
      flex: 1;
    }

    .wallet-content {
      padding: 0;
    }

    @media (max-width: 768px) {
      .nav-container {
        padding: 0 16px;
        height: 60px;
      }

      .page-title {
        font-size: 1.25rem;
      }

      .back-btn {
        padding: 8px 12px;
        font-size: 0.9rem;
      }
    }
  `]
})
export class WalletPageComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}