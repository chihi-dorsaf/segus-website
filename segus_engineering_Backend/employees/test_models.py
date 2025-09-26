from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from employees.models import Employee, WorkSession

User = get_user_model()


class EmployeeModelTest(TestCase):
    """Tests pour le modèle Employee"""

    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.user = User.objects.create_user(
            username="employee1",
            email="employee1@example.com",
            password="testpass123",
            first_name="John",
            last_name="Doe",
        )

    def test_create_employee(self):
        """Test de création d'un employé"""
        employee = Employee.objects.create(
            user=self.user,
            position="Développeur",
            phone="+216 12 345 678",
            salary=2500.000,
        )

        self.assertEqual(employee.user, self.user)
        self.assertEqual(employee.position, "Développeur")
        self.assertEqual(employee.phone, "+216 12 345 678")
        self.assertEqual(employee.salary, 2500.000)
        self.assertTrue(employee.is_active)

    def test_auto_generate_matricule(self):
        """Test de génération automatique du matricule"""
        employee = Employee.objects.create(user=self.user)
        expected_matricule = f"EMP-{self.user.id:04d}"
        self.assertEqual(employee.matricule, expected_matricule)

    def test_manual_matricule(self):
        """Test de matricule manuel"""
        employee = Employee.objects.create(user=self.user, matricule="CUSTOM-001")
        self.assertEqual(employee.matricule, "CUSTOM-001")

    def test_full_name_property(self):
        """Test de la propriété full_name"""
        employee = Employee.objects.create(user=self.user)
        self.assertEqual(employee.full_name, "John Doe")

    def test_email_property(self):
        """Test de la propriété email"""
        employee = Employee.objects.create(user=self.user)
        self.assertEqual(employee.email, "employee1@example.com")

    def test_string_representation(self):
        """Test de la représentation string"""
        employee = Employee.objects.create(user=self.user, position="Développeur")
        expected = f"{self.user.get_full_name()} - Développeur"
        self.assertEqual(str(employee), expected)

    def test_string_representation_without_position(self):
        """Test de la représentation string sans poste"""
        employee = Employee.objects.create(user=self.user)
        expected = f"{self.user.get_full_name()} - Sans poste"
        self.assertEqual(str(employee), expected)

    def test_generate_matricule_without_user(self):
        """Test de génération de matricule sans utilisateur"""
        employee = Employee()
        with self.assertRaises((ValueError, AttributeError)):
            employee.generate_matricule()


class WorkSessionModelTest(TestCase):
    """Tests pour le modèle WorkSession"""

    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.user = User.objects.create_user(
            username="worker1", email="worker1@example.com", password="testpass123"
        )
        self.employee = Employee.objects.create(user=self.user)

    def test_create_work_session(self):
        """Test de création d'une session de travail"""
        session = WorkSession.objects.create(employee=self.employee)

        self.assertEqual(session.employee, self.employee)
        self.assertEqual(session.status, "active")
        self.assertIsNotNone(session.start_time)
        self.assertIsNone(session.end_time)
        self.assertEqual(session.total_pause_time, timedelta(0))

    def test_pause_session(self):
        """Test de mise en pause d'une session"""
        session = WorkSession.objects.create(employee=self.employee)

        session.pause_session()
        session.refresh_from_db()

        self.assertEqual(session.status, "paused")
        self.assertIsNotNone(session.pause_start_time)

    def test_resume_session(self):
        """Test de reprise d'une session en pause"""
        session = WorkSession.objects.create(employee=self.employee)

        # Mettre en pause
        session.pause_session()
        _ = session.pause_start_time

        # Simuler une pause de 30 minutes
        session.pause_start_time = timezone.now() - timedelta(minutes=30)
        session.save()

        # Reprendre
        session.resume_session()
        session.refresh_from_db()

        self.assertEqual(session.status, "active")
        self.assertIsNone(session.pause_start_time)
        self.assertGreater(session.total_pause_time, timedelta(minutes=25))

    def test_end_session(self):
        """Test de fin de session"""
        session = WorkSession.objects.create(employee=self.employee)

        # Simuler 8 heures de travail
        session.start_time = timezone.now() - timedelta(hours=8)
        session.save()

        session.end_session()
        session.refresh_from_db()

        self.assertEqual(session.status, "completed")
        self.assertIsNotNone(session.end_time)
        self.assertIsNotNone(session.total_work_time)
        self.assertGreater(session.total_work_time, timedelta(hours=7))

    def test_end_session_with_pause(self):
        """Test de fin de session avec pause"""
        session = WorkSession.objects.create(employee=self.employee)

        # Simuler le début il y a 8 heures
        session.start_time = timezone.now() - timedelta(hours=8)
        session.save()

        # Mettre en pause et simuler 1 heure de pause
        session.pause_session()
        session.pause_start_time = timezone.now() - timedelta(hours=1)
        session.total_pause_time = timedelta(minutes=30)  # Pause précédente
        session.save()

        session.end_session()
        session.refresh_from_db()

        self.assertEqual(session.status, "completed")
        self.assertIsNotNone(session.total_work_time)
        # Temps de travail = 8h - (30min + 1h) = environ 6h30
        self.assertLess(session.total_work_time, timedelta(hours=7))
        self.assertGreater(session.total_work_time, timedelta(hours=6))

    def test_duration_formatted_property(self):
        """Test de la propriété duration_formatted"""
        session = WorkSession.objects.create(employee=self.employee)

        # Session sans temps de travail
        self.assertEqual(session.duration_formatted, "00:00")

        # Session avec 2h30 de travail
        session.total_work_time = timedelta(hours=2, minutes=30)
        session.save()
        self.assertEqual(session.duration_formatted, "02:30")

    def test_is_current_session_property(self):
        """Test de la propriété is_current_session"""
        session = WorkSession.objects.create(employee=self.employee)

        # Session active
        self.assertTrue(session.is_current_session)

        # Session terminée
        session.end_session()
        session.refresh_from_db()
        self.assertFalse(session.is_current_session)

    def test_string_representation(self):
        """Test de la représentation string"""
        session = WorkSession.objects.create(employee=self.employee)
        expected = f"{self.employee.full_name} - {session.start_time.strftime('%d/%m/%Y %H:%M')}"
        self.assertEqual(str(session), expected)

    def test_multiple_pause_resume_cycles(self):
        """Test de multiples cycles pause/reprise"""
        session = WorkSession.objects.create(employee=self.employee)

        # Premier cycle: pause de 15 minutes
        session.pause_session()
        session.pause_start_time = timezone.now() - timedelta(minutes=15)
        session.save()
        session.resume_session()

        # Deuxième cycle: pause de 10 minutes
        session.pause_session()
        session.pause_start_time = timezone.now() - timedelta(minutes=10)
        session.save()
        session.resume_session()

        session.refresh_from_db()

        # Total des pauses devrait être d'environ 25 minutes
        self.assertGreater(session.total_pause_time, timedelta(minutes=20))
        self.assertLess(session.total_pause_time, timedelta(minutes=30))

    def test_negative_work_time_prevention(self):
        """Test de prévention du temps de travail négatif"""
        session = WorkSession.objects.create(employee=self.employee)

        # Simuler une situation où les pauses dépassent le temps total
        session.start_time = timezone.now() - timedelta(hours=1)
        session.total_pause_time = timedelta(hours=2)  # Plus que le temps total
        session.save()

        session.end_session()
        session.refresh_from_db()

        # Le temps de travail ne devrait pas être négatif
        self.assertEqual(session.total_work_time, timedelta(0))
