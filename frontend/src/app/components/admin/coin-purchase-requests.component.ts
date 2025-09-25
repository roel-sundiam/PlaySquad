import { Component, OnInit } from '@angular/core';
import { CoinService } from '../../services/coin.service';
import { ModalService } from '../../services/modal.service';

interface PurchaseRequest {
  _id: string;
  requester: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  club?: {
    _id: string;
    name: string;
  };
  packageId: string;
  packageDetails: {
    name: string;
    coins: number;
    bonusCoins: number;
    totalCoins: number;
    price: number;
  };
  paymentMethod: 'gcash' | 'bank_transfer' | 'cash';
  paymentDetails: any;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  adminNotes?: string;
  processedBy?: any;
  processedAt?: string;
  createdAt: string;
  requestType: 'personal' | 'club';
}

@Component({
  selector: 'app-coin-purchase-requests',
  template: `
    <!-- Navigation Header (Required by Design Guide) -->
    <app-header></app-header>

    <!-- Main Content -->
    <div class="dashboard-layout">
      <div class="main-content">
        <!-- Header Section -->
        <div class="page-header">
          <div class="header-content">
            <h1 class="page-title">Coin Purchase Requests</h1>
            <div class="header-actions">
              <button class="btn btn-primary" (click)="loadRequests()">
                <i class="material-icons">refresh</i>
                <span>Refresh</span>
              </button>
              <div class="filter-tabs">
                <button 
                  class="tab-btn"
                  [class.active]="activeFilter === 'pending'"
                  (click)="setFilter('pending')">
                  Pending ({{ getFilteredRequests('pending').length }})
                </button>
                <button 
                  class="tab-btn"
                  [class.active]="activeFilter === 'all'"
                  (click)="setFilter('all')">
                  All ({{ requests.length }})
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="loading-container">
          <div class="loading-spinner">
            <i class="material-icons spinning">monetization_on</i>
            <p>Loading purchase requests...</p>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && filteredRequests.length === 0" class="empty-state">
          <div class="empty-content">
            <i class="material-icons">inbox</i>
            <h3>No {{ activeFilter === 'pending' ? 'pending ' : '' }}requests found</h3>
            <p>{{ activeFilter === 'pending' ? 'All coin purchase requests have been processed' : 'No coin purchase requests yet' }}</p>
          </div>
        </div>

        <!-- Requests Section -->
        <div *ngIf="!loading && filteredRequests.length > 0" class="requests-section">
          <div class="requests-list">
        <div class="request-card" *ngFor="let request of filteredRequests">
          <div class="request-header">
            <div class="request-info">
              <div class="request-type-badge" [class]="request.requestType">
                {{ request.requestType === 'club' ? 'Club' : 'Personal' }}
              </div>
              <div class="request-id">#{{ request._id.slice(-6) }}</div>
              <div class="request-date">{{ formatDate(request.createdAt) }}</div>
            </div>
            <div class="request-status">
              <span class="status-badge" [class]="request.status">{{ getStatusLabel(request.status) }}</span>
            </div>
          </div>

          <div class="request-content">
            <div class="requester-info">
              <h4>{{ request.requester.firstName }} {{ request.requester.lastName }}</h4>
              <p class="requester-email">{{ request.requester.email }}</p>
              <p *ngIf="request.club" class="club-name">
                <i class="material-icons">group</i>
                {{ request.club.name }}
              </p>
            </div>

            <div class="package-info">
              <h5>{{ request.packageDetails.name }} Package</h5>
              <div class="package-details">
                <div class="coins-breakdown">
                  <span class="base-coins">{{ request.packageDetails.coins }} coins</span>
                  <span *ngIf="request.packageDetails.bonusCoins > 0" class="bonus-coins">
                    + {{ request.packageDetails.bonusCoins }} bonus
                  </span>
                  <span class="total-coins">= {{ request.packageDetails.totalCoins }} total</span>
                </div>
                <div class="package-price">₱{{ request.packageDetails.price }}</div>
              </div>
            </div>

            <div class="payment-info">
              <h5>Payment Information</h5>
              <div class="payment-method">
                <strong>Method:</strong> {{ getPaymentMethodLabel(request.paymentMethod) }}
              </div>
              
              <div *ngIf="request.paymentMethod === 'gcash'" class="payment-details">
                <div *ngIf="request.paymentDetails.gcashNumber">
                  <strong>GCash Number:</strong> {{ request.paymentDetails.gcashNumber }}
                </div>
                <div *ngIf="request.paymentDetails.gcashName">
                  <strong>Account Name:</strong> {{ request.paymentDetails.gcashName }}
                </div>
              </div>
              
              <div *ngIf="request.paymentMethod === 'bank_transfer'" class="payment-details">
                <div *ngIf="request.paymentDetails.bankName">
                  <strong>Bank:</strong> {{ request.paymentDetails.bankName }}
                </div>
                <div *ngIf="request.paymentDetails.accountNumber">
                  <strong>Account Number:</strong> {{ request.paymentDetails.accountNumber }}
                </div>
                <div *ngIf="request.paymentDetails.accountName">
                  <strong>Account Name:</strong> {{ request.paymentDetails.accountName }}
                </div>
              </div>
              
              <div *ngIf="request.paymentDetails.referenceNumber" class="payment-details">
                <div><strong>Reference Number:</strong> {{ request.paymentDetails.referenceNumber }}</div>
              </div>
              
              <div *ngIf="request.paymentDetails.notes" class="payment-notes">
                <strong>Notes:</strong> {{ request.paymentDetails.notes }}
              </div>
            </div>

            <div *ngIf="request.adminNotes" class="admin-notes">
              <h5>Admin Notes</h5>
              <p>{{ request.adminNotes }}</p>
              <div *ngIf="request.processedAt" class="processed-info">
                Processed on {{ formatDate(request.processedAt) }}
              </div>
            </div>
          </div>

          <div *ngIf="request.status === 'pending'" class="request-actions">
            <button 
              class="btn btn-success"
              (click)="openApprovalModal(request, 'approve')"
              [disabled]="processing">
              <i class="material-icons">check_circle</i>
              Approve
            </button>
            <button 
              class="btn btn-danger"
              (click)="openApprovalModal(request, 'reject')"
              [disabled]="processing">
              <i class="material-icons">cancel</i>
              Reject
            </button>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Approval Modal -->
    <div *ngIf="showApprovalModal" class="modal-overlay">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ approvalAction === 'approve' ? 'Approve' : 'Reject' }} Purchase Request</h3>
          <button class="close-btn" (click)="closeApprovalModal()">
            <i class="material-icons">close</i>
          </button>
        </div>
        
        <div class="modal-body">
          <div *ngIf="selectedRequest" class="request-summary">
            <p><strong>Requester:</strong> {{ selectedRequest.requester.firstName }} {{ selectedRequest.requester.lastName }}</p>
            <p><strong>Package:</strong> {{ selectedRequest.packageDetails.name }} ({{ selectedRequest.packageDetails.totalCoins }} coins)</p>
            <p><strong>Amount:</strong> ₱{{ selectedRequest.packageDetails.price }}</p>
            <p *ngIf="selectedRequest.club"><strong>Club:</strong> {{ selectedRequest.club.name }}</p>
          </div>
          
          <div class="form-group">
            <label>Admin Notes {{ approvalAction === 'reject' ? '(Required)' : '(Optional)' }}</label>
            <textarea 
              [(ngModel)]="adminNotes"
              class="form-control"
              rows="4"
              [placeholder]="approvalAction === 'approve' ? 'Optional notes about the approval...' : 'Please provide a reason for rejection...'">
            </textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeApprovalModal()">
            Cancel
          </button>
          <button 
            class="btn"
            [class.btn-success]="approvalAction === 'approve'"
            [class.btn-danger]="approvalAction === 'reject'"
            [disabled]="processing || (approvalAction === 'reject' && !adminNotes.trim())"
            (click)="processRequest()">
            <i class="material-icons">{{ approvalAction === 'approve' ? 'check_circle' : 'cancel' }}</i>
            {{ processing ? 'Processing...' : (approvalAction === 'approve' ? 'Approve Request' : 'Reject Request') }}
          </button>
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

    .filter-tabs {
      display: flex;
      gap: 8px;
    }

    .tab-btn {
      padding: 8px 16px;
      border: 1px solid rgba(251, 146, 60, 0.3);
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      color: #374151;
      font-weight: 500;
    }

    .tab-btn:hover {
      background: rgba(251, 146, 60, 0.1);
      border-color: rgba(251, 146, 60, 0.8);
    }

    .tab-btn.active {
      background: linear-gradient(135deg, #fb923c, #f59e0b);
      color: white;
      border-color: transparent;
      box-shadow: 0 4px 12px rgba(251, 146, 60, 0.3);
    }

    /* Loading, Empty, Error States */
    .loading-container, .empty-state {
      padding: 4rem 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .loading-spinner, .empty-content {
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

    .empty-content h3 {
      margin-bottom: 12px;
      color: #1e293b;
    }

    .empty-content p {
      color: #6b7280;
    }

    /* Requests Section */
    .requests-section {
      padding: 2rem;
      background: rgba(255, 255, 255, 0.3);
    }

    .requests-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .request-card {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.08) 0%, rgba(255, 255, 255, 0.2) 100%);
      border: 1px solid rgba(251, 146, 60, 0.2);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .request-card:hover {
      border-color: rgba(251, 146, 60, 0.8);
      box-shadow: 0 8px 25px rgba(251, 146, 60, 0.2);
      transform: translateY(-2px);
    }

    .request-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      background: #f9fafb;
      border-bottom: 1px solid #e2e8f0;
    }

    .request-info {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .request-type-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .request-type-badge.club {
      background: #dbeafe;
      color: #1e40af;
    }

    .request-type-badge.personal {
      background: #f3e8ff;
      color: #7c3aed;
    }

    .request-id {
      font-family: monospace;
      background: #e5e7eb;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85rem;
    }

    .request-date {
      color: #666;
      font-size: 0.9rem;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.pending {
      background: #fef3c7;
      color: #d97706;
    }

    .status-badge.approved {
      background: #dcfce7;
      color: #16a34a;
    }

    .status-badge.rejected {
      background: #fecaca;
      color: #dc2626;
    }

    .status-badge.processing {
      background: #e0e7ff;
      color: #4338ca;
    }

    .request-content {
      padding: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .requester-info h4 {
      margin: 0 0 8px 0;
      color: #1a202c;
    }

    .requester-email {
      color: #666;
      margin: 0 0 8px 0;
    }

    .club-name {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #fb923c;
      margin: 0;
      font-weight: 600;
    }

    .package-info h5, .payment-info h5 {
      margin: 0 0 12px 0;
      color: #1a202c;
      font-size: 1.1rem;
    }

    .package-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .coins-breakdown {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .base-coins {
      font-weight: 600;
      color: #1a202c;
    }

    .bonus-coins {
      color: #fb923c;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .total-coins {
      color: #666;
      font-size: 0.9rem;
    }

    .package-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: #fb923c;
    }

    .payment-method {
      margin-bottom: 12px;
      font-size: 0.95rem;
    }

    .payment-details {
      margin-bottom: 8px;
      font-size: 0.9rem;
      color: #666;
    }

    .payment-notes {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 0.9rem;
    }

    .admin-notes {
      grid-column: 1 / -1;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }

    .admin-notes h5 {
      margin: 0 0 8px 0;
      color: #1a202c;
    }

    .processed-info {
      margin-top: 8px;
      color: #666;
      font-size: 0.85rem;
    }

    .request-actions {
      padding: 20px;
      border-top: 1px solid #e2e8f0;
      background: #f9fafb;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
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

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
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
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(251, 146, 60, 0.3);
      color: #374151;
    }

    .btn-secondary:hover:not(:disabled) {
      background: rgba(251, 146, 60, 0.1);
      border-color: rgba(251, 146, 60, 0.8);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(251, 146, 60, 0.2);
    }

    .btn-success {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      border: 1px solid transparent;
    }

    .btn-success:hover:not(:disabled) {
      background: linear-gradient(135deg, #16a34a, #15803d);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
    }

    .btn-danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border: 1px solid transparent;
    }

    .btn-danger:hover:not(:disabled) {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    /* Modal Styles */
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
      max-width: 500px;
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

    .request-summary {
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .request-summary p {
      margin: 0 0 8px 0;
    }

    .request-summary p:last-child {
      margin-bottom: 0;
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
      font-family: inherit;
      resize: vertical;
    }

    .form-control:focus {
      outline: none;
      border-color: #fb923c;
      box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.2);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px;
      border-top: 1px solid #e2e8f0;
      background: #f9fafb;
    }

    @media (max-width: 768px) {
      .request-content {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .header-actions {
        justify-content: space-between;
      }

      .request-actions {
        flex-direction: column;
      }
    }
  `]
})
export class CoinPurchaseRequestsComponent implements OnInit {
  requests: PurchaseRequest[] = [];
  filteredRequests: PurchaseRequest[] = [];
  activeFilter: 'pending' | 'all' = 'pending';
  loading = false;
  processing = false;

