from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import EmailValidator, RegexValidator

class JobCategory(models.Model):
    """Catégories d'emploi"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, default='fas fa-briefcase')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'job_categories'
        verbose_name = 'Catégorie d\'emploi'
        verbose_name_plural = 'Catégories d\'emploi'
        ordering = ['name']
    
    def __str__(self):
        return self.name

class JobOffer(models.Model):
    """Offres d'emploi"""
    JOB_TYPES = [
        ('CDI', 'CDI - Contrat à Durée Indéterminée'),
        ('CDD', 'CDD - Contrat à Durée Déterminée'),
        ('Stage', 'Stage'),
        ('Freelance', 'Freelance'),
        ('Alternance', 'Alternance'),
    ]
    
    EXPERIENCE_LEVELS = [
        ('Junior (0-2 ans)', 'Junior (0-2 ans)'),
        ('Confirmé (3-5 ans)', 'Confirmé (3-5 ans)'),
        ('Senior (5+ ans)', 'Senior (5+ ans)'),
        ('Expert (10+ ans)', 'Expert (10+ ans)'),
    ]
    
    title = models.CharField(max_length=200, verbose_name='Titre du poste')
    slug = models.SlugField(max_length=200, unique=True)
    category = models.ForeignKey(JobCategory, on_delete=models.CASCADE, related_name='job_offers')
    location = models.CharField(max_length=100, verbose_name='Lieu')
    job_type = models.CharField(max_length=20, choices=JOB_TYPES, verbose_name='Type de contrat')
    description = models.TextField(verbose_name='Description du poste')
    requirements = models.JSONField(default=list, verbose_name='Exigences')
    skills = models.JSONField(default=list, verbose_name='Compétences requises')
    salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Salaire minimum')
    salary_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Salaire maximum')
    salary_currency = models.CharField(max_length=10, default='TND', verbose_name='Devise')
    experience_level = models.CharField(max_length=50, choices=EXPERIENCE_LEVELS, verbose_name='Niveau d\'expérience')
    is_active = models.BooleanField(default=True, verbose_name='Offre active')
    is_featured = models.BooleanField(default=False, verbose_name='Offre mise en avant')
    application_deadline = models.DateTimeField(null=True, blank=True, verbose_name='Date limite de candidature')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_job_offers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'job_offers'
        verbose_name = 'Offre d\'emploi'
        verbose_name_plural = 'Offres d\'emploi'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_active', '-created_at']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['job_type', 'is_active']),
        ]
    
    def __str__(self):
        return self.title
    
    @property
    def salary_range(self):
        """Retourne la fourchette de salaire formatée"""
        if self.salary_min and self.salary_max:
            return f"{self.salary_min}-{self.salary_max} {self.salary_currency}"
        elif self.salary_min:
            return f"À partir de {self.salary_min} {self.salary_currency}"
        elif self.salary_max:
            return f"Jusqu'à {self.salary_max} {self.salary_currency}"
        return None
    
    @property
    def applications_count(self):
        """Nombre de candidatures pour cette offre"""
        return self.job_applications.count()
    
    @property
    def new_applications_count(self):
        """Nombre de nouvelles candidatures"""
        return self.job_applications.filter(status='new').count()

