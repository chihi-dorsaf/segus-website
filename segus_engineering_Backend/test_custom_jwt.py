#!/usr/bin/env python3
"""
Test de la vue d'authentification JWT personnalisée
"""

import os

import django
import requests

# Configuration Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "segus_engineering_Backend.settings")
django.setup()


def test_custom_jwt_login():
    """Test de la vue d'authentification JWT personnalisée"""
    print("🚀 Test de la vue d'authentification JWT personnalisée")

    # Données de test
    test_data = {"email": "chihidorsaf2001@gmail.com", "password": "testpassword123"}

    try:
        # Test de la nouvelle vue
        response = requests.post(
            "http://127.0.0.1:8000/api/auth/jwt/create-with-email/",
            json=test_data,
            headers={"Content-Type": "application/json"},
        )

        print(f"📊 Status Code: {response.status_code}")
        print(f"📝 Response Headers: {dict(response.headers)}")

        if response.status_code == 200:
            print("✅ Authentification réussie!")
            response_data = response.json()
            print(f"📄 Access Token: {response_data.get('access', 'Non trouvé')[:50]}...")
            print(f"📄 Refresh Token: {response_data.get('refresh', 'Non trouvé')[:50]}...")
        elif response.status_code == 400:
            print("❌ Erreur de validation:")
            print(f"📄 Response: {response.json()}")
        else:
            print(f"❌ Erreur inattendue: {response.status_code}")
            print(f"📄 Response: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter au serveur")
        print("💡 Assurez-vous que le serveur Django est démarré sur http://127.0.0.1:8000")
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")


if __name__ == "__main__":
    test_custom_jwt_login()
