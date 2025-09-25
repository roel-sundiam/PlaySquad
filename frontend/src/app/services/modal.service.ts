import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';

export interface ModalConfig {
  type: 'alert' | 'confirm' | 'prompt';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  inputPlaceholder?: string;
  inputValue?: string;
}

export interface ModalResult {
  confirmed: boolean;
  inputValue?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalSubject = new BehaviorSubject<ModalConfig | null>(null);
  private resultSubject = new Subject<ModalResult>();

  public modal$ = this.modalSubject.asObservable();

  showAlert(title: string, message: string): Promise<ModalResult> {
    const config: ModalConfig = {
      type: 'alert',
      title,
      message,
      confirmText: 'OK'
    };
    
    this.modalSubject.next(config);
    
    return this.resultSubject.pipe(take(1)).toPromise().then(result => {
      this.clearModal();
      return result || { confirmed: true };
    });
  }

  showConfirm(title: string, message: string, confirmText = 'OK', cancelText = 'Cancel'): Promise<ModalResult> {
    const config: ModalConfig = {
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText
    };
    
    this.modalSubject.next(config);
    
    return this.resultSubject.pipe(take(1)).toPromise().then(result => {
      this.clearModal();
      return result || { confirmed: false };
    });
  }

  showPrompt(title: string, message: string, placeholder = '', defaultValue = ''): Promise<ModalResult> {
    const config: ModalConfig = {
      type: 'prompt',
      title,
      message,
      inputPlaceholder: placeholder,
      inputValue: defaultValue,
      confirmText: 'OK',
      cancelText: 'Cancel'
    };
    
    this.modalSubject.next(config);
    
    return this.resultSubject.pipe(take(1)).toPromise().then(result => {
      this.clearModal();
      return result || { confirmed: false };
    });
  }

  confirm(result: ModalResult): void {
    this.resultSubject.next(result);
  }

  private clearModal(): void {
    setTimeout(() => {
      this.modalSubject.next(null);
    }, 100);
  }
}