class JobApplication(models.Model):
    """Candidatures pour les offres d'emploi"""
    APPLICATION_STATUS = [
        ('new', 'Nouvelle'),
        ('reviewed', 'Examinée'),
        ('interview', 'Entretien'),
        ('test', 'Test technique'),
        ('accepted', 'Acceptée'),
        ('rejected', 'Rejetée'),
        ('withdrawn', 'Retirée'),
    ]
    
    job_offer = models.ForeignKey(
        JobOffer, 
        on_delete=models.CASCADE, 
        related_name='job_applications',
        null=True, 
        blank=True,
        verbose_name='Offre d\'emploi'
    )
    
    # Informations du candidat
    first_name = models.CharField(max_length=100, verbose_name='Prénom')
    last_name = models.CharField(max_length=100, verbose_name='Nom')
    email = models.EmailField(validators=[EmailValidator()], verbose_name='Email')
    phone = models.CharField(
        max_length=20, 
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Format de téléphone invalide")],
        verbose_name='Téléphone'
    )
    
    # Informations professionnelles
    current_position = models.CharField(max_length=200, blank=True, verbose_name='Poste actuel')
    experience_years = models.PositiveIntegerField(verbose_name='Années d\'expérience')
    education = models.CharField(max_length=200, blank=True, verbose_name='Formation')
    
    # Candidature
    motivation_letter = models.TextField(verbose_name='Lettre de motivation')
    cv_file = models.FileField(upload_to='applications/cvs/', verbose_name='CV')
    portfolio_url = models.URLField(blank=True, verbose_name='Portfolio (URL)')
    linkedin_url = models.URLField(blank=True, verbose_name='LinkedIn (URL)')
    
    # Statut et suivi
    status = models.CharField(max_length=20, choices=APPLICATION_STATUS, default='new', verbose_name='Statut')
    is_spontaneous = models.BooleanField(default=False, verbose_name='Candidature spontanée')
    
    # Notes internes
    admin_notes = models.TextField(blank=True, verbose_name='Notes administratives')
    interview_date = models.DateTimeField(null=True, blank=True, verbose_name='Date d\'entretien')
    interview_notes = models.TextField(blank=True, verbose_name='Notes d\'entretien')
    
    # Métadonnées
    applied_at = models.DateTimeField(auto_now_add=True, verbose_name='Date de candidature')
    reviewed_at = models.DateTimeField(null=True, blank=True, verbose_name='Date d\'examen')
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_applications',
        verbose_name='Examiné par'
    )
    updated_at = models.DateTimeField(auto_now=True)
    
    # Données de tracking
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        db_table = 'job_applications'
        verbose_name = 'Candidature'
        verbose_name_plural = 'Candidatures'
        ordering = ['-applied_at']
        indexes = [
            models.Index(fields=['status', '-applied_at']),
            models.Index(fields=['job_offer', 'status']),
            models.Index(fields=['is_spontaneous', '-applied_at']),
            models.Index(fields=['email']),
        ]
    
    def __str__(self):
        job_title = self.job_offer.title if self.job_offer else "Candidature spontanée"
        return f"{self.full_name} - {job_title}"
    
    @property
    def full_name(self):
        """Nom complet du candidat"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def job_title(self):
        """Titre du poste ou candidature spontanée"""
        return self.job_offer.title if self.job_offer else "Candidature spontanée"
    
    def save(self, *args, **kwargs):
        # Marquer comme examinée si le statut change
        if self.pk:
            old_instance = JobApplication.objects.get(pk=self.pk)
            if old_instance.status != self.status and self.status != 'new':
                if not self.reviewed_at:
                    self.reviewed_at = timezone.now()
        
        super().save(*args, **kwargs)

class ApplicationStatusHistory(models.Model):
    """Historique des changements de statut des candidatures"""
    application = models.ForeignKey(
        JobApplication, 
        on_delete=models.CASCADE, 
        related_name='status_history'
    )
    old_status = models.CharField(max_length=20, choices=JobApplication.APPLICATION_STATUS)
    new_status = models.CharField(max_length=20, choices=JobApplication.APPLICATION_STATUS)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'application_status_history'
        verbose_name = 'Historique de statut'
        verbose_name_plural = 'Historiques de statut'
        ordering = ['-changed_at']
    
    def __str__(self):
        return f"{self.application.full_name}: {self.old_status} → {self.new_status}"

class JobAlert(models.Model):
    """Alertes emploi pour les candidats"""
    email = models.EmailField(validators=[EmailValidator()])
    keywords = models.CharField(max_length=200, blank=True, verbose_name='Mots-clés')
    categories = models.ManyToManyField(JobCategory, blank=True, verbose_name='Catégories')
    job_types = models.JSONField(default=list, verbose_name='Types de contrat')
    locations = models.JSONField(default=list, verbose_name='Lieux')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_sent = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'job_alerts'
        verbose_name = 'Alerte emploi'
        verbose_name_plural = 'Alertes emploi'
        unique_together = ['email']
    
    def __str__(self):
        return f"Alerte pour {self.email}"
