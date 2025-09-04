#!/usr/bin/env python
import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'segus_engineering_Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from employees.models import Employee

User = get_user_model()

print("=== DIAGNOSTIC RAPIDE ===\n")

# Vérifier tous les utilisateurs
users = User.objects.all()
print(f"Total utilisateurs: {users.count()}")

for user in users:
    has_employee = hasattr(user, 'employee_profile')
    print(f"Email: {user.email} | Rôle: {user.role} | Profil employé: {'Oui' if has_employee else 'Non'}")

print(f"\n=== PROFILS EMPLOYÉS ===")
employees = Employee.objects.all()
print(f"Total profils employés: {employees.count()}")

for emp in employees:
    print(f"Employé: {emp.full_name} | Email: {emp.user.email} | Rôle user: {emp.user.role}")

print(f"\n=== TEST QUERYSET FILTRÉ ===")
filtered_employees = Employee.objects.filter(user__role='EMPLOYE')
print(f"Employés avec rôle EMPLOYE: {filtered_employees.count()}")

for emp in filtered_employees:
    print(f"- {emp.full_name} ({emp.user.email})")

print(f"\n=== EMPLOYÉS AVEC RÔLE ADMIN ===")
admin_employees = Employee.objects.filter(user__role='ADMIN')
print(f"Employés avec rôle ADMIN: {admin_employees.count()}")

for emp in admin_employees:
    print(f"- {emp.full_name} ({emp.user.email}) ⚠️")
