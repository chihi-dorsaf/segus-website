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


def fix_admin_employee_roles():
    print("=== CORRECTION DES RÔLES ADMINISTRATEURS/EMPLOYÉS ===\n")

    # Identifier les profils employés avec rôle ADMIN
    admin_employees = Employee.objects.filter(user__role="ADMIN")

    if not admin_employees.exists():
        print("✅ Aucun problème détecté. Tous les profils employés ont le bon rôle.")
        return

    print(f"⚠️  {admin_employees.count()} profil(s) employé(s) avec rôle ADMIN détecté(s):")
    for employee in admin_employees:
        print(f"   - {employee.user.email} ({employee.full_name})")

    print("\n🔧 Options de correction:")
    print("1. Supprimer les profils employés des administrateurs (recommandé)")
    print("2. Changer le rôle des utilisateurs vers EMPLOYE")
    print("3. Annuler")

    choice = input("\nChoisissez une option (1/2/3): ").strip()

    if choice == "1":
        # Option 1: Supprimer les profils employés des administrateurs
        with transaction.atomic():
            deleted_count = 0
            for employee in admin_employees:
                email = employee.user.email
                name = employee.full_name
                employee.delete()
                deleted_count += 1
                print(f"🗑️  Profil employé supprimé: {email} ({name})")

            print(f"\n✅ {deleted_count} profil(s) employé(s) supprimé(s) avec succès.")
            print(
                "💡 Les utilisateurs administrateurs peuvent toujours se connecter mais n'apparaîtront plus dans la liste des employés."
            )

    elif choice == "2":
        # Option 2: Changer le rôle vers EMPLOYE
        with transaction.atomic():
            changed_count = 0
            for employee in admin_employees:
                user = employee.user
                old_role = user.role
                user.role = "EMPLOYE"
                user.save()
                changed_count += 1
                print(f"🔄 Rôle changé: {user.email} ({old_role} → EMPLOYE)")

            print(f"\n✅ {changed_count} rôle(s) changé(s) avec succès.")
            print("⚠️  Attention: Ces utilisateurs n'auront plus les permissions administrateur.")

    elif choice == "3":
        print("❌ Opération annulée.")
        return

    else:
        print("❌ Option invalide. Opération annulée.")
        return

    print("\n🔄 Redémarrez le serveur Django pour appliquer les changements.")


def show_current_state():
    print("=== ÉTAT ACTUEL ===\n")

    # Statistiques générales
    total_users = User.objects.count()
    admin_users = User.objects.filter(role="ADMIN").count()
    employee_users = User.objects.filter(role="EMPLOYE").count()
    total_employees = Employee.objects.count()

    print(f"👥 Total utilisateurs: {total_users}")
    print(f"👑 Administrateurs: {admin_users}")
    print(f"👤 Employés (rôle): {employee_users}")
    print(f"📋 Profils employés: {total_employees}")

    # Problèmes détectés
    admin_with_employee_profile = Employee.objects.filter(user__role="ADMIN").count()
    if admin_with_employee_profile > 0:
        print(
            f"\n⚠️  PROBLÈME: {admin_with_employee_profile} administrateur(s) ont un profil employé"
        )
    else:
        print("\n✅ Aucun problème détecté")


if __name__ == "__main__":
    show_current_state()
    print("\n" + "=" * 50)
    fix_admin_employee_roles()
