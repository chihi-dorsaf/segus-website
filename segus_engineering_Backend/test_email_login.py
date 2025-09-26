#!/usr/bin/env python3
"""
Test d'authentification par email
"""

import os

import django

# Configuration Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "segus_engineering_Backend.settings")
django.setup()

from django.contrib.auth import authenticate  # noqa: E402

from users.models import User  # noqa: E402


def test_email_authentication():
    """Test d'authentification par email"""
    print("🚀 Test d'authentification par email")

    # Créer un utilisateur de test
    test_email = "test.login@segus-engineering.com"
    test_password = "testpassword123"

    try:
        # Vérifier si l'utilisateur existe déjà
        user = User.objects.filter(email=test_email).first()
        if user:
            print(f"✅ Utilisateur existant trouvé: {user.username}")
        else:
            # Créer un nouvel utilisateur de test
            user = User.objects.create_user(
                username="test.login",
                email=test_email,
                password=test_password,
                first_name="Test",
                last_name="Login",
                role="EMPLOYE",
            )
            print(f"✅ Utilisateur créé: {user.username}")

        # Test d'authentification par email
        print(f"🔐 Test d'authentification avec email: {test_email}")
        authenticated_user = authenticate(email=test_email, password=test_password)

        if authenticated_user:
            print(f"✅ Authentification réussie: {authenticated_user.username}")
            print(f"   Email: {authenticated_user.email}")
            print(f"   Rôle: {authenticated_user.role}")
            print(f"   Actif: {authenticated_user.is_active}")
        else:
            print("❌ Authentification échouée")

        # Test avec un mauvais mot de passe
        print("🔐 Test avec mauvais mot de passe")
        wrong_auth = authenticate(email=test_email, password="wrongpassword")
        if wrong_auth:
            print("❌ Authentification réussie avec mauvais mot de passe (ERREUR)")
        else:
            print("✅ Authentification correctement refusée avec mauvais mot de passe")

        # Test avec un email inexistant
        print("🔐 Test avec email inexistant")
        nonexistent_auth = authenticate(email="nonexistent@test.com", password=test_password)
        if nonexistent_auth:
            print("❌ Authentification réussie avec email inexistant (ERREUR)")
        else:
            print("✅ Authentification correctement refusée avec email inexistant")

    except Exception as e:
        print(f"❌ Erreur lors du test: {str(e)}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    test_email_authentication()
