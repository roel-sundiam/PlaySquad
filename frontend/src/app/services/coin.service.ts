import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';

export interface CoinWallet {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  lastTransactionAt: Date | null;
  recentTransactions: CoinTransaction[];
}

export interface CoinTransaction {
  _id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  metadata: any;
  status: string;
  createdAt: Date;
}

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  totalCoins: number;
  price: number;
  pricePerCoin: string;
}

export interface CoinAnalytics {
  period: {
    startDate: Date;
    endDate: Date;
  };
  spendingByCategory: Array<{
    _id: string;
    totalSpent: number;
    transactionCount: number;
  }>;
  earningByCategory: Array<{
    _id: string;
    totalEarned: number;
    transactionCount: number;
  }>;
  dailyActivity: Array<{
    _id: string;
    earned: number;
    spent: number;
    transactionCount: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class CoinService {
  private walletSubject = new BehaviorSubject<CoinWallet | null>(null);
  public wallet$ = this.walletSubject.asObservable();

  constructor(private api: ApiService) {
    // Don't automatically load wallet - let components call it when needed
  }

  private loadWallet(): void {
    this.api.get<CoinWallet>('coins/wallet').subscribe({
      next: (response) => {
        if (response.data) {
          this.walletSubject.next(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading wallet:', error);
      }
    });
  }

  getWallet(): Observable<ApiResponse<CoinWallet>> {
    return this.api.get<CoinWallet>('coins/wallet').pipe(
      tap(response => {
        if (response.data) {
          this.walletSubject.next(response.data);
        }
      })
    );
  }

  getCoinPackages(): Observable<ApiResponse<CoinPackage[]>> {
    return this.api.get<CoinPackage[]>('coins/packages');
  }

  getTransactionHistory(page: number = 1, limit: number = 20): Observable<ApiResponse<{
    transactions: CoinTransaction[];
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      totalTransactions: number;
    };
  }>> {
    return this.api.get(`coins/transactions?page=${page}&limit=${limit}`);
  }

  purchaseCoins(packageId: string, paymentMethod: string, paymentDetails: any): Observable<ApiResponse<{
    requestId: string;
    packageId: string;
    totalCoins: number;
    price: number;
    status: string;
  }>> {
    const payload = {
      packageId,
      paymentMethod,
      paymentDetails: {
        ...paymentDetails,
        amount: 0 // Will be set by server based on package
      }
    };

    return this.api.post<any>('coins/purchase', payload).pipe(
      tap(() => this.loadWallet()) // Refresh wallet after request
    );
  }

  getAnalytics(startDate?: Date, endDate?: Date): Observable<ApiResponse<CoinAnalytics>> {
    let params = '';
    if (startDate) {
      params += `startDate=${startDate.toISOString()}`;
    }
    if (endDate) {
      params += `${params ? '&' : ''}endDate=${endDate.toISOString()}`;
    }
    
    return this.api.get<CoinAnalytics>(`coins/analytics${params ? '?' + params : ''}`);
  }

  getCurrentBalance(): number {
    return this.walletSubject.value?.balance || 0;
  }

  canAfford(amount: number): boolean {
    return this.getCurrentBalance() >= amount;
  }

  // Public method to load wallet (called by components that need it)
  public loadUserWallet(): void {
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      this.loadWallet();
    }
  }

  // Helper method to refresh wallet after spending coins
  refreshWallet(): void {
    this.loadWallet();
  }

  // Format coin amounts for display
  formatCoins(amount: number): string {
    return amount.toLocaleString();
  }

  // Get user-friendly transaction type names
  getTransactionTypeName(type: string): string {
    const typeNames: { [key: string]: string } = {
      'purchase': 'Coin Purchase',
      'referral_bonus': 'Referral Bonus',
      'participation_reward': 'Participation Reward',
      'admin_grant': 'Admin Grant',
      'club_feature': 'Club Feature',
      'event_premium': 'Premium Event',
      'promotion': 'Club Promotion',
      'coaching': 'Coaching Service',
      'equipment': 'Equipment Purchase',
      'refund': 'Refund'
    };
    return typeNames[type] || type.replace('_', ' ');
  }

  // Get transaction icon based on type
  getTransactionIcon(type: string): string {
    const typeIcons: { [key: string]: string } = {
      'purchase': 'credit_card',
      'referral_bonus': 'people',
      'participation_reward': 'star',
      'admin_grant': 'admin_panel_settings',
      'club_feature': 'group',
      'event_premium': 'event',
      'promotion': 'trending_up',
      'coaching': 'school',
      'equipment': 'sports_tennis',
      'refund': 'undo'
    };
    return typeIcons[type] || 'account_balance_wallet';
  }

  // Check if transaction is earning or spending
  isEarning(transaction: CoinTransaction): boolean {
    return transaction.amount > 0;
  }

  isSpending(transaction: CoinTransaction): boolean {
    return transaction.amount < 0;
  }

  // Admin analytics (requires admin access)
  getAdminAnalytics(startDate?: Date, endDate?: Date): Observable<ApiResponse<any>> {
    let params = '';
    if (startDate) {
      params += `startDate=${startDate.toISOString()}`;
    }
    if (endDate) {
      params += `${params ? '&' : ''}endDate=${endDate.toISOString()}`;
    }
    
    return this.api.get(`coins/admin/analytics${params ? '?' + params : ''}`);
  }

  // Admin methods for managing coin purchase requests
  getPendingCoinPurchaseRequests(): Observable<ApiResponse<any[]>> {
    return this.api.get('admin/coin-purchase-requests');
  }

  processCoinPurchaseRequest(requestId: string, action: 'approve' | 'reject', adminNotes: string = ''): Observable<ApiResponse<any>> {
    return this.api.put(`admin/coin-purchase-requests/${requestId}`, {
      action,
      adminNotes
    });
  }
}