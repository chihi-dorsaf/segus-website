from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from employees.models import Employee
from gamification.models import (
    Badge,
    DailyObjective,
    DailyPerformance,
    EmployeeBadge,
    MonthlyPerformance,
    SubTask,
)

User = get_user_model()


class DailyObjectiveModelTest(TestCase):
    """Tests pour le modèle DailyObjective"""

    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
            role="ADMIN",
        )

        self.employee_user = User.objects.create_user(
            username="employee",
            email="employee@example.com",
            password="emppass123",
            role="EMPLOYE",
        )

        self.employee = Employee.objects.create(user=self.employee_user)

    def test_create_daily_objective(self):
        """Test de création d'un objectif quotidien"""
        objective = DailyObjective.objects.create(
            employee=self.employee,
            date=date.today(),
            target_subtasks=10,
            target_hours=Decimal("8.00"),
            created_by=self.admin_user,
        )

        self.assertEqual(objective.employee, self.employee)
        self.assertEqual(objective.target_subtasks, 10)
        self.assertEqual(objective.target_hours, Decimal("8.00"))
        self.assertEqual(objective.created_by, self.admin_user)

    def test_unique_constraint_employee_date(self):
        """Test de contrainte d'unicité employé-date"""
        DailyObjective.objects.create(
            employee=self.employee,
            date=date.today(),
            target_subtasks=10,
            target_hours=Decimal("8.00"),
            created_by=self.admin_user,
        )

        # Tentative de création d'un autre objectif pour le même employé et la même date
        with self.assertRaises(Exception):  # IntegrityError
            DailyObjective.objects.create(
                employee=self.employee,
                date=date.today(),
                target_subtasks=5,
                target_hours=Decimal("6.00"),
                created_by=self.admin_user,
            )

    def test_string_representation(self):
        """Test de la représentation string"""
        objective = DailyObjective.objects.create(
            employee=self.employee,
            date=date.today(),
            target_subtasks=12,
            target_hours=Decimal("7.50"),
            created_by=self.admin_user,
        )

        expected = f"{self.employee.user.get_full_name()} - {date.today()} - 12 tâches, 7.50h"
        self.assertEqual(str(objective), expected)

    def test_default_values(self):
        """Test des valeurs par défaut"""
        objective = DailyObjective.objects.create(
            employee=self.employee, created_by=self.admin_user
        )

        self.assertEqual(objective.date, date.today())
        self.assertEqual(objective.target_subtasks, 0)
        self.assertEqual(objective.target_hours, Decimal("8.00"))


class SubTaskModelTest(TestCase):
    """Tests pour le modèle SubTask de gamification"""

    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
            role="ADMIN",
        )

        self.employee_user = User.objects.create_user(
            username="employee",
            email="employee@example.com",
            password="emppass123",
            role="EMPLOYE",
        )

        self.employee = Employee.objects.create(user=self.employee_user)

    def test_create_subtask(self):
        """Test de création d'une sous-tâche"""
        subtask = SubTask.objects.create(
            employee=self.employee,
            title="Tâche de test",
            description="Description de la tâche",
            assigned_date=date.today(),
            created_by=self.admin_user,
        )

        self.assertEqual(subtask.employee, self.employee)
        self.assertEqual(subtask.title, "Tâche de test")
        self.assertEqual(subtask.status, "pending")
        self.assertEqual(subtask.created_by, self.admin_user)

    def test_subtask_status_choices(self):
        """Test des choix de statut"""
        subtask = SubTask.objects.create(
            employee=self.employee, title="Tâche de test", created_by=self.admin_user
        )

        valid_statuses = ["pending", "in_progress", "completed", "cancelled"]
        for status in valid_statuses:
            subtask.status = status
            subtask.save()
            subtask.refresh_from_db()
            self.assertEqual(subtask.status, status)

    def test_complete_subtask(self):
        """Test de completion d'une sous-tâche"""
        subtask = SubTask.objects.create(
            employee=self.employee, title="Tâche à terminer", created_by=self.admin_user
        )

        # Marquer comme terminée
        subtask.status = "completed"
        subtask.completed_date = timezone.now()
        subtask.save()

        self.assertEqual(subtask.status, "completed")
        self.assertIsNotNone(subtask.completed_date)

    def test_subtask_duration_tracking(self):
        """Test du suivi de durée"""
        estimated_duration = timedelta(hours=2)
        actual_duration = timedelta(hours=2, minutes=30)

        subtask = SubTask.objects.create(
            employee=self.employee,
            title="Tâche avec durée",
            estimated_duration=estimated_duration,
            actual_duration=actual_duration,
            created_by=self.admin_user,
        )

        self.assertEqual(subtask.estimated_duration, estimated_duration)
        self.assertEqual(subtask.actual_duration, actual_duration)


