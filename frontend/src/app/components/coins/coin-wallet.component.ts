import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CoinService, CoinWallet, CoinTransaction, CoinPackage } from '../../services/coin.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-coin-wallet',
  template: `
    <div class="coin-wallet-container">
      <!-- Wallet Header -->
      <div class="wallet-header">
        <div class="balance-card">
          <div class="balance-main">
            <div class="coin-icon">
              <i class="material-icons">monetization_on</i>
            </div>
            <div class="balance-info">
              <h1 class="balance-amount">{{ formatCoins(wallet?.balance || 0) }}</h1>
              <p class="balance-label">Coins Available</p>
            </div>
          </div>
          <button class="btn btn-primary" (click)="openPurchaseModal()">
            <i class="material-icons">add</i>
            Buy Coins
          </button>
        </div>

        <div class="wallet-stats">
          <div class="stat-item">
            <div class="stat-value">{{ formatCoins(wallet?.totalEarned || 0) }}</div>
            <div class="stat-label">Total Earned</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formatCoins(wallet?.totalSpent || 0) }}</div>
            <div class="stat-label">Total Spent</div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button 
          class="action-btn" 
          [class.active]="activeTab === 'transactions'"
          (click)="setActiveTab('transactions')">
          <i class="material-icons">history</i>
          Transactions
        </button>
        <button 
          class="action-btn" 
          [class.active]="activeTab === 'packages'"
          (click)="setActiveTab('packages')">
          <i class="material-icons">shopping_cart</i>
          Buy Coins
        </button>
        <button 
          class="action-btn" 
          [class.active]="activeTab === 'analytics'"
          (click)="setActiveTab('analytics')">
          <i class="material-icons">analytics</i>
          Analytics
        </button>
      </div>

      <!-- Content Sections -->
      <div class="wallet-content">
        <!-- Transactions Tab -->
        <div *ngIf="activeTab === 'transactions'" class="transactions-section">
          <div class="section-header">
            <h3>Recent Transactions</h3>
            <button class="btn btn-secondary" (click)="loadTransactions()" [disabled]="loading">
              <i class="material-icons">refresh</i>
              Refresh
            </button>
          </div>

          <div *ngIf="loading" class="loading-spinner">
            <i class="material-icons spinning">hourglass_empty</i>
            Loading transactions...
          </div>

          <div *ngIf="!loading && transactions.length === 0" class="empty-state">
            <i class="material-icons">account_balance_wallet</i>
            <p>No transactions yet</p>
            <button class="btn btn-primary" (click)="openPurchaseModal()">
              Buy Your First Coins
            </button>
          </div>

          <div *ngIf="!loading && transactions.length > 0" class="transactions-list">
            <div 
              *ngFor="let transaction of transactions" 
              class="transaction-item"
              [class.earning]="coinService.isEarning(transaction)"
              [class.spending]="coinService.isSpending(transaction)">
              
              <div class="transaction-icon">
                <i class="material-icons">{{ coinService.getTransactionIcon(transaction.type) }}</i>
              </div>
              
              <div class="transaction-details">
                <div class="transaction-title">{{ coinService.getTransactionTypeName(transaction.type) }}</div>
                <div class="transaction-description">{{ transaction.description }}</div>
                <div class="transaction-date">{{ formatDate(transaction.createdAt) }}</div>
              </div>
              
              <div class="transaction-amount">
                <div 
                  class="amount-value"
                  [class.positive]="coinService.isEarning(transaction)"
                  [class.negative]="coinService.isSpending(transaction)">
                  {{ transaction.amount > 0 ? '+' : '' }}{{ formatCoins(transaction.amount) }}
                </div>
                <div class="balance-after">Balance: {{ formatCoins(transaction.balanceAfter) }}</div>
              </div>
            </div>

            <!-- Load More Button -->
            <div *ngIf="hasMoreTransactions" class="load-more">
              <button class="btn btn-secondary" (click)="loadMoreTransactions()" [disabled]="loading">
                Load More
              </button>
            </div>
          </div>
        </div>

        <!-- Packages Tab -->
        <div *ngIf="activeTab === 'packages'" class="packages-section">
          <div class="section-header">
            <h3>Coin Packages</h3>
            <p class="section-description">Choose a package that suits your needs</p>
          </div>

          <div *ngIf="loadingPackages" class="loading-spinner">
            <i class="material-icons spinning">hourglass_empty</i>
            Loading packages...
          </div>

          <div *ngIf="!loadingPackages" class="packages-grid">
            <div 
              *ngFor="let pkg of coinPackages" 
              class="package-card"
              [class.popular]="pkg.id === 'popular'">
              
              <div *ngIf="pkg.id === 'popular'" class="popular-badge">
                <i class="material-icons">star</i>
                Most Popular
              </div>
              
              <div class="package-header">
                <h4 class="package-name">{{ pkg.name }}</h4>
                <div class="package-price">₱{{ pkg.price }}</div>
              </div>
              
              <div class="package-coins">
                <div class="base-coins">{{ formatCoins(pkg.coins) }} Coins</div>
                <div *ngIf="pkg.bonusCoins > 0" class="bonus-coins">
                  + {{ formatCoins(pkg.bonusCoins) }} Bonus
                </div>
                <div class="total-coins">= {{ formatCoins(pkg.totalCoins) }} Total</div>
              </div>
              
              <div class="package-value">
                \${{ pkg.pricePerCoin }} per coin
              </div>
              
              <button 
                class="btn btn-primary package-btn"
                (click)="purchasePackage(pkg)"
                [disabled]="purchasing">
                <i class="material-icons">shopping_cart</i>
                {{ purchasing ? 'Processing...' : 'Buy Now' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Analytics Tab -->
        <div *ngIf="activeTab === 'analytics'" class="analytics-section">
          <div class="section-header">
            <h3>Spending Analytics</h3>
            <p class="section-description">Track your coin usage over time</p>
          </div>

          <div class="analytics-placeholder">
            <i class="material-icons">analytics</i>
            <p>Analytics feature coming soon!</p>
            <small>Track your spending patterns and optimize your coin usage</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Purchase Modal -->
    <div *ngIf="showPurchaseModal" class="modal-overlay">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Buy Coins</h3>
          <button class="btn-close" (click)="closePurchaseModal()">
            <i class="material-icons">close</i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="packages-grid">
            <div 
              *ngFor="let pkg of coinPackages" 
              class="package-card small"
              [class.selected]="selectedPackage?.id === pkg.id"
              (click)="selectPackage(pkg)">
              
              <div class="package-header">
                <h4 class="package-name">{{ pkg.name }}</h4>
                <div class="package-price">₱{{ pkg.price }}</div>
              </div>
              
              <div class="package-coins">
                <div class="total-coins">{{ formatCoins(pkg.totalCoins) }} Coins</div>
                <div *ngIf="pkg.bonusCoins > 0" class="bonus-coins">
                  +{{ formatCoins(pkg.bonusCoins) }} bonus
                </div>
              </div>
            </div>
          </div>
          
          <div *ngIf="selectedPackage" class="payment-section">
            <h4>Payment Method</h4>
            <p class="section-description">Your purchase will be reviewed and approved by our team</p>
            <div class="payment-methods">
              <button 
                class="payment-method"
                [class.selected]="selectedPaymentMethod === 'gcash'"
                (click)="selectedPaymentMethod = 'gcash'">
                <div class="payment-icon">💰</div>
                <div class="payment-info">
                  <div class="payment-name">GCash</div>
                  <div class="payment-desc">Mobile payment</div>
                </div>
              </button>
              <button 
                class="payment-method"
                [class.selected]="selectedPaymentMethod === 'bank_transfer'"
                (click)="selectedPaymentMethod = 'bank_transfer'">
                <div class="payment-icon">🏦</div>
                <div class="payment-info">
                  <div class="payment-name">Bank Transfer</div>
                  <div class="payment-desc">Direct bank transfer</div>
                </div>
              </button>
              <button 
                class="payment-method"
                [class.selected]="selectedPaymentMethod === 'cash'"
                (click)="selectedPaymentMethod = 'cash'">
                <div class="payment-icon">💵</div>
                <div class="payment-info">
                  <div class="payment-name">Cash</div>
                  <div class="payment-desc">Cash payment</div>
                </div>
              </button>
            </div>

            <!-- Payment Details Form -->
            <div *ngIf="selectedPaymentMethod" class="payment-details">
              <h5>Payment Details</h5>
              
              <div *ngIf="selectedPaymentMethod === 'gcash'" class="form-section">
                <div class="form-group">
                  <label>GCash Number</label>
                  <input type="text" [(ngModel)]="paymentDetails.gcashNumber" 
                         placeholder="09XX XXX XXXX" class="form-control">
                </div>
                <div class="form-group">
                  <label>Account Name</label>
                  <input type="text" [(ngModel)]="paymentDetails.gcashName" 
                         placeholder="Full name on GCash account" class="form-control">
                </div>
              </div>
              
              <div *ngIf="selectedPaymentMethod === 'bank_transfer'" class="form-section">
                <div class="form-group">
                  <label>Bank Name</label>
                  <select [(ngModel)]="paymentDetails.bankName" class="form-control">
                    <option value="">Select Bank</option>
                    <option value="BDO">BDO Unibank</option>
                    <option value="BPI">Bank of the Philippine Islands</option>
                    <option value="Metrobank">Metrobank</option>
                    <option value="UnionBank">UnionBank</option>
                    <option value="LandBank">Land Bank of the Philippines</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Account Number</label>
                  <input type="text" [(ngModel)]="paymentDetails.accountNumber" 
                         placeholder="Account number" class="form-control">
                </div>
                <div class="form-group">
                  <label>Account Name</label>
                  <input type="text" [(ngModel)]="paymentDetails.accountName" 
                         placeholder="Full name on bank account" class="form-control">
                </div>
              </div>
              
              <div class="form-group">
                <label>Reference Number (Optional)</label>
                <input type="text" [(ngModel)]="paymentDetails.referenceNumber" 
                       placeholder="Transaction reference number" class="form-control">
              </div>
              
              <div class="form-group">
                <label>Notes (Optional)</label>
                <textarea [(ngModel)]="paymentDetails.notes" 
                          placeholder="Additional notes for the payment" 
                          class="form-control" rows="3"></textarea>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closePurchaseModal()">
            Cancel
          </button>
          <button 
            class="btn btn-primary"
            [disabled]="!selectedPackage || !selectedPaymentMethod || purchasing"
            (click)="confirmPurchase()">
            <i class="material-icons">send</i>
            {{ purchasing ? 'Processing...' : 'Submit Request' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./coin-wallet.component.scss']
})
export class CoinWalletComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  wallet: CoinWallet | null = null;
  transactions: CoinTransaction[] = [];
  coinPackages: CoinPackage[] = [];
  
  activeTab: 'transactions' | 'packages' | 'analytics' = 'transactions';
  loading = false;
  loadingPackages = false;
  purchasing = false;
  
  // Pagination
  currentPage = 1;
  hasMoreTransactions = false;
  
  // Purchase Modal
  showPurchaseModal = false;
  selectedPackage: CoinPackage | null = null;
  selectedPaymentMethod = '';
  paymentDetails: any = {
    gcashNumber: '',
    gcashName: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    referenceNumber: '',
    notes: ''
  };

  constructor(
    public coinService: CoinService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.coinService.wallet$
      .pipe(takeUntil(this.destroy$))
      .subscribe(wallet => {
        this.wallet = wallet;
      });

    // Load initial data
    this.coinService.loadUserWallet(); // Load personal wallet
    this.loadTransactions();
    this.loadCoinPackages();
    
    // Also refresh wallet data
    this.coinService.getWallet().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        // Wallet data is already handled by the service
      },
      error: (error) => {
        console.error('Error loading wallet:', error);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveTab(tab: 'transactions' | 'packages' | 'analytics'): void {
    this.activeTab = tab;
  }

  loadTransactions(): void {
    this.loading = true;
    this.currentPage = 1;
    
    this.coinService.getTransactionHistory(this.currentPage, 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.transactions = response.data.transactions;
            this.hasMoreTransactions = this.currentPage < response.data.pagination.totalPages;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading transactions:', error);
          this.loading = false;
        }
      });
  }

  loadMoreTransactions(): void {
    if (this.loading || !this.hasMoreTransactions) return;
    
    this.loading = true;
    this.currentPage++;
    
    this.coinService.getTransactionHistory(this.currentPage, 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.transactions = [...this.transactions, ...response.data.transactions];
            this.hasMoreTransactions = this.currentPage < response.data.pagination.totalPages;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading more transactions:', error);
          this.loading = false;
        }
      });
  }

  loadCoinPackages(): void {
    this.loadingPackages = true;
    
    this.coinService.getCoinPackages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.coinPackages = response.data;
          }
          this.loadingPackages = false;
        },
        error: (error) => {
          console.error('Error loading packages:', error);
          this.loadingPackages = false;
        }
      });
  }

  openPurchaseModal(): void {
    this.showPurchaseModal = true;
    if (this.coinPackages.length === 0) {
      this.loadCoinPackages();
    }
  }

  closePurchaseModal(): void {
    this.showPurchaseModal = false;
    this.selectedPackage = null;
    this.selectedPaymentMethod = '';
    this.paymentDetails = {
      gcashNumber: '',
      gcashName: '',
      bankName: '',
      accountNumber: '',
      accountName: '',
      referenceNumber: '',
      notes: ''
    };
  }

  selectPackage(coinPackage: CoinPackage): void {
    this.selectedPackage = coinPackage;
  }

  purchasePackage(coinPackage: CoinPackage): void {
    this.selectedPackage = coinPackage;
    this.openPurchaseModal();
  }

  confirmPurchase(): void {
    if (!this.selectedPackage || !this.selectedPaymentMethod) {
      this.modalService.showAlert('Error', 'Please select a payment method');
      return;
    }
    
    this.purchasing = true;
    
    this.coinService.purchaseCoins(
      this.selectedPackage.id,
      this.selectedPaymentMethod,
      this.paymentDetails
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.purchasing = false;
          this.closePurchaseModal();
          
          // Show success message for approval request
          this.modalService.showAlert(
            'Request Submitted!',
            'Your coin purchase request has been submitted for approval. You will be notified once it\'s processed.'
          );
          
          // Refresh transactions
          this.loadTransactions();
        },
        error: (error) => {
          console.error('Purchase error:', error);
          this.purchasing = false;
          
          this.modalService.showAlert(
            'Request Failed',
            error.error?.message || 'Failed to submit purchase request.'
          );
        }
      });
  }

  formatCoins(amount: number): string {
    return this.coinService.formatCoins(amount);
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}