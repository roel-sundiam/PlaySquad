import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login.component';
import { RegisterComponent } from './components/auth/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ClubsListComponent } from './components/clubs/clubs-list.component';
import { ClubDetailComponent } from './components/clubs/club-detail.component';
import { EventsListComponent } from './components/events/events-list.component';
import { EventDetailComponent } from './components/events/event-detail.component';
import { WalletPageComponent } from './components/coins/wallet-page.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { CoinPurchaseRequestsComponent } from './components/admin/coin-purchase-requests.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'clubs', component: ClubsListComponent, canActivate: [AuthGuard] },
  { path: 'clubs/:id', component: ClubDetailComponent, canActivate: [AuthGuard] },
  { path: 'events', component: EventsListComponent, canActivate: [AuthGuard] },
  { path: 'events/:id', component: EventDetailComponent, canActivate: [AuthGuard] },
  { path: 'wallet', component: WalletPageComponent, canActivate: [AuthGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [AuthGuard] },
  { path: 'admin/coin-requests', component: CoinPurchaseRequestsComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