class DailyPerformanceModelTest(TestCase):
    """Tests pour le modèle DailyPerformance"""

    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
            role="ADMIN",
        )

        self.employee_user = User.objects.create_user(
            username="employee",
            email="employee@example.com",
            password="emppass123",
            role="EMPLOYE",
        )

        self.employee = Employee.objects.create(user=self.employee_user)

        # Créer un objectif quotidien
        self.daily_objective = DailyObjective.objects.create(
            employee=self.employee,
            date=date.today(),
            target_subtasks=10,
            target_hours=Decimal("8.00"),
            created_by=self.admin_user,
        )

    def test_create_daily_performance(self):
        """Test de création d'une performance quotidienne"""
        performance = DailyPerformance.objects.create(
            employee=self.employee,
            date=date.today(),
            completed_subtasks=8,
            worked_hours=Decimal("7.50"),
            overtime_hours=Decimal("0.00"),
        )

        self.assertEqual(performance.employee, self.employee)
        self.assertEqual(performance.completed_subtasks, 8)
        self.assertEqual(performance.worked_hours, Decimal("7.50"))
        self.assertEqual(performance.overtime_hours, Decimal("0.00"))

    def test_calculate_performance_goals_met(self):
        """Test de calcul de performance avec objectifs atteints"""
        # Créer des sous-tâches terminées
        for i in range(10):
            SubTask.objects.create(
                employee=self.employee,
                title=f"Tâche {i+1}",
                status="completed",
                assigned_date=date.today(),
                completed_date=timezone.now(),
                created_by=self.admin_user,
            )

        performance = DailyPerformance.objects.create(
            employee=self.employee,
            date=date.today(),
            worked_hours=Decimal("10.00"),  # 2h d'overtime
        )

        performance.calculate_performance()
        performance.refresh_from_db()

        self.assertEqual(performance.completed_subtasks, 10)
        self.assertEqual(performance.overtime_hours, Decimal("2.00"))
        self.assertEqual(performance.daily_stars_earned, Decimal("0.25"))  # ¼ étoile
        self.assertGreater(performance.bonus_points, 0)

    def test_calculate_performance_goals_not_met(self):
        """Test de calcul de performance avec objectifs non atteints"""
        # Créer seulement 5 sous-tâches terminées (objectif: 10)
        for i in range(5):
            SubTask.objects.create(
                employee=self.employee,
                title=f"Tâche {i+1}",
                status="completed",
                assigned_date=date.today(),
                completed_date=timezone.now(),
                created_by=self.admin_user,
            )

        performance = DailyPerformance.objects.create(
            employee=self.employee,
            date=date.today(),
            worked_hours=Decimal("6.00"),  # Moins que l'objectif de 8h
        )

        performance.calculate_performance()
        performance.refresh_from_db()

        self.assertEqual(performance.completed_subtasks, 5)
        self.assertEqual(performance.overtime_hours, Decimal("0.00"))
        self.assertEqual(performance.daily_stars_earned, Decimal("0.00"))  # Pas d'étoile
        self.assertEqual(performance.bonus_points, 5)  # 1 point par sous-tâche


