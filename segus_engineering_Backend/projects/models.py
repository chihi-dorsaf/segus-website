# projects/models.py

from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class Project(models.Model):
    STATUS_CHOICES = [
        ("ACTIVE", "Actif"),
        ("COMPLETED", "Terminé"),
        ("PAUSED", "En pause"),
        ("CANCELLED", "Annulé"),
    ]

    title = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(verbose_name="Description")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="ACTIVE", verbose_name="Statut"
    )
    start_date = models.DateField(verbose_name="Date de début")
    end_date = models.DateField(verbose_name="Date de fin")

    # Relations
    assigned_employees = models.ManyToManyField(
        User,
        related_name="assigned_projects",
        blank=True,
        verbose_name="Employés assignés",
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_projects",
        verbose_name="Créé par",
    )

    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Projet"
        verbose_name_plural = "Projets"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

    @property
    def progress_percentage(self):
        """Calcule le pourcentage d'avancement du projet"""
        total_tasks = self.tasks.count()
        if total_tasks == 0:
            return 0
        completed_tasks = self.tasks.filter(status="COMPLETED").count()
        return round((completed_tasks / total_tasks) * 100, 2)

    @property
    def total_tasks(self):
        return self.tasks.count()

    @property
    def completed_tasks(self):
        return self.tasks.filter(status="COMPLETED").count()


class Task(models.Model):
    STATUS_CHOICES = [
        ("TODO", "À faire"),
        ("IN_PROGRESS", "En cours"),
        ("COMPLETED", "Terminée"),
        ("BLOCKED", "Bloquée"),
    ]

    PRIORITY_CHOICES = [
        ("LOW", "Basse"),
        ("MEDIUM", "Moyenne"),
        ("HIGH", "Haute"),
        ("URGENT", "Urgente"),
    ]

    title = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(verbose_name="Description")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="TODO", verbose_name="Statut"
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default="MEDIUM",
        verbose_name="Priorité",
    )
    start_date = models.DateField(verbose_name="Date de début")
    end_date = models.DateField(verbose_name="Date de fin")

    # Relations
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="tasks", verbose_name="Projet"
    )
    assigned_employees = models.ManyToManyField(
        User,
        related_name="assigned_tasks",
        blank=True,
        verbose_name="Employés assignés",
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_tasks",
        verbose_name="Créé par",
    )

    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Tâche"
        verbose_name_plural = "Tâches"
        ordering = ["priority", "-created_at"]

    def __str__(self):
        return f"{self.title} ({self.project.title})"

    @property
    def progress_percentage(self):
        """Calcule le pourcentage d'avancement de la tâche"""
        total_subtasks = self.subtasks.count()
        if total_subtasks == 0:
            return 100 if self.status == "COMPLETED" else 0
        completed_subtasks = self.subtasks.filter(is_completed=True).count()
        return round((completed_subtasks / total_subtasks) * 100, 2)

    @property
    def total_subtasks(self):
        return self.subtasks.count()

    @property
    def completed_subtasks(self):
        return self.subtasks.filter(is_completed=True).count()


class SubTask(models.Model):
    section_name = models.CharField(max_length=200, verbose_name="Nom de la section")
    section_number = models.CharField(max_length=50, verbose_name="Numéro de section")
    section_id = models.CharField(max_length=100, verbose_name="Identifiant de section")
    kilometrage = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Kilométrage",
        help_text="Kilométrage correspondant à la section",
    )
    is_completed = models.BooleanField(default=False, verbose_name="Terminée")

    # Relations
    task = models.ForeignKey(
        Task, on_delete=models.CASCADE, related_name="subtasks", verbose_name="Tâche"
    )
    assigned_employees = models.ManyToManyField(
        User,
        related_name="assigned_subtasks",
        blank=True,
        verbose_name="Employés assignés",
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_subtasks",
        verbose_name="Créé par",
    )

    # Métadonnées
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="Terminée le")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Sous-tâche"
        verbose_name_plural = "Sous-tâches"
        ordering = ["section_number"]

    def save(self, *args, **kwargs):
        # Quantize kilometrage to 2 decimals to ensure precision in tests
        if self.kilometrage is not None:
            from decimal import Decimal, ROUND_HALF_UP

            self.kilometrage = (
                Decimal(self.kilometrage).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.section_name} ({self.section_number})"

    def mark_completed(self):
        """Marque la sous-tâche comme terminée"""
        from django.utils import timezone

        self.is_completed = True
        self.completed_at = timezone.now()
        self.save()

    def mark_uncompleted(self):
        """Marque la sous-tâche comme non terminée"""
        self.is_completed = False
        self.completed_at = None
        self.save()
