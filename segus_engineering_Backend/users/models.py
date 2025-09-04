# models.py (dans votre app users)
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta

class User(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Administrateur'),
        ('EMPLOYE', 'Employé'),
    ]
    
    GENDER_CHOICES = [
        ('M', 'Masculin'),
        ('F', 'Féminin'),
    ]
    
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='EMPLOYE')
    profile_photo = models.ImageField(upload_to='user_photos/', null=True, blank=True, verbose_name="Photo de profil")
    
    # Champs de profil supplémentaires
    phone = models.CharField(max_length=20, null=True, blank=True, verbose_name="Téléphone")
    address = models.TextField(null=True, blank=True, verbose_name="Adresse")
    birth_date = models.DateField(null=True, blank=True, verbose_name="Date de naissance")
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True, blank=True, verbose_name="Genre")
    emergency_contact = models.CharField(max_length=100, null=True, blank=True, verbose_name="Contact d'urgence")
    emergency_phone = models.CharField(max_length=20, null=True, blank=True, verbose_name="Téléphone d'urgence")
    
    # Utiliser l'email comme identifiant principal
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username
    
    @property
    def is_admin(self):
        return self.role == 'ADMIN'
    
    @property
    def is_employee(self):
        return self.role == 'EMPLOYE'


class PasswordResetCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_codes')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at