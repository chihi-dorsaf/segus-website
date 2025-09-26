#!/usr/bin/env python
import os
import sys

import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "segus_engineering_Backend.settings")
django.setup()

from django.contrib.auth import get_user_model  # noqa: E402

from employees.models import Employee  # noqa: E402

User = get_user_model()

print("=== VÉRIFICATION RAPIDE DES EMPLOYÉS ===\n")

# Tous les employés
all_employees = Employee.objects.all()
print(f"Total employés dans la DB: {all_employees.count()}")

for emp in all_employees:
    status = "ACTIF" if emp.is_active else "INACTIF"
    print(f"- {emp.full_name or 'Sans nom'} ({emp.user.email}) | {emp.user.role} | {status}")

print("\n=== FILTRES ACTIFS ===")
active_employees = Employee.objects.filter(is_active=True)
print(f"Employés actifs: {active_employees.count()}")

for emp in active_employees:
    print(f"- {emp.full_name or 'Sans nom'} ({emp.user.email}) | {emp.user.role}")

print("\n=== QUERYSET API ===")
# Simuler le queryset de l'API
api_queryset = Employee.objects.select_related("user").all()
print(f"Queryset API total: {api_queryset.count()}")

for emp in api_queryset:
    status = "ACTIF" if emp.is_active else "INACTIF"
    print(f"- {emp.full_name or 'Sans nom'} ({emp.user.email}) | {emp.user.role} | {status}")
