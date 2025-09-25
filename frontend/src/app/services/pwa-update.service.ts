import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PwaUpdateService {
  constructor(private swUpdate: SwUpdate) {
    this.checkForUpdates();
  }

  private checkForUpdates(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    // Check for updates immediately
    this.swUpdate.checkForUpdate().then(() => {
      console.log('Checked for app updates');
    });

    // Listen for available updates
    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        this.showUpdateNotification();
      });

    // Check for updates every 6 hours
    setInterval(() => {
      this.swUpdate.checkForUpdate().then(() => {
        console.log('Periodic update check completed');
      });
    }, 6 * 60 * 60 * 1000); // 6 hours
  }

  private showUpdateNotification(): void {
    const updateAvailable = confirm(
      'A new version of PlaySquad is available! Would you like to update now?'
    );
    
    if (updateAvailable) {
      this.activateUpdate();
    }
  }

  public activateUpdate(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.activateUpdate().then(() => {
      // Reload the page to show the new version
      window.location.reload();
    });
  }

  public checkForUpdate(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.checkForUpdate().then(() => {
      console.log('Manual update check completed');
    });
  }
}