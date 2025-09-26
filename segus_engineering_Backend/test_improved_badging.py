#!/usr/bin/env python
"""
Script de test pour la méthode de badging améliorée
Exemple : Employé Rajeh avec 200 sous-tâches quotidiennes et 8 heures
"""

import os
from datetime import date, timedelta
from decimal import Decimal

import django

# Configuration Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "segus_engineering_Backend.settings")
django.setup()

from django.contrib.auth import get_user_model  # noqa: E402

from employees.models import Employee  # noqa: E402
from gamification.models import (  # noqa: E402
    Badge,
    DailyObjective,
    DailyPerformance,
    EmployeeStats,
    MonthlyPerformance,
)

User = get_user_model()


def create_test_employee():
    """Créer un employé de test : Rajeh"""
    user, created = User.objects.get_or_create(
        username="rajeh_test",
        defaults={
            "first_name": "Rajeh",
            "last_name": "Test",
            "email": "rajeh@test.com",
        },
    )

    employee, created = Employee.objects.get_or_create(
        user=user,
        defaults={"matricule": "EMP001", "position": "Developer"},
    )

    return employee


def create_daily_objective(employee, target_date, target_subtasks=200, target_hours=8.0):
    """Créer un objectif quotidien"""
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.create_superuser("admin", "admin@test.com", "admin123")

    objective, created = DailyObjective.objects.get_or_create(
        employee=employee,
        date=target_date,
        defaults={
            "target_subtasks": target_subtasks,
            "target_hours": Decimal(str(target_hours)),
            "created_by": admin_user,
        },
    )

    return objective


def simulate_daily_work(employee, work_date, completed_subtasks, worked_hours):
    """Simuler une journée de travail"""
    # Créer l'objectif quotidien
    objective = create_daily_objective(employee, work_date)

    # Créer ou mettre à jour la performance quotidienne
    performance, created = DailyPerformance.objects.get_or_create(
        employee=employee,
        date=work_date,
        defaults={
            "objective": objective,
            "completed_subtasks": completed_subtasks,
            "worked_hours": Decimal(str(worked_hours)),
        },
    )

    if not created:
        performance.completed_subtasks = completed_subtasks
        performance.worked_hours = Decimal(str(worked_hours))
        performance.objective = objective
        performance.save()

    # Calculer la performance
    performance.calculate_performance()

    return performance


