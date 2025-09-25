import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <!-- Navigation Header -->
    <header class="navbar">
      <div class="nav-container">
        <div class="nav-brand">
          <div class="brand-logo">
            <img src="assets/playsquad-logo.png" alt="PlaySquad Logo">
          </div>
          <span class="brand-text">PlaySquad</span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="login-container">
      <div class="main-content">
        <div class="login-card">
          <div class="hero-section">
            <div class="brand-display">
              <img src="assets/playsquad-logo.png" alt="PlaySquad Logo" class="hero-logo">
              <h1>Sign In</h1>
              <p class="hero-subtitle">Access your account to continue</p>
            </div>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                formControlName="email"
                class="form-control"
                placeholder="Enter your email"
              >
              <div class="error" *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
                Please enter a valid email
              </div>
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input
                type="password"
                id="password"
                formControlName="password"
                class="form-control"
                placeholder="Enter your password"
              >
              <div class="error" *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
                Password is required
              </div>
            </div>

            <button
              type="submit"
              class="btn-primary"
              [disabled]="loginForm.invalid || loading"
            >
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>

            <div class="error-message" *ngIf="errorMessage">
              {{ errorMessage }}
            </div>
          </form>

          <div class="register-link">
            <p>Don't have an account? <a routerLink="/register">Sign up</a></p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Global Background */
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #cbd5e1 100%);
    }

    /* Navigation Header */
    .navbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.9) 100%);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(251, 146, 60, 0.3);
      height: 72px;
      display: flex;
      align-items: center;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo img {
      width: 40px;
      height: 40px;
      object-fit: contain;
    }

    .brand-text {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Main Container */
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 72px);
      padding: 2rem;
    }

    .main-content {
      max-width: 500px;
      width: 100%;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    /* Hero Section */
    .hero-section {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(34, 197, 94, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%);
      border: 1px solid rgba(251, 146, 60, 0.3);
      backdrop-filter: blur(20px);
      padding: 2rem;
      text-align: center;
    }

    .brand-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .hero-logo {
      width: 80px;
      height: 80px;
      object-fit: contain;
    }

    .hero-section h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      margin: 0;
      color: #475569;
      font-size: 1rem;
      font-weight: 500;
    }

    /* Login Card */
    .login-card {
      padding: 2rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #1e293b;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .form-control {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid rgba(251, 146, 60, 0.2);
      border-radius: 12px;
      font-size: 16px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #fb923c;
      box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.1);
      background: rgba(255, 255, 255, 1);
    }

    .btn-primary {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 1rem;
      box-shadow: 0 4px 15px rgba(251, 146, 60, 0.2);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(251, 146, 60, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .error {
      color: #ef4444;
      font-size: 14px;
      margin-top: 0.5rem;
      font-weight: 500;
    }

    .error-message {
      color: #ef4444;
      font-size: 14px;
      margin-top: 1rem;
      text-align: center;
      padding: 12px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 8px;
    }

    .register-link {
      text-align: center;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(251, 146, 60, 0.2);
    }

    .register-link p {
      margin: 0;
      color: #475569;
    }

    .register-link a {
      color: #fb923c;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s ease;
    }

    .register-link a:hover {
      color: #f59e0b;
      text-decoration: underline;
    }

    /* Mobile Responsive */
    @media (max-width: 640px) {
      .navbar {
        height: 64px;
      }

      .login-container {
        padding: 1rem;
        min-height: calc(100vh - 64px);
      }

      .hero-section {
        padding: 1.5rem;
      }

      .hero-section h1 {
        font-size: 1.75rem;
      }

      .login-card {
        padding: 1.5rem;
      }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            // Check if user is superadmin and redirect accordingly
            const user = (response as any).user;
            const isAdmin = user && user.email && (user.email.includes('admin') || user.email.includes('superadmin'));
            
            if (isAdmin) {
              this.router.navigate(['/admin']);
            } else {
              this.router.navigate(['/dashboard']);
            }
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        }
      });
    }
  }
}