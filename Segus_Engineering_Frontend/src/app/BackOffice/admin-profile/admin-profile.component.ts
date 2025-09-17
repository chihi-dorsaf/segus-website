import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.css']
})
export class AdminProfileComponent implements OnInit {
  profileForm: FormGroup;
  user: any = null;
  isEditing = false;
  isLoading = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadProgress = 0;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9+\-\s()]+$/)]],
      address: [''],
      position: ['Administrateur']
    });
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.isLoading = true;
    this.authService.getUserProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue(user);
        this.previewUrl = user.profile_photo || null;
        // Ne pas désactiver le formulaire - laisser pointer-events gérer l'état
        console.log('✅ Profil chargé, formulaire reste actif');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement profil:', error);
        // Données par défaut pour la démonstration
        this.user = {
          id: 1,
          first_name: 'Ahmed',
          last_name: 'Mansouri',
          email: 'ahmed.mansouri@segus.com',
          phone: '+216 20 123 456',
          address: 'Tunis, Tunisie',
          position: 'Administrateur',
          profile_photo: null,
          created_at: '2023-01-15',
          last_login: new Date().toISOString()
        };
        this.profileForm.patchValue(this.user);
        // Ne pas désactiver le formulaire - laisser pointer-events gérer l'état
        console.log('✅ Données par défaut chargées, formulaire reste actif');
        this.isLoading = false;
      }
    });
  }

  toggleEdit() {
    console.log('🔧 toggleEdit appelé, isEditing avant:', this.isEditing);
    this.isEditing = !this.isEditing;
    console.log('🔧 isEditing après:', this.isEditing);
    
    if (!this.isEditing) {
      // Annuler les modifications
      this.profileForm.patchValue(this.user);
      this.selectedFile = null;
      this.previewUrl = this.user.profile_photo || null;
      console.log('🔧 Mode lecture activé');
    } else {
      console.log('🔧 Mode édition activé - les champs devraient être éditables');
      // Force l'activation de tous les contrôles individuellement
      Object.keys(this.profileForm.controls).forEach(key => {
        const control = this.profileForm.get(key);
        if (control) {
          control.enable();
          console.log(`  ${key}: enabled`);
        }
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide.');
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La taille du fichier ne doit pas dépasser 5MB.');
        return;
      }
      
      this.selectedFile = file;
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  onSubmit() {
    if (this.profileForm.valid) {
      this.isLoading = true;
      
      const formData = new FormData();
      Object.keys(this.profileForm.value).forEach(key => {
        formData.append(key, this.profileForm.value[key]);
      });
      
      if (this.selectedFile) {
        formData.append('profile_photo', this.selectedFile);
      }
      
      // Utiliser le service AuthService pour mettre à jour le profil
      this.authService.updateProfile(formData).subscribe({
        next: (updatedUser) => {
          console.log('✅ Profil mis à jour avec succès:', updatedUser);
          this.user = updatedUser;
          this.profileForm.patchValue(updatedUser);
          this.previewUrl = updatedUser.profile_photo || null;
          
          this.isEditing = false;
          this.isLoading = false;
          this.selectedFile = null;
          
          // Afficher un message de succès
          this.showSuccessMessage();
        },
        error: (error) => {
          console.error('❌ Erreur mise à jour profil:', error);
          this.isLoading = false;
          alert('Erreur lors de la mise à jour du profil: ' + (error.message || 'Erreur inconnue'));
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private simulateUpload(): Promise<void> {
    return new Promise((resolve) => {
      this.uploadProgress = 0;
      const interval = setInterval(() => {
        this.uploadProgress += 10;
        if (this.uploadProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            this.uploadProgress = 0;
            resolve();
          }, 500);
        }
      }, 100);
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.markAsTouched();
    });
  }

  private showSuccessMessage() {
    // Créer un toast de succès
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.textContent = 'Profil mis à jour avec succès !';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  getUserInitials(): string {
    if (!this.user) return 'AD';
    const firstName = this.user.first_name || '';
    const lastName = this.user.last_name || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  goBack() {
    this.router.navigate(['/admin/dashboard']);
  }
}
