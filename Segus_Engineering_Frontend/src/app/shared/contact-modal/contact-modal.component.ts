import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactService } from '../../services/contact.service';

@Component({
  selector: 'app-contact-modal',
  templateUrl: './contact-modal.component.html',
  styleUrls: ['./contact-modal.component.css']
})
export class ContactModalComponent {
  contactForm: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  constructor(
    private formBuilder: FormBuilder,
    private contactService: ContactService
  ) {
    this.contactForm = this.formBuilder.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: [''],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit() {
    if (this.contactForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.submitError = '';
      this.submitSuccess = false;

      const formData = this.contactForm.value;

      this.contactService.sendMessage(formData).subscribe({
        next: (response: any) => {
          console.log('Message envoyé avec succès:', response);
          this.submitSuccess = true;
          this.contactForm.reset();
          
          // Fermer le modal après 2 secondes
          setTimeout(() => {
            this.closeModal();
          }, 2000);
        },
        error: (error: any) => {
          console.error('Erreur lors de l\'envoi:', error);
          this.submitError = error.error?.message || 'Une erreur est survenue lors de l\'envoi du message.';
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
    }
  }

  closeModal() {
    // Réinitialiser le formulaire et les états
    this.contactForm.reset();
    this.submitSuccess = false;
    this.submitError = '';
    this.isSubmitting = false;

    // Fermer le modal Bootstrap
    const modalElement = document.getElementById('contactModal');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  }

  // Méthodes utilitaires pour la validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return 'Ce champ est requis.';
      }
      if (field.errors['email']) {
        return 'Veuillez entrer une adresse email valide.';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `Ce champ doit contenir au moins ${requiredLength} caractères.`;
      }
    }
    return '';
  }
}
