import { Component, OnInit, OnDestroy } from '@angular/core';
import { AnalyticsService } from './services/analytics.service';
import { PwaUpdateService } from './services/pwa-update.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'PlaySquad';

  constructor(
    private analyticsService: AnalyticsService,
    private pwaUpdateService: PwaUpdateService
  ) {}

  ngOnInit(): void {
    // Analytics service is automatically initialized
    console.log('Analytics tracking initialized');
    // PWA update service is automatically initialized
    console.log('PWA update service initialized');
  }

  ngOnDestroy(): void {
    // End analytics session when app is destroyed
    this.analyticsService.endSession();
  }
}
