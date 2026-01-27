import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AnalyticsService } from './services/analytics.service';
import { PwaUpdateService } from './services/pwa-update.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'PlaySquad';

  constructor(
    private analyticsService: AnalyticsService,
    private pwaUpdateService: PwaUpdateService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check for Tennis Club auto-login parameter
    this.handleTennisClubAuth();

    // Analytics service is automatically initialized
    console.log('Analytics tracking initialized');
    // PWA update service is automatically initialized
    console.log('PWA update service initialized');
  }

  private handleTennisClubAuth(): void {
    // Get 'auth' parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');

    if (authParam) {
      console.log('🎾 Tennis Club auth parameter detected');

      try {
        // Decode base64 parameter
        const authDataJson = atob(authParam);
        const authData = JSON.parse(authDataJson);

        console.log('🎾 Decoded auth data:', authData);

        // Call auto-login endpoint
        this.authService.tennisClubLogin(authData).subscribe({
          next: (response) => {
            if (response.success) {
              console.log('✅ Auto-login successful, redirecting to dashboard');

              // Remove auth parameter from URL
              const url = new URL(window.location.href);
              url.searchParams.delete('auth');
              window.history.replaceState({}, '', url.toString());

              // Redirect to dashboard
              this.router.navigate(['/dashboard']);
            }
          },
          error: (error) => {
            console.error('❌ Tennis Club auto-login failed:', error);
            // Redirect to normal login page on error
            this.router.navigate(['/login']);
          }
        });
      } catch (error) {
        console.error('❌ Failed to decode auth parameter:', error);
        // Redirect to login if auth param is malformed
        this.router.navigate(['/login']);
      }
    }
  }

  ngOnDestroy(): void {
    // End analytics session when app is destroyed
    this.analyticsService.endSession();
  }
}
