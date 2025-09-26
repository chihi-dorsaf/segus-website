from django.db import models
from django.utils import timezone

from users.models import User


class ContactMessage(models.Model):
    STATUS_CHOICES = [
        ("unread", "Non lu"),
        ("read", "Lu"),
        ("replied", "Répondu"),
        ("archived", "Archivé"),
    ]

    PRIORITY_CHOICES = [
        ("low", "Faible"),
        ("medium", "Moyenne"),
        ("high", "Élevée"),
        ("urgent", "Urgente"),
    ]

    # Informations du contact
    first_name = models.CharField(max_length=100, verbose_name="Prénom")
    last_name = models.CharField(max_length=100, verbose_name="Nom de famille")
    email = models.EmailField(verbose_name="Adresse email")
    subject = models.CharField(max_length=200, verbose_name="Sujet", blank=True)
    message = models.TextField(verbose_name="Message")

    # Métadonnées
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="unread", verbose_name="Statut"
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default="medium",
        verbose_name="Priorité",
    )

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Date de création")
    read_at = models.DateTimeField(null=True, blank=True, verbose_name="Date de lecture")
    replied_at = models.DateTimeField(null=True, blank=True, verbose_name="Date de réponse")

    # Admin qui a traité le message
    handled_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={"role": "ADMIN"},
        verbose_name="Traité par",
    )

    # Notes internes pour l'admin
    admin_notes = models.TextField(blank=True, verbose_name="Notes administrateur")

    class Meta:
        verbose_name = "Message de contact"
        verbose_name_plural = "Messages de contact"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["email"]),
            models.Index(fields=["priority", "status"]),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.subject or 'Sans sujet'}"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def mark_as_read(self, admin_user=None):
        """Marquer le message comme lu"""
        if self.status == "unread":
            self.status = "read"
            self.read_at = timezone.now()
            if admin_user:
                self.handled_by = admin_user
            self.save()

    def mark_as_replied(self, admin_user=None):
        """Marquer le message comme répondu"""
        self.status = "replied"
        self.replied_at = timezone.now()
        if admin_user:
            self.handled_by = admin_user
        if not self.read_at:
            self.read_at = timezone.now()
        self.save()

    def get_status_display_color(self):
        """Retourne la couleur pour l'affichage du statut"""
        colors = {
            "unread": "#ff6b35",  # Orange Segus
            "read": "#1a73c1",  # Bleu Segus
            "replied": "#28a745",  # Vert
            "archived": "#6c757d",  # Gris
        }
        return colors.get(self.status, "#6c757d")

    def get_priority_display_color(self):
        """Retourne la couleur pour l'affichage de la priorité"""
        colors = {
            "low": "#28a745",  # Vert
            "medium": "#ffc107",  # Jaune
            "high": "#fd7e14",  # Orange
            "urgent": "#dc3545",  # Rouge
        }
        return colors.get(self.priority, "#ffc107")

    @property
    def is_recent(self):
        """Vérifie si le message est récent (moins de 24h)"""
        return (timezone.now() - self.created_at).days < 1

    @property
    def response_time(self):
        """Calcule le temps de réponse si répondu"""
        if self.replied_at:
            return self.replied_at - self.created_at
        return None
