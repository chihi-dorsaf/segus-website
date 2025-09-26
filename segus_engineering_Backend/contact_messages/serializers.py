from rest_framework import serializers

from .models import ContactMessage


class ContactMessageSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    status_color = serializers.SerializerMethodField()
    priority_color = serializers.SerializerMethodField()
    is_recent = serializers.ReadOnlyField()
    response_time_display = serializers.SerializerMethodField()
    handled_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ContactMessage
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "subject",
            "message",
            "status",
            "priority",
            "created_at",
            "read_at",
            "replied_at",
            "handled_by",
            "handled_by_name",
            "admin_notes",
            "status_color",
            "priority_color",
            "is_recent",
            "response_time_display",
        ]
        read_only_fields = ["id", "created_at", "read_at", "replied_at"]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_status_color(self, obj):
        return obj.get_status_display_color()

    def get_priority_color(self, obj):
        return obj.get_priority_display_color()

    def get_response_time_display(self, obj):
        if obj.response_time:
            days = obj.response_time.days
            hours = obj.response_time.seconds // 3600
            if days > 0:
                return f"{days}j {hours}h"
            return f"{hours}h"
        return None

    def get_handled_by_name(self, obj):
        if obj.handled_by:
            return f"{obj.handled_by.first_name} {obj.handled_by.last_name}"
        return None


class ContactMessageCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de messages depuis le formulaire de contact"""

    class Meta:
        model = ContactMessage
        fields = ["first_name", "last_name", "email", "subject", "message"]

    def validate_email(self, value):
        """Validation de l'email"""
        if not value:
            raise serializers.ValidationError("L'adresse email est requise.")
        return value.lower()

    def validate_message(self, value):
        """Validation du message"""
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Le message doit contenir au moins 10 caractères.")
        return value.strip()

    def validate_first_name(self, value):
        """Validation du prénom"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Le prénom doit contenir au moins 2 caractères.")
        return value.strip().title()

    def validate_last_name(self, value):
        """Validation du nom"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Le nom doit contenir au moins 2 caractères.")
        return value.strip().title()


class ContactMessageUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour des messages par l'admin"""

    class Meta:
        model = ContactMessage
        fields = ["status", "priority", "admin_notes", "handled_by"]

    def validate_handled_by(self, value):
        """Validation que l'utilisateur assigné est bien un admin"""
        if value and value.role != "ADMIN":
            raise serializers.ValidationError("Seuls les administrateurs peuvent être assignés.")
        return value
