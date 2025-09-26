#!/usr/bin/env python3
"""
Test direct de création d'employé sans authentification
"""

import requests


def test_employee_creation():
    """Test direct de création d'employé"""
    print("🚀 Test direct de création d'employé")

    # Données de test
    employee_data = {
        "email": "test.employee@segus-engineering.com",
        "first_name": "Test",
        "last_name": "Employee",
        "generate_password": True,
        "position": "Développeur",
        "phone": "0123456789",
        "address": "123 Rue de Test, 75001 Paris",
        "birth_date": "1990-01-01",
        "gender": "M",
        "hire_date": "2025-08-06",
        "salary": 45000,
        "status": "ACTIVE",
        "emergency_contact": "Contact Urgence",
        "emergency_phone": "0987654321",
        "notes": "Employé de test",
    }

    try:
        # Test de création d'employé
        response = requests.post(
            "http://127.0.0.1:8000/api/employees/",
            json=employee_data,
            headers={"Content-Type": "application/json"},
        )

        print(f"📊 Status Code: {response.status_code}")
        print(f"📝 Response Headers: {dict(response.headers)}")

        if response.status_code == 201:
            print("✅ Employé créé avec succès!")
            print(f"📄 Response: {response.json()}")
        elif response.status_code == 400:
            print("❌ Erreur de validation:")
            print(f"📄 Response: {response.json()}")
        elif response.status_code == 401:
            print("🔒 Authentification requise (normal)")
        else:
            print(f"❌ Erreur inattendue: {response.status_code}")
            print(f"📄 Response: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter au serveur")
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")


if __name__ == "__main__":
    test_employee_creation()
