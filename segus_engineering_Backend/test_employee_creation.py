#!/usr/bin/env python
import os

import django
import requests

# Configuration Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "segus_engineering_Backend.settings")
django.setup()


# Configuration
BASE_URL = "http://localhost:8000/api"
LOGIN_URL = f"{BASE_URL}/auth/login/"
EMPLOYEES_URL = f"{BASE_URL}/employees/"

# Données de connexion admin
admin_credentials = {"username": "admin", "password": "admin123"}


def get_auth_token():
    """Récupère le token d'authentification"""
    try:
        response = requests.post(LOGIN_URL, json=admin_credentials)
        response.raise_for_status()
        return response.json()["access"]
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")
        return None


def create_test_employee(token):
    """Crée un employé de test"""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    employee_data = {
        "username": "test.employee",
        "email": "test.employee@example.com",
        "password": "testpass123",
        "first_name": "Test",
        "last_name": "Employee",
        "position": "Développeur",
        "phone": "+33123456789",
        "address": "123 Rue de Test, Paris",
        "gender": "M",
        "hire_date": "2024-01-15",
        "salary": 45000.00,
        "status": "ACTIVE",
        "emergency_contact": "Jean Dupont",
        "emergency_phone": "+33987654321",
        "notes": "Employé de test",
    }

    try:
        response = requests.post(EMPLOYEES_URL, json=employee_data, headers=headers)
        response.raise_for_status()
        print(f"✅ Employé créé: {response.json()}")
        return response.json()
    except Exception as e:
        print(f"❌ Erreur création employé: {e}")
        if hasattr(e, "response") and e.response is not None:
            print(f"Détails: {e.response.text}")
        return None


def main():
    print("🚀 Test de création d'employé")

    # Récupérer le token
    token = get_auth_token()
    if not token:
        print("❌ Impossible de récupérer le token d'authentification")
        return

    print("✅ Token récupéré avec succès")

    # Créer l'employé de test
    result = create_test_employee(token)
    if result:
        print("✅ Test terminé avec succès")
    else:
        print("❌ Test échoué")


if __name__ == "__main__":
    main()
