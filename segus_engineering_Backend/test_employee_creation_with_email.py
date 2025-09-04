#!/usr/bin/env python
import os
import sys
import django
import requests
import json

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'segus_engineering_Backend.settings')
django.setup()

# Configuration
BASE_URL = 'http://127.0.0.1:8000/api'
LOGIN_URL = f'{BASE_URL}/auth/login/'
EMPLOYEES_URL = f'{BASE_URL}/employees/'

# Données de connexion admin
admin_credentials = {
    'username': 'admin',
    'password': 'admin123'
}

def get_auth_token():
    """Récupère le token d'authentification"""
    try:
        response = requests.post(LOGIN_URL, json=admin_credentials)
        response.raise_for_status()
        return response.json()['access']
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")
        return None

def test_employee_creation():
    """Test de création d'employé avec génération automatique de mot de passe"""
    print("🚀 Test de création d'employé avec email")
    
    # Récupérer le token
    token = get_auth_token()
    if not token:
        print("❌ Impossible de récupérer le token d'authentification")
        return
    
    print("✅ Token récupéré avec succès")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Données du nouvel employé
    employee_data = {
        'email': 'test.employee@segus-engineering.com',
        'first_name': 'Jean',
        'last_name': 'Dupont',
        'generate_password': True,
        'position': 'Développeur Full Stack',
        'phone': '+33 1 23 45 67 89',
        'address': '123 Rue de la Paix, 75001 Paris',
        'gender': 'M',
        'hire_date': '2024-01-15',
        'salary': 45000,
        'status': 'ACTIVE',
        'emergency_contact': 'Marie Dupont',
        'emergency_phone': '+33 1 98 76 54 32',
        'notes': 'Employé test pour vérification du système d\'email'
    }
    
    try:
        print("📝 Création de l'employé...")
        response = requests.post(EMPLOYEES_URL, json=employee_data, headers=headers)
        
        if response.status_code == 201:
            result = response.json()
            print("✅ Employé créé avec succès!")
            print(f"   - Nom: {result['employee']['full_name']}")
            print(f"   - Email: {result['employee']['email']}")
            print(f"   - Position: {result['employee']['position']}")
            print(f"   - Message: {result['message']}")
            print("\n📧 Un email de bienvenue a été envoyé à l'employé avec ses identifiants de connexion.")
        else:
            print(f"❌ Erreur lors de la création: {response.status_code}")
            print(f"   - Réponse: {response.text}")
            
    except Exception as e:
        print(f"❌ Erreur: {e}")

if __name__ == '__main__':
    test_employee_creation() 