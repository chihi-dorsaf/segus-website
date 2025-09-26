#!/usr/bin/env python
import os
import sys

import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "segus_engineering_Backend.settings")
django.setup()

from django.contrib.auth import get_user_model  # noqa: E402
from django.db import transaction  # noqa: E402

from employees.models import Employee  # noqa: E402

User = get_user_model()

print("=== SUPPRESSION DU PROFIL EMPLOYÉ ADMIN ===\n")

# Trouver l'administrateur avec profil employé
admin_email = "chihidorsaf99@gmail.com"
try:
    user = User.objects.get(email=admin_email)
    employee = Employee.objects.get(user=user)

    print(f"Trouvé: {employee.full_name} ({admin_email})")
    print(f"Rôle utilisateur: {user.role}")

    # Supprimer le profil employé
    with transaction.atomic():
        employee.delete()
        print(f"✅ Profil employé supprimé pour {admin_email}")
        print("💡 L'utilisateur peut toujours se connecter comme administrateur")

except Employee.DoesNotExist:
    print(f"❌ Aucun profil employé trouvé pour {admin_email}")
except User.DoesNotExist:
    print(f"❌ Utilisateur {admin_email} non trouvé")

print("\n=== VÉRIFICATION FINALE ===")
remaining_admin_employees = Employee.objects.filter(user__role="ADMIN").count()
total_employees = Employee.objects.filter(user__role="EMPLOYE").count()

print(f"Profils employés avec rôle ADMIN: {remaining_admin_employees}")
print(f"Profils employés avec rôle EMPLOYE: {total_employees}")

if remaining_admin_employees == 0:
    print("✅ Problème résolu ! Redémarrez le serveur.")
else:
    print("⚠️ Il reste encore des profils employés avec rôle ADMIN")
