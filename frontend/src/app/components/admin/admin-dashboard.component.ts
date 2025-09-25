import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="admin-dashboard">
      <!-- Sidebar Navigation -->
      <nav class="admin-sidebar">
        <div class="admin-header">
          <h2><i class="material-icons">admin_panel_settings</i> Admin Dashboard</h2>
        </div>
        
        <ul class="nav-menu">
          <li class="nav-item" [class.active]="activeTab === 'overview'">
            <button (click)="setActiveTab('overview')" class="nav-link">
              <i class="material-icons">dashboard</i>
              <span>Overview</span>
            </button>
          </li>
          <li class="nav-item" [class.active]="activeTab === 'users'">
            <button (click)="setActiveTab('users')" class="nav-link">
              <i class="material-icons">people</i>
              <span>Users</span>
            </button>
          </li>
          <li class="nav-item" [class.active]="activeTab === 'clubs'">
            <button (click)="setActiveTab('clubs')" class="nav-link">
              <i class="material-icons">groups</i>
              <span>Clubs</span>
            </button>
          </li>
          <li class="nav-item" [class.active]="activeTab === 'events'">
            <button (click)="setActiveTab('events')" class="nav-link">
              <i class="material-icons">event</i>
              <span>Events</span>
            </button>
          </li>
          <li class="nav-item" [class.active]="activeTab === 'analytics'">
            <button (click)="setActiveTab('analytics')" class="nav-link">
              <i class="material-icons">analytics</i>
              <span>Analytics</span>
            </button>
          </li>
          <li class="nav-item" [class.active]="activeTab === 'financial'">
            <button (click)="setActiveTab('financial')" class="nav-link">
              <i class="material-icons">account_balance</i>
              <span>Financial</span>
            </button>
          </li>
          <li class="nav-item" [class.active]="activeTab === 'coin-requests'">
            <button (click)="setActiveTab('coin-requests')" class="nav-link">
              <i class="material-icons">monetization_on</i>
              <span>Coin Requests</span>
            </button>
          </li>
        </ul>

        <div class="sidebar-footer">
          <button (click)="goBackToMain()" class="btn btn-secondary">
            <i class="material-icons">arrow_back</i>
            Back to App
          </button>
        </div>
      </nav>

      <!-- Main Content Area -->
      <main class="admin-content">
        <!-- Overview Tab -->
        <div *ngIf="activeTab === 'overview'" class="tab-content">
          <app-admin-overview></app-admin-overview>
        </div>

        <!-- Users Tab -->
        <div *ngIf="activeTab === 'users'" class="tab-content">
          <app-admin-users></app-admin-users>
        </div>

        <!-- Clubs Tab -->
        <div *ngIf="activeTab === 'clubs'" class="tab-content">
          <app-admin-clubs></app-admin-clubs>
        </div>

        <!-- Events Tab -->
        <div *ngIf="activeTab === 'events'" class="tab-content">
          <app-admin-events></app-admin-events>
        </div>

        <!-- Analytics Tab -->
        <div *ngIf="activeTab === 'analytics'" class="tab-content">
          <app-admin-analytics></app-admin-analytics>
        </div>

        <!-- Financial Tab -->
        <div *ngIf="activeTab === 'financial'" class="tab-content">
          <app-admin-financial></app-admin-financial>
        </div>

        <!-- Coin Requests Tab -->
        <div *ngIf="activeTab === 'coin-requests'" class="tab-content">
          <app-coin-purchase-requests></app-coin-purchase-requests>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      display: flex;
      min-height: 100vh;
      background: #f8fafc;
    }

    .admin-sidebar {
      width: 280px;
      background: white;
      box-shadow: 2px 0 10px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      position: fixed;
      height: 100vh;
      overflow-y: auto;
    }

    .admin-header {
      padding: 24px 20px;
      border-bottom: 1px solid #e2e8f0;
      background: linear-gradient(135deg, #00C853 0%, #00A847 100%);
      color: white;
    }

    .admin-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .admin-header .material-icons {
      font-size: 28px;
    }

    .nav-menu {
      list-style: none;
      padding: 0;
      margin: 0;
      flex: 1;
    }

    .nav-item {
      margin: 0;
    }

    .nav-link {
      width: 100%;
      padding: 16px 20px;
      border: none;
      background: none;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      color: #4a5568;
      font-size: 1rem;
    }

    .nav-link:hover {
      background: #f7fafc;
      color: #00C853;
    }

    .nav-item.active .nav-link {
      background: #e6ffed;
      color: #00C853;
      border-right: 3px solid #00C853;
      font-weight: 600;
    }

    .nav-link .material-icons {
      font-size: 20px;
      width: 20px;
    }

    .nav-link span {
      flex: 1;
    }

    .sidebar-footer {
      padding: 20px;
      border-top: 1px solid #e2e8f0;
    }

    .admin-content {
      flex: 1;
      margin-left: 280px;
      min-height: 100vh;
      background: #f8fafc;
    }

    .tab-content {
      padding: 0;
      height: 100vh;
      overflow-y: auto;
    }

    .btn {
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #4a5568;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .admin-sidebar {
        width: 100%;
        position: relative;
        height: auto;
      }

      .admin-content {
        margin-left: 0;
        min-height: calc(100vh - 200px);
      }

      .nav-menu {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 16px;
      }

      .nav-item {
        flex: 1;
        min-width: calc(50% - 4px);
      }

      .nav-link {
        padding: 12px;
        border-radius: 8px;
        background: #f8fafc;
        justify-content: center;
        text-align: center;
        flex-direction: column;
        gap: 4px;
      }

      .nav-link span {
        font-size: 0.85rem;
      }

      .nav-item.active .nav-link {
        border-right: none;
        border: 2px solid #00C853;
      }
    }

    @media (max-width: 480px) {
      .nav-item {
        min-width: 100%;
      }

      .nav-link {
        flex-direction: row;
        justify-content: flex-start;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  activeTab = 'overview';

  constructor(
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    // Always start with overview tab for superadmin login
    this.activeTab = 'overview';
    localStorage.setItem('adminActiveTab', 'overview');
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    localStorage.setItem('adminActiveTab', tab);
  }

  goBackToMain(): void {
    this.router.navigate(['/dashboard']);
  }
}