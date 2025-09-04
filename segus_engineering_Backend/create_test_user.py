#!/usr/bin/env python3
"""
Création d'un utilisateur de test pour la connexion par email
"""

import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'segus_engineering_Backend.settings')
django.setup()

from users.models import User
from employees.models import Employee

def create_test_user():
    """Créer un utilisateur de test pour la connexion"""
    print("🚀 Création d'un utilisateur de test pour la connexion")
    
    test_email = 'chihidorsaf2001@gmail.com'
    test_password = 'testpassword123'
    
    try:
        # Vérifier si l'utilisateur existe déjà
        user = User.objects.filter(email=test_email).first()
        if user:
            print(f"✅ Utilisateur existant trouvé: {user.username}")
            print(f"   Email: {user.email}")
            print(f"   Rôle: {user.role}")
            
            # Mettre à jour le mot de passe pour le test
            user.set_password(test_password)
            user.save()
            print(f"   Mot de passe mis à jour pour le test")
        else:
            # Créer un nouvel utilisateur de test
            user = User.objects.create_user(
                username='chihidorsaf2001',
                email=test_email,
                password=test_password,
                first_name='Dorsaf',
                last_name='Chihi',
                role='ADMIN'
            )
            print(f"✅ Utilisateur créé: {user.username}")
            print(f"   Email: {user.email}")
            print(f"   Rôle: {user.role}")
        
        # Créer un employé associé si nécessaire
        employee, created = Employee.objects.get_or_create(
            user=user,
            defaults={
                'matricule': 'EMP-2025-TEST',
                'position': 'Administrateur Test',
                'phone': '0123456789',
                'address': 'Adresse de test',
                'gender': 'F',
                'hire_date': '2025-01-01',
                'salary': 50000,
                'status': 'ACTIVE'
            }
        )
        
        if created:
            print(f"✅ Employé créé: {employee.matricule}")
        else:
            print(f"✅ Employé existant: {employee.matricule}")
        
        print("\n📋 Informations de connexion:")
        print(f"   Email: {test_email}")
        print(f"   Mot de passe: {test_password}")
        print(f"   Rôle: {user.role}")
        
    except Exception as e:
        print(f"❌ Erreur lors de la création: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_test_user() 