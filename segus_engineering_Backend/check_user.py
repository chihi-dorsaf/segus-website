#!/usr/bin/env python
import os

import django

# Configuration Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "segus_engineering_Backend.settings")
django.setup()

from users.models import User  # noqa: E402


def check_users():
    """Vérifier les utilisateurs existants"""
    print("👥 Vérification des utilisateurs...")

    users = User.objects.all()
    print(f"📊 Nombre total d'utilisateurs: {users.count()}")

    for user in users:
        print(
            f"👤 {user.username} - Email: {user.email} - Rôle: {user.role} - Actif: {user.is_active}"
        )

    # Vérifier les admins
    admins = User.objects.filter(role="ADMIN")
    print(f"\n👑 Admins trouvés: {admins.count()}")
    for admin in admins:
        print(f"  - {admin.username} ({admin.email})")

    # Vérifier les employés
    employees = User.objects.filter(role="EMPLOYE")
    print(f"\n👷 Employés trouvés: {employees.count()}")
    for employee in employees:
        print(f"  - {employee.username} ({employee.email})")


if __name__ == "__main__":
    check_users()
