import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
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
    <div class="register-container">
      <div class="main-content">
        <div class="register-card">
          <div class="hero-section">
            <div class="brand-display">
              <img src="assets/playsquad-logo.png" alt="PlaySquad Logo" class="hero-logo">
              <h1>Join the Community</h1>
              <p class="hero-subtitle">Start your sports journey with PlaySquad</p>
            </div>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <div class="form-group">
                <label for="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  formControlName="firstName"
                  class="form-control"
                  placeholder="John"
                >
                <div class="error" *ngIf="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched">
                  First name is required (min 2 characters)
                </div>
              </div>
              <div class="form-group">
                <label for="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  formControlName="lastName"
                  class="form-control"
                  placeholder="Doe"
                >
                <div class="error" *ngIf="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched">
                  Last name is required (min 2 characters)
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                formControlName="email"
                class="form-control"
                placeholder="john@example.com"
              >
              <div class="error" *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
                Please enter a valid email address
              </div>
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input
                type="password"
                id="password"
                formControlName="password"
                class="form-control"
                placeholder="At least 6 characters"
              >
              <div class="error" *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
                Password must be at least 6 characters
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="gender">Gender</label>
                <select
                  id="gender"
                  formControlName="gender"
                  class="form-control"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <div class="error" *ngIf="registerForm.get('gender')?.invalid && registerForm.get('gender')?.touched">
                  Please select your gender
                </div>
              </div>
              <div class="form-group">
                <label for="skillLevel">Skill Level (1-10)</label>
                <select
                  id="skillLevel"
                  formControlName="skillLevel"
                  class="form-control"
                >
                  <option value="">Select level</option>
                  <option value="1">1 - Beginner</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5 - Intermediate</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10 - Expert</option>
                </select>
                <div class="error" *ngIf="registerForm.get('skillLevel')?.invalid && registerForm.get('skillLevel')?.touched">
                  Please select your skill level
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="preferredFormat">Preferred Format</label>
              <select
                id="preferredFormat"
                formControlName="preferredFormat"
                class="form-control"
              >
                <option value="any">Any</option>
                <option value="singles">Singles</option>
                <option value="doubles">Doubles</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <button
              type="submit"
              class="btn-primary"
              [disabled]="registerForm.invalid || loading"
            >
              {{ loading ? 'Creating Account...' : 'Create Account' }}
            </button>

            <div class="error-message" *ngIf="errorMessage">
              {{ errorMessage }}
            </div>
          </form>

          <div class="login-link">
            <p>Already have an account? <a routerLink="/login">Sign in</a></p>
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
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 72px);
      padding: 2rem;
    }

    .main-content {
      max-width: 600px;
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

    /* Registration Card */
    .register-card {
      padding: 2rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
      flex: 1;
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
      font-size: 12px;
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

    .login-link {
      text-align: center;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(251, 146, 60, 0.2);
    }

    .login-link p {
      margin: 0;
      color: #475569;
    }

    .login-link a {
      color: #fb923c;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s ease;
    }

    .login-link a:hover {
      color: #f59e0b;
      text-decoration: underline;
    }

    /* Mobile Responsive */
    @media (max-width: 640px) {
      .navbar {
        height: 64px;
      }

      .register-container {
        padding: 1rem;
        min-height: calc(100vh - 64px);
      }

      .hero-section {
        padding: 1.5rem;
      }

      .hero-section h1 {
        font-size: 1.75rem;
      }

      .register-card {
        padding: 1.5rem;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }

      .form-group {
        flex: none;
      }
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      gender: ['', [Validators.required]],
      skillLevel: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
      preferredFormat: ['any', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      this.authService.register(this.registerForm.value).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        }
      });
    }
  }
}