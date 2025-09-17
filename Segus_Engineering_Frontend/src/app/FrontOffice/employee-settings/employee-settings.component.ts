import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employee-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-settings.component.html',
  styleUrls: ['./employee-settings.component.css']
})
export class EmployeeSettingsComponent implements OnInit {
  // Préférences générales
  isDarkMode = false;
  notificationsEnabled = true;
  selectedLanguage = 'fr';

  // Sécurité
  twoFactorEnabled = false;

  // Notifications email
  emailNotifications = {
    tasks: true,
    projects: true,
    deadlines: true
  };

  // États
  saving = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    // Charger les paramètres depuis localStorage
    this.isDarkMode = localStorage.getItem('theme') === 'dark';
    this.notificationsEnabled = localStorage.getItem('notifications') !== 'false';
    this.selectedLanguage = localStorage.getItem('language') || 'fr';
    
    // Charger les autres paramètres depuis l'API ou localStorage
    const emailSettings = localStorage.getItem('emailNotifications');
    if (emailSettings) {
      this.emailNotifications = JSON.parse(emailSettings);
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  toggleNotifications() {
    this.notificationsEnabled = !this.notificationsEnabled;
    localStorage.setItem('notifications', this.notificationsEnabled.toString());
  }

  changeLanguage() {
    localStorage.setItem('language', this.selectedLanguage);
    // Ici vous pouvez ajouter la logique pour changer la langue de l'application
  }

  openPasswordModal() {
    // Ouvrir un modal pour changer le mot de passe
    alert('Fonctionnalité de changement de mot de passe à implémenter');
  }

  toggle2FA() {
    this.twoFactorEnabled = !this.twoFactorEnabled;
    // Ici vous pouvez ajouter la logique pour activer/désactiver 2FA
  }

  updateEmailNotification(type: string) {
    this.emailNotifications[type as keyof typeof this.emailNotifications] = 
      !this.emailNotifications[type as keyof typeof this.emailNotifications];
  }

  saveSettings() {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      // Sauvegarder dans localStorage
      localStorage.setItem('emailNotifications', JSON.stringify(this.emailNotifications));
      
      // Ici vous pouvez ajouter l'appel API pour sauvegarder sur le serveur
      
      setTimeout(() => {
        this.saving = false;
        this.successMessage = 'Paramètres sauvegardés avec succès !';
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }, 1000);
      
    } catch (error) {
      this.saving = false;
      this.errorMessage = 'Erreur lors de la sauvegarde des paramètres';
    }
  }

  resetSettings() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      // Réinitialiser aux valeurs par défaut
      this.isDarkMode = false;
      this.notificationsEnabled = true;
      this.selectedLanguage = 'fr';
      this.twoFactorEnabled = false;
      this.emailNotifications = {
        tasks: true,
        projects: true,
        deadlines: true
      };

      // Nettoyer localStorage
      localStorage.removeItem('theme');
      localStorage.removeItem('notifications');
      localStorage.removeItem('language');
      localStorage.removeItem('emailNotifications');
      
      document.body.classList.remove('dark-theme');
      
      this.successMessage = 'Paramètres réinitialisés avec succès !';
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }
  }
}
