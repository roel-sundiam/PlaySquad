import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalService, ModalConfig } from '../../services/modal.service';

@Component({
  selector: 'app-modal',
  template: `
    <div class="modal-overlay" *ngIf="config" (click)="onOverlayClick()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ config.title }}</h3>
        </div>
        
        <div class="modal-body">
          <p>{{ config.message }}</p>
          
          <div class="input-group" *ngIf="config.type === 'prompt'">
            <input 
              type="text" 
              [(ngModel)]="inputValue"
              [placeholder]="config.inputPlaceholder || ''"
              class="modal-input"
              #inputField
              (keydown.enter)="onConfirm()"
              (keydown.escape)="onCancel()"
            >
          </div>
        </div>
        
        <div class="modal-actions">
          <button 
            *ngIf="config.type !== 'alert'" 
            class="btn-secondary" 
            (click)="onCancel()"
          >
            {{ config.cancelText || 'Cancel' }}
          </button>
          <button 
            class="btn-primary" 
            (click)="onConfirm()"
          >
            {{ config.confirmText || 'OK' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      box-sizing: border-box;
    }

    .modal-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      max-width: 400px;
      width: 100%;
      max-height: 80vh;
      overflow: hidden;
      animation: modalSlideIn 0.3s ease-out;
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(-50px) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .modal-header {
      padding: 24px 24px 16px 24px;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;
    }

    .modal-body {
      padding: 20px 24px;
    }

    .modal-body p {
      margin: 0 0 16px 0;
      color: #555;
      line-height: 1.5;
    }

    .input-group {
      margin-top: 16px;
    }

    .modal-input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 16px;
      box-sizing: border-box;
      transition: border-color 0.2s ease;
    }

    .modal-input:focus {
      outline: none;
      border-color: #00C853;
    }

    .modal-actions {
      padding: 16px 24px 24px 24px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn-primary, .btn-secondary {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      min-width: 80px;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #00C853;
      color: white;
    }

    .btn-primary:hover {
      background: #00A044;
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #333;
    }

    .btn-secondary:hover {
      background: #e0e0e0;
    }

    /* Mobile optimizations */
    @media (max-width: 480px) {
      .modal-overlay {
        padding: 16px;
      }

      .modal-container {
        max-width: none;
        width: 100%;
      }

      .modal-header, .modal-body, .modal-actions {
        padding-left: 20px;
        padding-right: 20px;
      }

      .modal-actions {
        flex-direction: column-reverse;
      }

      .btn-primary, .btn-secondary {
        width: 100%;
        min-width: auto;
      }
    }
  `]
})
export class ModalComponent implements OnInit, OnDestroy {
  config: ModalConfig | null = null;
  inputValue = '';
  private subscription?: Subscription;

  constructor(private modalService: ModalService) {}

  ngOnInit(): void {
    this.subscription = this.modalService.modal$.subscribe(config => {
      this.config = config;
      if (config?.type === 'prompt') {
        this.inputValue = config.inputValue || '';
        // Auto-focus input field after view is initialized
        setTimeout(() => {
          const inputField = document.querySelector('.modal-input') as HTMLInputElement;
          if (inputField) {
            inputField.focus();
            inputField.select();
          }
        }, 100);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onConfirm(): void {
    if (this.config?.type === 'prompt') {
      this.modalService.confirm({ 
        confirmed: true, 
        inputValue: this.inputValue.trim() 
      });
    } else {
      this.modalService.confirm({ confirmed: true });
    }
  }

  onCancel(): void {
    this.modalService.confirm({ confirmed: false });
  }

  onOverlayClick(): void {
    // Prevent closing modal when clicking outside
    // Users must use the buttons to close the modal
  }
}