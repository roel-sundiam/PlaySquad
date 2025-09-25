import { Component, OnInit } from '@angular/core';
import { AdminService, FinancialData } from '../../services/admin.service';

@Component({
  selector: 'app-admin-financial',
  template: `
    <!-- Navigation Header (Required by Design Guide) -->
    <app-header></app-header>

    <!-- Main Content -->
    <div class="dashboard-layout">
      <div class="main-content">
        <!-- Header Section -->
        <div class="page-header">
          <div class="header-content">
            <h1 class="page-title">Financial Overview</h1>
            <div class="header-actions">
              <select [(ngModel)]="selectedPeriod" (change)="loadFinancialData()" class="filter-select">
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
              <button class="btn btn-primary" (click)="refreshFinancialData()" [disabled]="loading">
                <i class="material-icons">refresh</i>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="loading-container">
          <div class="loading-spinner">
            <i class="material-icons spinning">account_balance</i>
            <p>Loading financial data...</p>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && !financialData" class="empty-state">
          <div class="empty-content">
            <i class="material-icons">account_balance_wallet</i>
            <h3>No financial data available</h3>
            <p>Financial data is still being collected.</p>
          </div>
        </div>

        <!-- Financial Content -->
        <div *ngIf="!loading && financialData" class="financial-section">
          <!-- Revenue Statistics -->
          <div class="stats-section">
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">
                  <i class="material-icons">monetization_on</i>
                </div>
                <div class="stat-content">
                  <div class="stat-number">₱{{ financialData.revenue.total | number }}</div>
                  <div class="stat-label">Total Revenue</div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">
                  <i class="material-icons">toll</i>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ financialData.revenue.totalCoinsGranted | number }}</div>
                  <div class="stat-label">Coins Granted</div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">
                  <i class="material-icons">receipt</i>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ financialData.revenue.totalTransactions | number }}</div>
                  <div class="stat-label">Transactions</div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">
                  <i class="material-icons">schedule</i>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ financialData.period }}</div>
                  <div class="stat-label">Analysis Period</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Financial Cards -->
          <div class="financial-cards">
            <!-- Revenue by Package -->
            <div class="financial-card" *ngIf="financialData && financialData.revenueByPackage && financialData.revenueByPackage.length > 0">
              <div class="card-header">
                <i class="material-icons">pie_chart</i>
                <h3>Revenue by Package</h3>
              </div>
              <div class="revenue-list">
                <div *ngFor="let package of financialData.revenueByPackage" class="revenue-item">
                  <div class="package-info">
                    <span class="package-name">{{ package._id }}</span>
                    <span class="package-stats">{{ package.count }} purchases</span>
                  </div>
                  <div class="revenue-details">
                    <div class="revenue-amount">₱{{ package.revenue | number }}</div>
                    <div class="coins-amount">{{ package.totalCoins | number }} coins</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Top Spenders -->
            <div class="financial-card" *ngIf="financialData && financialData.topSpenders && financialData.topSpenders.length > 0">
              <div class="card-header">
                <i class="material-icons">trending_up</i>
                <h3>Top Spenders</h3>
              </div>
              <div class="spenders-list">
                <div *ngFor="let spender of financialData.topSpenders; index as i" class="spender-item">
                  <div class="spender-rank">{{ i + 1 }}</div>
                  <div class="spender-avatar">
                    <span>{{ getSpenderInitials(spender) }}</span>
                  </div>
                  <div class="spender-info">
                    <div class="spender-name">{{ spender.firstName }} {{ spender.lastName }}</div>
                    <div class="spender-email">{{ spender.email }}</div>
                  </div>
                  <div class="spender-stats">
                    <div class="spent-amount">{{ spender.totalSpent }} spent</div>
                    <div class="balance-amount">{{ spender.currentBalance }} balance</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Top Earning Clubs -->
            <div class="financial-card" *ngIf="financialData && financialData.topEarningClubs && financialData.topEarningClubs.length > 0">
              <div class="card-header">
                <i class="material-icons">groups</i>
                <h3>Top Earning Clubs</h3>
              </div>
              <div class="clubs-list">
                <div *ngFor="let club of financialData.topEarningClubs; index as i" class="club-item">
                  <div class="club-rank">{{ i + 1 }}</div>
                  <div class="club-info">
                    <div class="club-name">{{ club.name }}</div>
                  </div>
                  <div class="club-stats">
                    <div class="earned-amount">{{ club.totalEarned }} earned</div>
                    <div class="balance-amount">{{ club.currentBalance }} balance</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Coin Distribution -->
            <div class="financial-card" *ngIf="financialData && financialData.userCoinDistribution && financialData.userCoinDistribution.length > 0">
              <div class="card-header">
                <i class="material-icons">bar_chart</i>
                <h3>Coin Distribution</h3>
              </div>
              <div class="distribution-summary">
                <p>Distribution of coin balances across users.</p>
                <div class="distribution-stats">
                  <div class="distribution-stat" *ngFor="let dist of financialData.userCoinDistribution">
                    <span class="dist-range">{{ getDistributionLabel(dist._id) }}</span>
                    <span class="dist-count">{{ dist.count }} users</span>
                    <span class="dist-total">{{ dist.totalCoins }} coins</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="error-container">
          <div class="error-content">
            <i class="material-icons">error</i>
            <p>{{ error }}</p>
            <button class="btn btn-primary" (click)="refreshFinancialData()">
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

    /* Statistics Section */
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

    /* Financial Section */
    .financial-section {
      padding: 2rem;
      background: rgba(255, 255, 255, 0.3);
    }

    .financial-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    /* Financial Cards */
    .financial-card {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.08) 0%, rgba(255, 255, 255, 0.2) 100%);
      border: 1px solid rgba(251, 146, 60, 0.2);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .financial-card:hover {
      border-color: rgba(251, 146, 60, 0.8);
      box-shadow: 0 8px 25px rgba(251, 146, 60, 0.2);
      transform: translateY(-2px);
    }

    .card-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(251, 146, 60, 0.1);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .card-header .material-icons {
      color: #fb923c;
      font-size: 24px;
    }

    .card-header h3 {
      color: #000000;
      font-weight: 600;
      margin: 0;
      font-family: 'Poppins', sans-serif;
    }

    /* Revenue Items */
    .revenue-list {
      padding: 1.5rem;
    }

    .revenue-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      margin-bottom: 0.75rem;
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%);
      border: 1px solid rgba(251, 146, 60, 0.2);
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .revenue-item:hover {
      border-color: rgba(251, 146, 60, 0.8);
      box-shadow: 0 4px 12px rgba(251, 146, 60, 0.15);
    }

    .package-name {
      color: #1e293b;
      font-weight: 600;
      font-size: 1rem;
    }

    .package-stats {
      color: #475569;
      font-size: 0.875rem;
    }

    .revenue-amount {
      color: #fb923c;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .coins-amount {
      color: #475569;
      font-size: 0.875rem;
    }

    /* Spenders */
    .spenders-list, .clubs-list {
      padding: 1.5rem;
    }

    .spender-item, .club-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      margin-bottom: 0.75rem;
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%);
      border: 1px solid rgba(251, 146, 60, 0.2);
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .spender-item:hover, .club-item:hover {
      border-color: rgba(251, 146, 60, 0.8);
      box-shadow: 0 4px 12px rgba(251, 146, 60, 0.15);
    }

    .spender-rank, .club-rank {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .spender-avatar {
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

    .spender-info, .club-info {
      flex: 1;
    }

    .spender-name, .club-name {
      color: #1e293b;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .spender-email {
      color: #475569;
      font-size: 0.875rem;
    }

    .spender-stats, .club-stats {
      text-align: right;
    }

    .spent-amount, .earned-amount {
      color: #fb923c;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .balance-amount {
      color: #475569;
      font-size: 0.8rem;
    }

    /* Distribution */
    .distribution-summary {
      padding: 1.5rem;
    }

    .distribution-summary p {
      color: #475569;
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .distribution-stats {
      display: grid;
      gap: 0.75rem;
    }

    .distribution-stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%);
      border: 1px solid rgba(251, 146, 60, 0.2);
      border-radius: 8px;
    }

    .dist-range {
      color: #1e293b;
      font-weight: 600;
    }

    .dist-count {
      color: #475569;
      font-size: 0.875rem;
    }

    .dist-total {
      color: #fb923c;
      font-weight: 600;
      font-size: 0.875rem;
    }

    /* Common Styles */
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

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    /* Loading, Empty, Error States */
    .loading-container, .empty-state, .error-container {
      padding: 4rem 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .loading-spinner, .empty-content, .error-content {
      text-align: center;
      color: #6b7280;
    }

    .loading-spinner .material-icons, .empty-content .material-icons {
      font-size: 4rem;
      margin-bottom: 1rem;
      color: #fb923c;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-content {
      background: rgba(248, 113, 113, 0.1);
      border: 1px solid rgba(248, 113, 113, 0.3);
      border-radius: 12px;
      padding: 2rem;
      backdrop-filter: blur(10px);
    }

    .error-content .material-icons {
      color: #dc2626;
    }

    .error-content p {
      color: #dc2626;
      margin-bottom: 1rem;
    }

    /* Responsive Design */
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

      .financial-cards {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .revenue-item {
        flex-direction: column;
        gap: 0.75rem;
        align-items: flex-start;
      }

      .spender-item, .club-item {
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .spender-stats, .club-stats {
        text-align: left;
      }
    }
  `]
})
export class AdminFinancialComponent implements OnInit {
  financialData: FinancialData | null = null;
  loading = false;
  error: string | null = null;
  selectedPeriod = '30d';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadFinancialData();
  }

  loadFinancialData(): void {
    this.loading = true;
    this.error = null;

    this.adminService.getFinancialData(this.selectedPeriod).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.financialData = response.data;
        } else {
          this.error = 'Failed to load financial data';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading financial data:', error);
        this.error = 'Failed to load financial data';
        this.loading = false;
      }
    });
  }

  refreshFinancialData(): void {
    this.loadFinancialData();
  }

  getSpenderInitials(spender: any): string {
    const firstName = spender.firstName || '';
    const lastName = spender.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getDistributionLabel(range: any): string {
    if (typeof range === 'string') {
      return range;
    }
    return `${range.min || 0}-${range.max || 'max'} coins`;
  }
}