class MonthlyPerformanceModelTest(TestCase):
    """Tests pour le modèle MonthlyPerformance"""

    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
            role="ADMIN",
        )

        self.employee_user = User.objects.create_user(
            username="employee",
            email="employee@example.com",
            password="emppass123",
            role="EMPLOYE",
        )

        self.employee = Employee.objects.create(user=self.employee_user)

    def test_create_monthly_performance(self):
        """Test de création d'une performance mensuelle"""
        performance = MonthlyPerformance.objects.create(
            employee=self.employee,
            year=date.today().year,
            month=date.today().month,
            total_completed_subtasks=200,
            total_worked_hours=Decimal("160.00"),
            total_overtime_hours=Decimal("40.00"),
        )

        self.assertEqual(performance.employee, self.employee)
        self.assertEqual(performance.total_completed_subtasks, 200)
        self.assertEqual(performance.total_overtime_hours, Decimal("40.00"))

    def test_calculate_monthly_performance_with_bonus(self):
        """Test de calcul de performance mensuelle avec bonus"""
        # Créer des performances quotidiennes pour le mois
        month_start = date.today().replace(day=1)
        for day in range(1, 21):  # 20 jours de travail
            current_date = month_start.replace(day=day)
            DailyPerformance.objects.create(
                employee=self.employee,
                date=current_date,
                completed_subtasks=10,
                worked_hours=Decimal("10.00"),  # 2h d'overtime par jour
                overtime_hours=Decimal("2.00"),
                daily_stars_earned=Decimal("0.25"),
                bonus_points=20,
            )

        performance = MonthlyPerformance.objects.create(
            employee=self.employee, 
            year=month_start.year,
            month=month_start.month
        )

        performance.calculate_monthly_performance()
        performance.refresh_from_db()

        self.assertEqual(performance.total_completed_subtasks, 200)
        self.assertEqual(performance.total_overtime_hours, Decimal("40.00"))
        self.assertEqual(performance.regularity_stars, Decimal("5.00"))  # 20 * 0.25
        self.assertEqual(performance.overtime_bonus_stars, Decimal("0.50"))  # Bonus pour >32h overtime
        self.assertEqual(performance.total_monthly_stars, Decimal("5.50"))


class BadgeModelTest(TestCase):
    """Tests pour le modèle Badge"""

    def test_create_badge(self):
        """Test de création d'un badge"""
        badge = Badge.objects.create(
            name="Développeur Expert",
            description="Badge pour les développeurs expérimentés",
            icon="expert.png",
            required_stars=10,
            required_points=500,
            salary_increase_percentage=Decimal("5.00"),
        )

        self.assertEqual(badge.name, "Développeur Expert")
        self.assertEqual(badge.required_stars, 10)
        self.assertEqual(badge.salary_increase_percentage, Decimal("5.00"))

    def test_badge_string_representation(self):
        """Test de la représentation string du badge"""
        badge = Badge.objects.create(
            name="Badge Test",
            description="Description test",
            required_stars=5,
            required_points=100,
        )

        expected = "Badge Test - 5 étoiles - 100 points"
        self.assertEqual(str(badge), expected)


class EmployeeBadgeModelTest(TestCase):
    """Tests pour le modèle EmployeeBadge"""

    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.employee_user = User.objects.create_user(
            username="employee",
            email="employee@example.com",
            password="emppass123",
            role="EMPLOYE",
        )

        self.employee = Employee.objects.create(user=self.employee_user)

        self.badge = Badge.objects.create(
            name="Premier Badge",
            description="Premier badge obtenu",
            required_stars=5,
            required_points=100,
            salary_increase_percentage=Decimal("2.50"),
        )

    def test_create_employee_badge(self):
        """Test d'attribution d'un badge à un employé"""
        employee_badge = EmployeeBadge.objects.create(
            employee=self.employee,
            badge=self.badge,
            stars_at_earning=6,
            points_at_earning=120,
        )

        self.assertEqual(employee_badge.employee, self.employee)
        self.assertEqual(employee_badge.badge, self.badge)
        self.assertEqual(employee_badge.stars_at_earning, 6)
        self.assertEqual(employee_badge.points_at_earning, 120)
        self.assertIsNotNone(employee_badge.earned_date)

    def test_unique_constraint_employee_badge(self):
        """Test de contrainte d'unicité employé-badge"""
        EmployeeBadge.objects.create(
            employee=self.employee,
            badge=self.badge,
            stars_at_earning=5,
            points_at_earning=100,
        )

        # Tentative d'attribution du même badge au même employé
        with self.assertRaises(Exception):  # IntegrityError
            EmployeeBadge.objects.create(
                employee=self.employee,
                badge=self.badge,
                stars_at_earning=6,
                points_at_earning=120,
            )

    def test_employee_badge_string_representation(self):
        """Test de la représentation string"""
        employee_badge = EmployeeBadge.objects.create(
            employee=self.employee,
            badge=self.badge,
            stars_at_earning=5,
            points_at_earning=100,
        )

        expected = f"{self.employee.user.get_full_name()} - {self.badge.name}"
        self.assertEqual(str(employee_badge), expected)
