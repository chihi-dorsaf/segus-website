from django.conf import settings
from django.db import models
from django.utils import timezone


class ChatConversation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_conversations",
    )
    title = models.CharField(max_length=200, default="Nouvelle conversation")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Conversation {self.id} - {self.user.username}"


class ChatMessage(models.Model):
    MESSAGE_TYPES = [("user", "User"), ("bot", "Bot"), ("system", "System")]

    conversation = models.ForeignKey(
        ChatConversation, on_delete=models.CASCADE, related_name="messages"
    )
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES)
    content = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    is_helpful = models.BooleanField(null=True, blank=True)  # Pour le feedback utilisateur

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"{self.message_type}: {self.content[:50]}..."


class ChatbotKnowledge(models.Model):
    """Base de connaissances pour les réponses du chatbot"""

    question_keywords = models.TextField(
        help_text="Mots-clés de la question (séparés par des virgules)"
    )
    question_pattern = models.CharField(max_length=500, help_text="Pattern de la question")
    answer = models.TextField(help_text="Réponse du chatbot")
    category = models.CharField(max_length=100, default="general")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["category", "question_pattern"]

    def __str__(self):
        return f"{self.category}: {self.question_pattern}"
