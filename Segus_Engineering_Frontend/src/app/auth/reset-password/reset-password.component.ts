import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
  step = 1; // 1: email, 2: code, 3: new password, 4: done
  isLoading = false;
  error: string | null = null;

  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  codeForm = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  passwordForm = this.fb.group({
    new_password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  sendCode() {
    if (this.emailForm.invalid) return;
    this.error = null;
    this.isLoading = true;
    this.auth.requestPasswordResetCode(this.emailForm.value.email!).subscribe({
      next: () => {
        this.isLoading = false;
        this.step = 2;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err?.message || "Échec d'envoi du code.";
      }
    });
  }

  verifyCode() {
    if (this.emailForm.invalid || this.codeForm.invalid) return;
    this.error = null;
    this.isLoading = true;
    this.auth.verifyPasswordResetCode(this.emailForm.value.email!, this.codeForm.value.code!).subscribe({
      next: () => {
        this.isLoading = false;
        this.step = 3;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err?.message || 'Code invalide ou expiré.';
      }
    });
  }

  confirmPassword() {
    if (this.emailForm.invalid || this.codeForm.invalid || this.passwordForm.invalid) return;
    this.error = null;
    this.isLoading = true;
    this.auth.confirmPasswordResetWithCode(
      this.emailForm.value.email!,
      this.codeForm.value.code!,
      this.passwordForm.value.new_password!
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.step = 4;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err?.message || 'Échec de réinitialisation.';
      }
    });
  }
}


