#!/usr/bin/env python3
"""
Test de création d'employé avec envoi d'email
"""

import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'segus_engineering_Backend.settings')
django.setup()

from employees.models import Employee
from employees.serializers import EmployeeCreateSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

def test_employee_creation_with_email():
    """Test de création d'employé avec envoi d'email"""
    print("🚀 Test de création d'employé avec envoi d'email")
    
    # Données de test
    employee_data = {
        'email': 'nouveau.employee@segus-engineering.com',
        'first_name': 'Nouveau',
        'last_name': 'Employee',
        'generate_password': True,
        'position': 'Développeur',
        'phone': '0123456789',
        'address': '123 Rue de Test, 75001 Paris',
        'birth_date': '1990-01-01',
        'gender': 'M',
        'hire_date': '2025-08-06',
        'salary': 45000,
        'status': 'ACTIVE',
        'emergency_contact': 'Contact Urgence',
        'emergency_phone': '0987654321',
        'notes': 'Employé de test'
    }
    
    try:
        print("📝 Données de l'employé:")
        for key, value in employee_data.items():
            print(f"   {key}: {value}")
        
        # Créer l'employé avec le sérialiseur
        serializer = EmployeeCreateSerializer(data=employee_data)
        
        if serializer.is_valid():
            print("✅ Données valides")
            employee = serializer.save()
            print(f"✅ Employé créé avec succès!")
            print(f"   ID: {employee.id}")
            print(f"   Matricule: {employee.matricule}")
            print(f"   Nom: {employee.full_name}")
            print(f"   Email: {employee.email}")
            print(f"   Username: {employee.user.username}")
            print(f"   Email envoyé: {'Oui' if employee_data['generate_password'] else 'Non'}")
        else:
            print("❌ Erreur de validation:")
            for field, errors in serializer.errors.items():
                print(f"   {field}: {errors}")
                
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_employee_creation_with_email() 