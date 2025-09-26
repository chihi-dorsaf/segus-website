#!/usr/bin/env python
import os
import django
import pytest

pytestmark = pytest.mark.skip(reason="Helper script, excluded from automated test run")

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "segus_engineering_Backend.settings")
django.setup()

from django.test import RequestFactory  # noqa: E402

from contact_messages.models import ContactMessage  # noqa: E402
from contact_messages.serializers import ContactMessageCreateSerializer  # noqa: E402
from contact_messages.views import ContactMessageViewSet  # noqa: E402


def test_contact_message_creation():
    print("=== Test de création d'un message de contact ===")

    # Test 1: Vérifier que le modèle fonctionne
    try:
        test_data = {
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "subject": "Test Subject",
            "message": "This is a test message from the diagnostic script.",
        }

        # Test du serializer
        serializer = ContactMessageCreateSerializer(data=test_data)
        if serializer.is_valid():
            print("✅ Serializer validation: OK")

            # Test de sauvegarde
            message = serializer.save()
            print(f"✅ Message créé avec ID: {message.id}")
            print(f"   Nom complet: {message.get_full_name()}")
            print(f"   Email: {message.email}")
            print(f"   Statut: {message.status}")

            # Nettoyage
            message.delete()
            print("✅ Message de test supprimé")

        else:
            print("❌ Erreurs de validation du serializer:")
            for field, errors in serializer.errors.items():
                print(f"   {field}: {errors}")

    except Exception as e:
        print(f"❌ Erreur lors du test du modèle: {e}")
        import traceback

        traceback.print_exc()

    # Test 2: Vérifier la vue
    try:
        print("\n=== Test de la vue ContactMessageViewSet ===")
        factory = RequestFactory()
        request = factory.post("/api/contact-messages/", test_data, content_type="application/json")

        viewset = ContactMessageViewSet()
        viewset.request = request
        viewset.format_kwarg = None

        # Test des permissions
        permissions = viewset.get_permissions()
        print(f"✅ Permissions pour create: {[p.__class__.__name__ for p in permissions]}")

        # Test du serializer class
        serializer_class = viewset.get_serializer_class()
        print(f"✅ Serializer class: {serializer_class.__name__}")

    except Exception as e:
        print(f"❌ Erreur lors du test de la vue: {e}")
        import traceback

        traceback.print_exc()

    # Test 3: Vérifier la base de données
    try:
        print("\n=== Test de la base de données ===")
        count = ContactMessage.objects.count()
        print(f"✅ Nombre de messages existants: {count}")

        # Test de création directe
        direct_message = ContactMessage.objects.create(**test_data)
        print(f"✅ Message créé directement en DB avec ID: {direct_message.id}")

        # Vérification
        retrieved = ContactMessage.objects.get(id=direct_message.id)
        print(f"✅ Message récupéré: {retrieved.get_full_name()}")

        # Nettoyage
        direct_message.delete()
        print("✅ Message direct supprimé")

    except Exception as e:
        print(f"❌ Erreur lors du test de la base de données: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    test_contact_message_creation()
