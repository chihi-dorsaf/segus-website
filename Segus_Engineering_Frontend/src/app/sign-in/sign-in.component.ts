import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, state, style, transition, animate, stagger, query } from '@angular/animations';
import { AuthService, AuthResponse, User } from '../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatSnackBarModule, RouterModule],
  providers: [],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
  animations: [
    trigger('slideInUp', [
      state('in', style({ transform: 'translateY(0)', opacity: 1 })),
      transition('void => *', [
        style({ transform: 'translateY(30px)', opacity: 0 }),
        animate('600ms ease-out')
      ])
    ]),
    trigger('fadeInDown', [
      state('in', style({ transform: 'translateY(0)', opacity: 1 })),
      transition('void => *', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('500ms 200ms ease-out')
      ])
    ]),
    trigger('fadeInUp', [
      state('in', style({ transform: 'translateY(0)', opacity: 1 })),
      transition('void => *', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('400ms ease-out')
      ])
    ]),
    trigger('slideInLeft', [
      state('in', style({ transform: 'translateX(0)', opacity: 1 })),
      transition('void => *', [
        style({ transform: 'translateX(-50px)', opacity: 0 }),
        animate('600ms 400ms ease-out')
      ])
    ]),
    trigger('bounceIn', [
      state('in', style({ transform: 'scale(1) rotate(0deg)', opacity: 1 })),
      transition('void => *', [
        style({ transform: 'scale(0.3) rotate(15deg)', opacity: 0 }),
        animate('700ms 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)')
      ])
    ]),
    trigger('staggerForm', [
      transition('* => *', [
        query('.form-group', [
          style({ transform: 'translateY(20px)', opacity: 0 }),
          stagger(100, [
            animate('400ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('staggerSocial', [
      transition('* => *', [
        query('.social-btn', [
          style({ transform: 'translateY(20px)', opacity: 0 }),
          stagger(150, [
            animate('400ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('slideDown', [
      transition('void => in', [
        style({ height: '0px', opacity: 0, overflow: 'hidden' }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition('in => void', [
        animate('300ms ease-in', style({ height: '0px', opacity: 0 }))
      ])
    ]),
    trigger('rotateIcon', [
      state('hidden', style({ transform: 'rotate(0deg)' })),
      state('visible', style({ transform: 'rotate(180deg)' })),
      transition('hidden <=> visible', animate('300ms ease-in-out'))
    ]),
    trigger('pulseOnHover', [
      state('idle', style({ transform: 'scale(1)' })),
      state('loading', style({ transform: 'scale(1)' })),
      transition('idle => *', [
        animate('150ms ease-out', style({ transform: 'scale(1.02)' })),
        animate('150ms ease-in', style({ transform: 'scale(1)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition('void => in', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideText', [
      state('idle', style({ transform: 'translateX(0)' })),
      state('loading', style({ transform: 'translateX(0)' })),
      transition('idle <=> loading', [
        animate('200ms ease-in-out')
      ])
    ])
  ]
})
export class SignInComponent implements OnInit {
  signInForm: FormGroup;
  showPassword = false;
  isLoading = false;
  animationState = 'in';
  errorMessage: string | null = null;
  resetStep = 0; // 0 none, 1 send code, 2 verify, 3 new password
  resetCode = '';
  newPassword = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.animationState = 'in';
    }, 100);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.signInForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;

      const { email, password, rememberMe } = this.signInForm.value;
      this.authService.login(email, password, rememberMe).subscribe({
        next: (response: AuthResponse) => {
          console.log('Login successful, response:', response);
          this.isLoading = false;
          this.authService.getUserProfile().subscribe({
            next: (user: User) => {
              console.log('User profile fetched:', user);
              if (user.role && user.role.toUpperCase() === 'ADMIN') { // Vérification robuste
                console.log('Redirecting to /admin/dashboard');
                this.router.navigate(['/admin/dashboard']).then(success => {
                  if (success) {
                    console.log('Navigation to /admin/dashboard succeeded');
                  } else {
                    console.error('Navigation to /admin/dashboard failed');
                  }
                });
              } else {
                console.log('Redirecting to /frontoffice/dashboard');
                this.router.navigate(['/frontoffice/dashboard']).then(success => {
                  if (success) {
                    console.log('Navigation to /frontoffice/dashboard succeeded');
                  } else {
                    console.error('Navigation to /frontoffice/dashboard failed');
                  }
                });
              }
              this.snackBar.open('Connexion réussie !', 'Fermer', {
                duration: 3000,
                verticalPosition: 'top',
                horizontalPosition: 'center',
                panelClass: ['success-snackbar']
              });
            },
            error: (error: HttpErrorResponse) => {
              console.error('Error fetching user profile:', error);
              this.errorMessage = 'Impossible de récupérer les informations de l\'utilisateur.';
              this.isLoading = false;
            }
          });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Login error:', error);
          this.isLoading = false;
          this.errorMessage = error.error?.detail || error.error?.username?.[0] || error.error?.email?.[0] || 'Une erreur est survenue lors de la connexion.';
        }
      });
    } else {
      Object.keys(this.signInForm.controls).forEach(key => {
        this.signInForm.get(key)?.markAsTouched();
      });
    }
  }

  onForgotPassword(): void {
    const email = this.signInForm.get('email')?.value;
    if (!email) {
      this.snackBar.open('Veuillez entrer votre adresse email d\'abord', 'Fermer', {
        duration: 3000,
        verticalPosition: 'top',
        horizontalPosition: 'center',
        panelClass: ['warning-snackbar']
      });
      return;
    }

    this.isLoading = true;
    this.authService.forgotPassword(email).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.snackBar.open('Un email de réinitialisation a été envoyé à votre adresse email.', 'Fermer', {
          duration: 5000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['success-snackbar']
        });
      },
      error: (error: any) => {
        this.isLoading = false;
        const message = error.error?.message || 'Une erreur est survenue lors de l\'envoi de l\'email de réinitialisation.';
        this.snackBar.open(message, 'Fermer', {
          duration: 5000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // New flow: reset by code
  startResetFlow(): void {
    const email = this.signInForm.get('email')?.value;
    if (!email) {
      this.snackBar.open('Veuillez entrer votre adresse email d\'abord', 'Fermer', {
        duration: 3000,
        verticalPosition: 'top',
        horizontalPosition: 'center',
        panelClass: ['warning-snackbar']
      });
      return;
    }
    this.resetStep = 1;
  }

  requestCode(): void {
    const email = this.signInForm.get('email')?.value;
    if (!email) return;
    this.isLoading = true;
    this.authService.requestPasswordResetCode(email).subscribe({
      next: () => {
        this.isLoading = false;
        this.resetStep = 2;
        this.snackBar.open('Code envoyé par email.', 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['success-snackbar']
        });
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Échec d\'envoi du code. Vérifiez l\'email.', 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  verifyCode(): void {
    const email = this.signInForm.get('email')?.value;
    if (!email || !this.resetCode) return;
    this.isLoading = true;
    this.authService.verifyPasswordResetCode(email, this.resetCode).subscribe({
      next: () => {
        this.isLoading = false;
        this.resetStep = 3;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Code invalide ou expiré.', 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  confirmNewPassword(): void {
    const email = this.signInForm.get('email')?.value;
    if (!email || !this.resetCode || !this.newPassword) return;
    this.isLoading = true;
    this.authService.confirmPasswordResetWithCode(email, this.resetCode, this.newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.resetStep = 0;
        this.resetCode = '';
        this.newPassword = '';
        this.snackBar.open('Mot de passe réinitialisé. Vous pouvez vous connecter.', 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['success-snackbar']
        });
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Échec de réinitialisation.', 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
