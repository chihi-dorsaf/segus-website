import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmployeeFrontofficeService } from '../../services/employee-frontoffice.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface EmployeeProfileUI {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  gender?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  profile_photo?: string;
}

@Component({
  selector: 'app-employee-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-profile.component.html',
  styleUrls: ['./employee-profile.component.css']
})
export class EmployeeProfileComponent implements OnInit {
  currentUser: any = null;
  profileForm: FormGroup;
  selectedFile: File | null = null;
  loading = false;
  success = '';
  error = '';
  isEditing = false;
  previewUrl: string | null = null; // Ajouter cette propriété

  constructor(
    private authService: AuthService,
    private formBuilder: FormBuilder
  ) {
    this.profileForm = this.formBuilder.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      phone: [''],
      address: [''],
      birth_date: [''],
      gender: [''],
      emergency_contact: [''],
      emergency_phone: [''],
      profile_photo: ['']
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.authService.fetchCurrentUser().subscribe({
      next: (user: any) => {
        this.currentUser = user;
        if (user) {
          this.profileForm.patchValue({
            username: user.username || '',
            email: user.email || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone: user.phone || '',
            address: user.address || '',
            birth_date: user.birth_date || '',
            gender: user.gender || '',
            emergency_contact: user.emergency_contact || '',
            emergency_phone: user.emergency_phone || ''
          });

          // Gérer l'URL de prévisualisation de la photo (absolue)
          this.previewUrl = this.toAbsoluteMediaUrl(user.profile_photo);
        }
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.error = 'Format de fichier non supporté. Utilisez JPG, PNG ou GIF.';
        return;
      }
      
      // Vérifier la taille (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.error = 'La taille du fichier ne doit pas dépasser 5MB.';
        return;
      }
      
      this.selectedFile = file;
      this.error = ''; // Clear any previous errors
      
      // Créer l'URL de prévisualisation
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.loading = true;
      this.error = '';
      this.success = '';

      const formData = new FormData();
      Object.keys(this.profileForm.value).forEach(key => {
        if (this.profileForm.get(key)?.value) {
          formData.append(key, this.profileForm.get(key)?.value);
        }
      });

      if (this.selectedFile) {
        formData.append('profile_photo', this.selectedFile);
      }

      this.authService.updateProfile(formData).subscribe({
        next: (response) => {
          this.loading = false;
          this.success = 'Profil mis à jour avec succès !';
          this.selectedFile = null; // Reset file selection
          // Mettre à jour l'aperçu localement si la réponse contient la nouvelle photo
          if ((response as any)?.profile_photo) {
            this.previewUrl = this.toAbsoluteMediaUrl((response as any).profile_photo);
          }
          this.loadCurrentUser();
          this.isEditing = false;
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.success = '';
          }, 3000);
        },
        error: (err: any) => {
          this.loading = false;
          this.error = err.error?.message || err.message || 'Erreur lors de la mise à jour du profil';
          console.error('Erreur lors de la mise à jour du profil:', err);
          
          // Clear error message after 5 seconds
          setTimeout(() => {
            this.error = '';
          }, 5000);
        }
      });
    }
  }

  private toAbsoluteMediaUrl(path?: string | null): string | null {
    if (!path) return null;
    // Si l'URL est déjà absolue, retourner telle quelle
    if (/^https?:\/\//i.test(path)) return path;
    // Sinon préfixer par l'apiUrl
    const base = environment.apiUrl.replace(/\/$/, '');
    if (path.startsWith('/')) {
      return `${base}${path}`;
    }
    return `${base}/${path}`;
  }
}
