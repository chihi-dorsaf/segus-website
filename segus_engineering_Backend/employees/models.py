from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta

User = get_user_model()

class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    matricule = models.CharField(max_length=20, unique=True, verbose_name="Matricule", blank=True, null=True)
    position = models.CharField(max_length=100, verbose_name="Poste", blank=True, null=True)
    phone = models.CharField(max_length=20, verbose_name="Téléphone", blank=True, null=True)
    address = models.TextField(verbose_name="Adresse", blank=True, null=True)
    birth_date = models.DateField(verbose_name="Date de naissance", null=True, blank=True)
    hire_date = models.DateField(verbose_name="Date d'embauche", null=True, blank=True)
    salary = models.DecimalField(max_digits=10, decimal_places=3, verbose_name="Salaire (TND)", null=True, blank=True, help_text="Salaire en dinars tunisiens (TND)")
    profile_photo = models.ImageField(upload_to='employee_photos/', null=True, blank=True, verbose_name="Photo de profil")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière modification")

    class Meta:
        verbose_name = "Employé"
        verbose_name_plural = "Employés"
        ordering = ['user__last_name', 'user__first_name']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.position or 'Sans poste'}"

    @property
    def full_name(self):
        return self.user.get_full_name()

    @property
    def email(self):
        return self.user.email

    def generate_matricule(self):
        """Génère un matricule unique au format EMP-{user.id:04d}"""
        if not self.user:
            raise ValueError("L'utilisateur doit être défini avant de générer un matricule")
        return f"EMP-{self.user.id:04d}"

    def save(self, *args, **kwargs):
        if not self.matricule:
            self.matricule = self.generate_matricule()
        super().save(*args, **kwargs)

class WorkSession(models.Model):
    SESSION_STATUS = (
        ('active', 'En cours'),
        ('paused', 'En pause'),
        ('completed', 'Terminée'),
    )

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='work_sessions')
    start_time = models.DateTimeField(auto_now_add=True, verbose_name="Heure de début")
    end_time = models.DateTimeField(null=True, blank=True, verbose_name="Heure de fin")
    total_work_time = models.DurationField(null=True, blank=True, verbose_name="Temps total de travail")
    # Gestion des pauses
    pause_start_time = models.DateTimeField(null=True, blank=True, verbose_name="Début de pause")
    total_pause_time = models.DurationField(null=True, blank=True, default=timedelta(0), verbose_name="Temps total de pause")
    status = models.CharField(max_length=20, choices=SESSION_STATUS, default='active', verbose_name="Statut")
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière modification")

    class Meta:
        verbose_name = "Session de travail"
        verbose_name_plural = "Sessions de travail"
        ordering = ['-start_time']

    def __str__(self):
        return f"{self.employee.full_name} - {self.start_time.strftime('%d/%m/%Y %H:%M')}"

    def pause_session(self):
        if self.status == 'active':
            self.status = 'paused'
            # Marquer le début de la pause si pas déjà défini
            if not self.pause_start_time:
                self.pause_start_time = timezone.now()
            self.save()

    def resume_session(self):
        if self.status == 'paused':
            # Accumuler le temps de pause courant
            if self.pause_start_time:
                pause_delta = timezone.now() - self.pause_start_time
                if self.total_pause_time is None:
                    self.total_pause_time = pause_delta
                else:
                    self.total_pause_time += pause_delta
                self.pause_start_time = None
            self.status = 'active'
            self.save()

    def end_session(self):
        if self.status in ['active', 'paused']:
            self.end_time = timezone.now()
            # Si la session est en pause, clôturer la pause en cours
            if self.pause_start_time:
                pause_delta = self.end_time - self.pause_start_time
                if self.total_pause_time is None:
                    self.total_pause_time = pause_delta
                else:
                    self.total_pause_time += pause_delta
                self.pause_start_time = None

            self.status = 'completed'
            # Calculer le temps total de travail en soustrayant les pauses
            gross_duration = self.end_time - self.start_time
            pause_duration = self.total_pause_time or timedelta(0)
            net_duration = gross_duration - pause_duration
            # Empêcher négatif
            if net_duration.total_seconds() < 0:
                net_duration = timedelta(0)
            self.total_work_time = net_duration
            self.save()

    @property
    def duration_formatted(self):
        if self.total_work_time:
            total_seconds = int(self.total_work_time.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            return f"{hours:02d}:{minutes:02d}"
        return "00:00"

    @property
    def is_current_session(self):
        return self.status == 'active' and not self.end_time