import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-wallet-page',
  template: `
    <div class="wallet-page">
      <!-- Navigation Header (MANDATORY) -->
      <app-header></app-header>

      <!-- Main Container -->
      <div class="main-content">
        <!-- Page Header -->
        <div class="page-header">
          <button class="back-btn" (click)="goBack()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
            Back to Dashboard
          </button>
          <h1 class="page-title">My Coin Wallet</h1>
        </div>

        <!-- Wallet Component -->
        <app-coin-wallet></app-coin-wallet>
      </div>
    </div>
  `,
  styles: [`
    // Global Background (per design guide)
    .wallet-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #cbd5e1 100%);
      padding: 2rem 1rem;
    }

    // Main Container (per design guide)
    .main-content {
      max-width: 1200px;
      margin: auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    // Page Header
    .page-header {
      padding: 2rem 2rem 1rem 2rem;
      border-bottom: 1px solid rgba(251, 146, 60, 0.2);
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.05) 0%, rgba(255, 255, 255, 0.8) 100%);
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(251, 146, 60, 0.1);
      border: 1px solid rgba(251, 146, 60, 0.3);
      border-radius: 8px;
      color: #fb923c;
      font-weight: 500;
      cursor: pointer;
      transition: all 200ms ease;
      text-decoration: none;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .back-btn:hover {
      background: rgba(251, 146, 60, 0.15);
      border-color: rgba(251, 146, 60, 0.8);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(251, 146, 60, 0.2);
    }

    .page-title {
      margin: 0;
      color: #000000;
      font-family: 'Poppins', sans-serif;
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    // Mobile Responsive
    @media (max-width: 768px) {
      .wallet-page {
        padding: 1rem 0.5rem;
      }

      .page-header {
        padding: 1.5rem 1rem 1rem 1rem;
      }

      .page-title {
        font-size: 1.5rem;
      }

      .back-btn {
        padding: 6px 12px;
        font-size: 0.8rem;
      }
    }

    @media (max-width: 480px) {
      .wallet-page {
        padding: 0.5rem 0.25rem;
      }

      .page-header {
        padding: 1rem 0.75rem;
      }

      .page-title {
        font-size: 1.25rem;
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