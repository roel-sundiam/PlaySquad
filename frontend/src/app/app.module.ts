import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/auth/login.component';
import { RegisterComponent } from './components/auth/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ClubsListComponent } from './components/clubs/clubs-list.component';
import { ClubDetailComponent } from './components/clubs/club-detail.component';
import { EventsListComponent } from './components/events/events-list.component';
import { EventDetailComponent } from './components/events/event-detail.component';
import { CoinWalletComponent } from './components/coins/coin-wallet.component';
import { WalletPageComponent } from './components/coins/wallet-page.component';
import { ClubCoinWalletComponent } from './components/clubs/club-coin-wallet.component';
import { CoinPurchaseRequestsComponent } from './components/admin/coin-purchase-requests.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard.component';
import { AdminOverviewComponent } from './components/admin/admin-overview.component';
import { AdminUsersComponent } from './components/admin/admin-users.component';
import { AdminClubsComponent } from './components/admin/admin-clubs.component';
import { AdminEventsComponent } from './components/admin/admin-events.component';
import { AdminAnalyticsComponent } from './components/admin/admin-analytics.component';
import { AdminFinancialComponent } from './components/admin/admin-financial.component';
import { ModalComponent } from './components/shared/modal.component';
import { NotificationPopupComponent } from './components/shared/notification-popup.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { HeaderComponent } from './shared/header/header.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    ClubsListComponent,
    ClubDetailComponent,
    EventsListComponent,
    EventDetailComponent,
    CoinWalletComponent,
    WalletPageComponent,
    ClubCoinWalletComponent,
    CoinPurchaseRequestsComponent,
    AdminDashboardComponent,
    AdminOverviewComponent,
    AdminUsersComponent,
    AdminClubsComponent,
    AdminEventsComponent,
    AdminAnalyticsComponent,
    AdminFinancialComponent,
    ModalComponent,
    NotificationPopupComponent,
    NotificationsComponent,
    HeaderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