  // Modal state
  showApprovalModal = false;
  selectedRequest: PurchaseRequest | null = null;
  approvalAction: 'approve' | 'reject' = 'approve';
  adminNotes = '';

  constructor(
    private coinService: CoinService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.coinService.getPendingCoinPurchaseRequests().subscribe({
      next: (response) => {
        if (response.success) {
          this.requests = response.data || [];
          this.filterRequests();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading requests:', error);
        this.modalService.showAlert('Error', 'Failed to load purchase requests');
        this.loading = false;
      }
    });
  }

  setFilter(filter: 'pending' | 'all'): void {
    this.activeFilter = filter;
    this.filterRequests();
  }

  filterRequests(): void {
    if (this.activeFilter === 'pending') {
      this.filteredRequests = this.requests.filter(r => r.status === 'pending');
    } else {
      this.filteredRequests = this.requests;
    }
  }

  getFilteredRequests(status: string): PurchaseRequest[] {
    return this.requests.filter(r => r.status === status);
  }

  openApprovalModal(request: PurchaseRequest, action: 'approve' | 'reject'): void {
    this.selectedRequest = request;
    this.approvalAction = action;
    this.adminNotes = '';
    this.showApprovalModal = true;
  }

  closeApprovalModal(): void {
    this.showApprovalModal = false;
    this.selectedRequest = null;
    this.adminNotes = '';
  }

  processRequest(): void {
    if (!this.selectedRequest) return;
    
    if (this.approvalAction === 'reject' && !this.adminNotes.trim()) {
      this.modalService.showAlert('Error', 'Please provide a reason for rejection');
      return;
    }

    this.processing = true;
    
    this.coinService.processCoinPurchaseRequest(
      this.selectedRequest._id,
      this.approvalAction,
      this.adminNotes
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.modalService.showAlert(
            'Success',
            `Purchase request has been ${this.approvalAction}d successfully`
          );
          this.closeApprovalModal();
          this.loadRequests(); // Reload the list
        }
        this.processing = false;
      },
      error: (error) => {
        console.error('Error processing request:', error);
        this.modalService.showAlert('Error', 'Failed to process request');
        this.processing = false;
      }
    });
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pending Review',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'processing': 'Processing'
    };
    return labels[status] || status;
  }

  getPaymentMethodLabel(method: string): string {
    const labels: { [key: string]: string } = {
      'gcash': 'GCash',
      'bank_transfer': 'Bank Transfer',
      'cash': 'Cash Payment'
    };
    return labels[method] || method;
  }
}