#!/usr/bin/env python
import os

import django
import requests

# Configuration Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "segus_engineering_Backend.settings")
django.setup()

# Configuration
BASE_URL = "http://127.0.0.1:8000/api"
LOGIN_URL = f"{BASE_URL}/auth/login/"
EMPLOYEES_URL = f"{BASE_URL}/employees/"
STATS_URL = f"{BASE_URL}/employees/stats/"

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


def test_endpoints():
    """Test des endpoints"""
    print("🚀 Test des endpoints")

    # Récupérer le token
    token = get_auth_token()
    if not token:
        print("❌ Impossible de récupérer le token d'authentification")
        return

    print("✅ Token récupéré avec succès")

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # Test endpoint employees
    try:
        response = requests.get(EMPLOYEES_URL, headers=headers)
        print(f"✅ Employees endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   - Nombre d'employés: {data.get('count', 0)}")
    except Exception as e:
        print(f"❌ Erreur employees endpoint: {e}")

    # Test endpoint stats
    try:
        response = requests.get(STATS_URL, headers=headers)
        print(f"✅ Stats endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   - Total employés: {data.get('total_employees', 0)}")
        else:
            print(f"   - Erreur: {response.text}")
    except Exception as e:
        print(f"❌ Erreur stats endpoint: {e}")


if __name__ == "__main__":
    test_endpoints()