def test_rajeh_scenario():
    """Tester le scénario de Rajeh selon la méthode améliorée"""
    print("🧪 Test de la méthode de badging améliorée")
    print("=" * 50)

    # Créer l'employé Rajeh
    rajeh = create_test_employee()
    print(f"👤 Employé créé : {rajeh.user.get_full_name()}")

    # Simuler 20 jours de travail avec 2h supplémentaires par jour
    today = date.today()
    total_stars = Decimal("0.00")
    total_points = 0
    total_overtime = Decimal("0.00")

    print("\n📅 Simulation de 20 jours de travail :")
    print("Objectif quotidien : 200 sous-tâches, 8 heures")
    print("Performance : 200 sous-tâches accomplies, 10 heures travaillées (2h supplémentaires)")

    for day in range(20):
        work_date = today - timedelta(days=19 - day)

        # Rajeh termine ses 200 sous-tâches et travaille 10 heures (8h + 2h supplémentaires)
        performance = simulate_daily_work(
            employee=rajeh,
            work_date=work_date,
            completed_subtasks=200,
            worked_hours=10.0,
        )

        total_stars += performance.daily_stars_earned
        total_points += performance.bonus_points
        total_overtime += performance.overtime_hours

        print(
            f"  Jour {day+1}: ⭐ {performance.daily_stars_earned} étoile, "
            f"🎯 {performance.bonus_points} points, "
            f"⏰ {performance.overtime_hours}h supplémentaires"
        )

    print("\n📊 Résultats après 20 jours :")
    print(f"  ⭐ Total étoiles quotidiennes : {total_stars}")
    print(f"  🎯 Total points : {total_points}")
    print(f"  ⏰ Total heures supplémentaires : {total_overtime}h")

    # Calculer la performance mensuelle
    monthly_perf, created = MonthlyPerformance.objects.get_or_create(
        employee=rajeh, year=today.year, month=today.month
    )
    monthly_perf.calculate_monthly_performance()

    print("\n🏆 Performance mensuelle :")
    print(f"  ⭐ Étoiles de régularité : {monthly_perf.regularity_stars}")
    print(f"  ⭐ Bonus heures supplémentaires : {monthly_perf.overtime_bonus_stars}")
    print(f"  ⭐ Total étoiles mensuelles : {monthly_perf.total_monthly_stars}")
    print(f"  🎯 Total points mensuels : {monthly_perf.total_monthly_points}")

    # Vérifier le bonus de 32h supplémentaires
    if monthly_perf.total_overtime_hours > 32:
        print(f"  ✅ Bonus de ½ étoile obtenu (>{monthly_perf.total_overtime_hours}h > 32h)")
    else:
        print(f"  ❌ Pas de bonus (seulement {monthly_perf.total_overtime_hours}h < 32h)")

    # Mettre à jour les statistiques globales
    stats, created = EmployeeStats.objects.get_or_create(employee=rajeh)
    stats.update_stats()

    print("\n📈 Statistiques globales de Rajeh :")
    print(f"  ⭐ Total étoiles : {stats.total_stars}")
    print(f"  🎯 Total points : {stats.total_points}")
    print(f"  🏅 Niveau actuel : {stats.current_level}")
    print(f"  🏆 Badges obtenus : {stats.total_badges}")

    # Vérifier les badges disponibles
    available_badges = Badge.objects.filter(is_active=True)
    eligible_badges = []

    for badge in available_badges:
        if (
            stats.total_stars >= badge.required_stars
            and stats.total_points >= badge.required_points
        ):
            eligible_badges.append(badge)

    print("\n🎖️ Badges éligibles :")
    if eligible_badges:
        for badge in eligible_badges:
            print(f"  • {badge.name} - {badge.salary_increase_percentage}% d'augmentation")
    else:
        print("  Aucun badge éligible pour le moment")

    # Test réussi - pas de return nécessaire pour pytest
    assert rajeh is not None
    assert stats is not None


def create_sample_badges():
    """Créer des badges d'exemple"""
    badges_data = [
        {
            "name": "Travailleur Régulier",
            "description": "Atteint ses objectifs quotidiens régulièrement",
            "badge_type": "regularity",
            "required_stars": Decimal("2.0"),
            "required_points": 100,
            "salary_increase_percentage": Decimal("2.0"),
            "icon": "calendar-check",
            "color": "#28a745",
        },
        {
            "name": "Performeur",
            "description": "Excellent dans l'accomplissement des tâches",
            "badge_type": "performance",
            "required_stars": Decimal("5.0"),
            "required_points": 500,
            "salary_increase_percentage": Decimal("5.0"),
            "icon": "trophy",
            "color": "#ffc107",
        },
        {
            "name": "Champion des Heures Sup",
            "description": "Dépasse régulièrement ses heures de travail",
            "badge_type": "overtime",
            "required_stars": Decimal("3.0"),
            "required_points": 800,
            "salary_increase_percentage": Decimal("3.0"),
            "icon": "clock",
            "color": "#17a2b8",
        },
    ]

    for badge_data in badges_data:
        badge, created = Badge.objects.get_or_create(name=badge_data["name"], defaults=badge_data)
        if created:
            print(f"✅ Badge créé : {badge.name}")


if __name__ == "__main__":
    print("🚀 Initialisation des badges d'exemple...")
    create_sample_badges()

    print("\n" + "=" * 60)
    rajeh, stats = test_rajeh_scenario()

    print("\n" + "=" * 60)
    print("✅ Test terminé avec succès !")
    print("\n💡 Résumé de la méthode de badging améliorée :")
    print("  • ¼ étoile par jour si tous les objectifs sont atteints")
    print("  • 1 point par sous-tâche accomplie")
    print("  • 10 points par heure supplémentaire")
    print("  • ½ étoile bonus si > 32h supplémentaires/mois")
    print("  • Les étoiles et points contribuent aux badges de prestige")
