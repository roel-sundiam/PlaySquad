import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ClubService } from '../../services/club.service';
import { CoinService } from '../../services/coin.service';
import { ModalService } from '../../services/modal.service';

interface ClubCoinWallet {
  balance: number;
  totalEarned?: number;
  totalSpent?: number;
  lastTransactionAt?: string | null;
  recentTransactions: any[];
  canManageCoins: boolean;
}


@Component({
  selector: 'app-club-coin-wallet',
  template: `
    <div class="club-coin-wallet" *ngIf="clubWallet">
      <!-- Header with balance -->
      <div class="wallet-header">
        <div class="balance-display">
          <div class="balance-main">
            <i class="material-icons">account_balance_wallet</i>
            <span class="balance-amount">{{ formatCoins(clubWallet.balance) }}</span>
          </div>
          <span class="balance-label">Club Coins</span>
        </div>
        
        <div class="wallet-actions" *ngIf="clubWallet.canManageCoins">
          <button class="btn btn-primary" (click)="showPurchaseModal()">
            <i class="material-icons">add</i>
            Buy Coins
          </button>
          <button class="btn btn-secondary" (click)="showTransferModal()">
            <i class="material-icons">swap_horiz</i>
            Transfer
          </button>
        </div>
      </div>

      <!-- Wallet stats (admin only) -->
      <div class="wallet-stats" *ngIf="clubWallet.canManageCoins && clubWallet.totalEarned !== undefined">
        <div class="stat-card">
          <div class="stat-value">{{ formatCoins(clubWallet.totalEarned || 0) }}</div>
          <div class="stat-label">Total Earned</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ formatCoins(clubWallet.totalSpent || 0) }}</div>
          <div class="stat-label">Total Spent</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ formatDate(clubWallet.lastTransactionAt || null) }}</div>
          <div class="stat-label">Last Transaction</div>
        </div>
      </div>

      <!-- Transactions Section -->
      <div class="wallet-tabs">
        <div class="tab-headers">
          <button 
            class="tab-header active"
            *ngIf="clubWallet.canManageCoins">
            <i class="material-icons">receipt</i>
            Transactions
          </button>
        </div>

        <div class="tab-content">
          <!-- Transactions Tab -->
          <div class="tab-pane" *ngIf="clubWallet.canManageCoins">
            <div class="transactions-list" *ngIf="clubWallet.recentTransactions.length > 0">
              <div class="transaction" *ngFor="let transaction of clubWallet.recentTransactions">
                <div class="transaction-icon">
                  <i class="material-icons" [class]="getTransactionIconClass(transaction.type)">
                    {{ getTransactionIcon(transaction.type) }}
                  </i>
                </div>
                <div class="transaction-content">
                  <div class="transaction-description">{{ transaction.description }}</div>
                  <div class="transaction-meta">
                    {{ formatDate(transaction.createdAt) }} · 
                    <span class="transaction-user" *ngIf="transaction.user">
                      by {{ transaction.user.firstName }} {{ transaction.user.lastName }}
                    </span>
                  </div>
                </div>
                <div class="transaction-amount" [class]="transaction.amount > 0 ? 'positive' : 'negative'">
                  {{ transaction.amount > 0 ? '+' : '' }}{{ transaction.amount }}
                </div>
              </div>
            </div>
            <div class="empty-state" *ngIf="clubWallet.recentTransactions.length === 0">
              <i class="material-icons">receipt_long</i>
              <h3>No Transactions Yet</h3>
              <p>Club transactions will appear here</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Purchase Modal -->
      <div class="modal-overlay" *ngIf="showPurchase">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Purchase Club Coins</h3>
            <button class="close-btn" (click)="showPurchase = false">
              <i class="material-icons">close</i>
            </button>
          </div>
          <div class="modal-body">
            <div *ngIf="coinPackages.length === 0" style="text-align: center; padding: 20px;">
              <p>Loading coin packages...</p>
            </div>
            
            <!-- Package Selection -->
            <div class="packages-grid" *ngIf="coinPackages.length > 0">
              <div class="package-card" 
                   *ngFor="let pkg of coinPackages" 
                   [class.selected]="selectedPackage?.id === pkg.id"
                   (click)="selectedPackage = pkg">
                <div class="package-header">
                  <h4>{{ pkg.name }}</h4>
                  <div class="package-price">₱{{ pkg.price }}</div>
                </div>
                <div class="package-coins">
                  <span class="base-coins">{{ pkg.coins }} coins</span>
                  <span class="bonus-coins" *ngIf="pkg.bonusCoins > 0">+ {{ pkg.bonusCoins }} bonus</span>
                </div>
                <div class="package-total">{{ pkg.totalCoins }} total coins</div>
              </div>
            </div>

            <!-- Payment Method Selection -->
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
            <button class="btn btn-secondary" (click)="showPurchase = false">
              Cancel
            </button>
            <button 
              class="btn btn-primary"
              [disabled]="!selectedPackage || !selectedPaymentMethod"
              (click)="selectPackage(selectedPackage)">
              <i class="material-icons">send</i>
              Submit Request
            </button>
          </div>
        </div>
      </div>

      <!-- Transfer Modal -->
      <div class="modal-overlay" *ngIf="showTransfer">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Transfer Coins to Club</h3>
            <button class="close-btn" (click)="showTransfer = false">
              <i class="material-icons">close</i>
            </button>
          </div>
          <div class="modal-body">
            <p>Transfer coins from your personal wallet to this club</p>
            <div class="form-group">
              <label>Amount</label>
              <input 
                type="number" 
                [(ngModel)]="transferAmount" 
                min="1" 
                max="1000"
                class="form-control">
            </div>
            <div class="form-group">
              <label>Message (optional)</label>
              <input 
                type="text" 
                [(ngModel)]="transferMessage" 
                maxlength="200"
                class="form-control"
                placeholder="Add a message...">
            </div>
            <div class="modal-actions">
              <button class="btn btn-secondary" (click)="showTransfer = false">Cancel</button>
              <button 
                class="btn btn-primary" 
                (click)="transferCoins()"
                [disabled]="!transferAmount || transferAmount < 1">
                Transfer {{ transferAmount || 0 }} Coins
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .club-coin-wallet {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .wallet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding: 30px;
      background: linear-gradient(135deg, #00C853 0%, #00A843 100%);
      border-radius: 16px;
      color: white;
    }

    .balance-display {
      text-align: left;
    }

    .balance-main {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .balance-main .material-icons {
      font-size: 32px;
    }

    .balance-amount {
      font-size: 2.5rem;
      font-weight: 700;
    }

    .balance-label {
      font-size: 1.1rem;
      opacity: 0.9;
    }

    .wallet-actions {
      display: flex;
      gap: 12px;
    }

    .wallet-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 5px;
    }

    .stat-label {
      color: #666;
      font-size: 0.9rem;
    }

    .wallet-tabs {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .tab-headers {
      display: flex;
      border-bottom: 1px solid #e2e8f0;
    }

    .tab-header {
      flex: 1;
      padding: 16px 20px;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
    }

    .tab-header.active {
      background: #f7fafc;
      color: #00C853;
      border-bottom: 2px solid #00C853;
    }

    .tab-content {
      padding: 20px;
    }


    .transactions-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .transaction {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-bottom: 1px solid #f1f5f9;
    }

    .transaction:last-child {
      border-bottom: none;
    }

    .transaction-icon {
      width: 40px;
      height: 40px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
    }

    .transaction-icon.positive {
      background: #dcfce7;
      color: #16a34a;
    }

    .transaction-icon.negative {
      background: #fee2e2;
      color: #dc2626;
    }

    .transaction-content {
      flex: 1;
    }

    .transaction-description {
      font-weight: 500;
      color: #1a202c;
      margin-bottom: 4px;
    }

    .transaction-meta {
      font-size: 0.85rem;
      color: #666;
    }

    .transaction-amount {
      font-weight: 600;
      font-size: 1.1rem;
    }

    .transaction-amount.positive {
      color: #16a34a;
    }

    .transaction-amount.negative {
      color: #dc2626;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-state .material-icons {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin-bottom: 8px;
      color: #1a202c;
    }

    /* Modal styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h3 {
      margin: 0;
      color: #1a202c;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
    }

    .modal-body {
      padding: 20px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px;
      border-top: 1px solid #e2e8f0;
      background: #f9fafb;
    }

    .packages-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
    }

    .package-card {
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .package-card:hover {
      border-color: #00C853;
      transform: translateY(-2px);
    }

    .package-header h4 {
      margin: 0 0 8px 0;
      color: #1a202c;
    }

    .package-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: #00C853;
      margin-bottom: 12px;
    }

    .base-coins {
      display: block;
      font-weight: 600;
      color: #1a202c;
    }

    .bonus-coins {
      display: block;
      font-size: 0.85rem;
      color: #00C853;
      margin-top: 4px;
    }

    .package-total {
      margin-top: 8px;
      font-weight: 600;
      color: #666;
    }

    .package-card.selected {
      border-color: #00C853;
      background: #f0fdf4;
      transform: translateY(-2px);
    }

    .payment-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }

    .payment-section h4 {
      margin: 0 0 8px 0;
      color: #1a202c;
    }

    .section-description {
      color: #666;
      margin-bottom: 20px;
      font-size: 0.9rem;
    }

    .payment-methods {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }

    .payment-method {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .payment-method:hover {
      border-color: #00C853;
    }

    .payment-method.selected {
      border-color: #00C853;
      background: #f0fdf4;
    }

    .payment-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .payment-info {
      text-align: center;
    }

    .payment-name {
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 4px;
    }

    .payment-desc {
      font-size: 0.8rem;
      color: #666;
    }

    .payment-details {
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
      margin-top: 20px;
    }

    .payment-details h5 {
      margin: 0 0 16px 0;
      color: #1a202c;
    }

    .form-section {
      margin-bottom: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #1a202c;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 1rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background: #00C853;
      color: white;
    }

    .btn-primary:hover {
      background: #00A843;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #374151;
    }

    .btn-outline-primary {
      background: transparent;
      color: #00C853;
      border: 1px solid #00C853;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .wallet-header {
        flex-direction: column;
        text-align: center;
        gap: 20px;
      }

      .wallet-actions {
        justify-content: center;
      }


      .packages-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class ClubCoinWalletComponent implements OnInit {
  @Input() clubId!: string;
  
  clubWallet: ClubCoinWallet | null = null;
  coinPackages: any[] = [];
  
  showPurchase = false;
  showTransfer = false;
  transferAmount: number = 0;
  transferMessage: string = '';
  
  selectedPackage: any = null;
  selectedPaymentMethod: string = '';
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
    private route: ActivatedRoute,
    private clubService: ClubService,
    private coinService: CoinService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    if (!this.clubId) {
      this.clubId = this.route.snapshot.params['id'];
    }
    
    if (!this.clubId) {
      this.modalService.showAlert('Error', 'Club ID is required');
      return;
    }
    
    this.loadClubWallet();
    this.loadCoinPackages();
  }

  private loadClubWallet(): void {
    this.clubService.getClubCoinWallet(this.clubId).subscribe({
      next: (response) => {
        if (response.success) {
          this.clubWallet = response.data;
        }
      },
      error: (error) => {
        console.error('Failed to load club wallet:', error);
        this.modalService.showAlert('Error', `Failed to load club wallet information: ${error.error?.message || error.message}`);
      }
    });
  }


  private loadCoinPackages(): void {
    console.log('Loading coin packages...');
    this.coinService.getCoinPackages().subscribe({
      next: (response) => {
        console.log('Coin packages response:', response);
        if (response.success && response.data) {
          this.coinPackages = response.data;
          console.log('Coin packages loaded:', this.coinPackages);
        } else {
          console.log('No coin packages data in response');
        }
      },
      error: (error) => {
        console.error('Failed to load coin packages:', error);
        console.error('Error details:', error.error);
        
        // Fallback packages if API fails (PHP prices)
        this.coinPackages = [
          { id: 'starter', name: 'Starter', coins: 50, bonusCoins: 0, totalCoins: 50, price: 249 },
          { id: 'basic', name: 'Basic', coins: 100, bonusCoins: 10, totalCoins: 110, price: 499 },
          { id: 'popular', name: 'Popular', coins: 250, bonusCoins: 50, totalCoins: 300, price: 999 },
          { id: 'premium', name: 'Premium', coins: 500, bonusCoins: 100, totalCoins: 600, price: 1999 },
          { id: 'enterprise', name: 'Enterprise', coins: 1000, bonusCoins: 200, totalCoins: 1200, price: 3499 }
        ];
        console.log('Using fallback coin packages:', this.coinPackages);
      }
    });
  }

  showPurchaseModal(): void {
    console.log('Opening purchase modal');
    console.log('Current coinPackages:', this.coinPackages);
    console.log('CoinPackages length:', this.coinPackages.length);
    
    // Force reload packages if empty
    if (this.coinPackages.length === 0) {
      console.log('Coin packages empty, reloading...');
      this.loadCoinPackages();
    }
    
    // Reset form
    this.resetPurchaseForm();
    this.showPurchase = true;
  }

  showTransferModal(): void {
    this.showTransfer = true;
    this.transferAmount = 0;
    this.transferMessage = '';
  }

  selectPackage(pkg: any): void {
    if (!this.selectedPaymentMethod) {
      this.modalService.showAlert('Error', 'Please select a payment method first');
      return;
    }

    console.log('Creating purchase request for package:', pkg);
    console.log('Club ID:', this.clubId);
    console.log('Payment method:', this.selectedPaymentMethod);
    console.log('Payment details:', this.paymentDetails);
    
    const requestData = {
      packageId: pkg.id,
      paymentMethod: this.selectedPaymentMethod,
      paymentDetails: {
        ...this.paymentDetails,
        amount: pkg.price
      }
    };
    
    this.clubService.createClubCoinPurchaseRequest(this.clubId, requestData).subscribe({
      next: (response) => {
        console.log('Purchase request response:', response);
        if (response.success) {
          this.modalService.showAlert('Request Submitted!', 
            `Your coin purchase request has been submitted for approval. You will be notified once it's processed.`);
          this.showPurchase = false;
          this.resetPurchaseForm();
        }
      },
      error: (error) => {
        console.error('Purchase request failed:', error);
        console.error('Error details:', error.error);
        console.error('Status:', error.status);
        console.error('URL:', error.url);
        this.modalService.showAlert('Error', `Failed to submit purchase request: ${error.error?.message || error.message}`);
      }
    });
  }

  resetPurchaseForm(): void {
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

  transferCoins(): void {
    if (!this.transferAmount || this.transferAmount < 1) {
      return;
    }
    
    if (!this.clubId) {
      this.modalService.showAlert('Error', 'Club ID is required');
      return;
    }

    this.clubService.transferCoinsToClub(this.clubId, {
      amount: this.transferAmount,
      message: this.transferMessage
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.modalService.showAlert('Success', `Successfully transferred ${this.transferAmount} coins to the club!`);
          this.showTransfer = false;
          this.loadClubWallet();
        }
      },
      error: (error) => {
        console.error('Transfer failed:', error);
        const message = error.error?.message || 'Failed to transfer coins. Please try again.';
        this.modalService.showAlert('Error', message);
      }
    });
  }


  formatCoins(amount: number): string {
    return this.coinService.formatCoins(amount);
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  }

  getTransactionIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'purchase': 'add_circle',
      'transfer_received': 'call_received',
      'club_feature': 'star',
      'promotion': 'trending_up',
      'event_premium': 'event'
    };
    return icons[type] || 'monetization_on';
  }

  getTransactionIconClass(type: string): string {
    return type.includes('received') || type === 'purchase' ? 'positive' : 'negative';
  }

}