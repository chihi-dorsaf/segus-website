#!/usr/bin/env python3
"""
Test du système de reset password
"""

import os
import sys
import django
import requests
import json

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'segus_engineering_Backend.settings')
django.setup()

def test_forgot_password():
    """Test du système de reset password"""
    print("🚀 Test du système de reset password")
    
    # Données de test
    test_data = {
        'email': 'chihidorsaf2001@gmail.com'
    }
    
    try:
        # Test de la demande de reset password
        response = requests.post(
            'http://127.0.0.1:8000/api/employees/forgot-password/',
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📝 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ Demande de reset password réussie!")
            response_data = response.json()
            print(f"📄 Message: {response_data.get('message', 'Non trouvé')}")
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
    test_forgot_password() 