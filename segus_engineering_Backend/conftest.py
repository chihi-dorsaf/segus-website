import pytest
from django.conf import settings
from django.test.utils import get_runner
from django.contrib.auth import get_user_model
from employees.models import Employee
from projects.models import Project, Task, SubTask
from gamification.models import DailyObjective, Badge
import os

User = get_user_model()


@pytest.fixture(scope='session')
def django_db_setup():
    """Configuration de la base de données pour les tests"""
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }


@pytest.fixture
def admin_user(db):
    """Fixture pour créer un utilisateur admin"""
    return User.objects.create_user(
        username='admin_test',
        email='admin@test.com',
        password='adminpass123',
        role='ADMIN',
        first_name='Admin',
        last_name='Test'
    )


@pytest.fixture
def employee_user(db):
    """Fixture pour créer un utilisateur employé"""
    return User.objects.create_user(
        username='employee_test',
        email='employee@test.com',
        password='emppass123',
        role='EMPLOYE',
        first_name='Employee',
        last_name='Test'
    )


@pytest.fixture
def employee_profile(employee_user):
    """Fixture pour créer un profil employé"""
    return Employee.objects.create(
        user=employee_user,
        position='Développeur Test',
        phone='+216 12 345 678',
        salary=2500.000
    )


@pytest.fixture
def sample_project(admin_user):
    """Fixture pour créer un projet de test"""
    from datetime import date, timedelta
    return Project.objects.create(
        title='Projet Test',
        description='Description du projet test',
        start_date=date.today(),
        end_date=date.today() + timedelta(days=30),
        created_by=admin_user
    )


@pytest.fixture
def sample_task(sample_project, admin_user):
    """Fixture pour créer une tâche de test"""
    from datetime import date, timedelta
    return Task.objects.create(
        title='Tâche Test',
        description='Description de la tâche test',
        start_date=date.today(),
        end_date=date.today() + timedelta(days=7),
        project=sample_project,
        created_by=admin_user
    )


@pytest.fixture
def sample_subtask(sample_task, admin_user):
    """Fixture pour créer une sous-tâche de test"""
    return SubTask.objects.create(
        section_name='Section Test',
        section_number='S001',
        section_id='section_test_001',
        kilometrage=25.75,
        task=sample_task,
        created_by=admin_user
    )


@pytest.fixture
def daily_objective(employee_profile, admin_user):
    """Fixture pour créer un objectif quotidien"""
    from datetime import date
    from decimal import Decimal
    return DailyObjective.objects.create(
        employee=employee_profile,
        date=date.today(),
        target_subtasks=10,
        target_hours=Decimal('8.00'),
        created_by=admin_user
    )


@pytest.fixture
def sample_badge():
    """Fixture pour créer un badge de test"""
    from decimal import Decimal
    return Badge.objects.create(
        name='Badge Test',
        description='Badge de test pour les développeurs',
        required_stars=5,
        required_points=100,
        salary_increase_percentage=Decimal('2.50')
    )


@pytest.fixture
def api_client():
    """Fixture pour le client API REST"""
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def authenticated_admin_client(api_client, admin_user):
    """Fixture pour un client API authentifié en tant qu'admin"""
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def authenticated_employee_client(api_client, employee_user):
    """Fixture pour un client API authentifié en tant qu'employé"""
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(employee_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """Permet l'accès à la base de données pour tous les tests"""
    pass


@pytest.fixture
def mock_email_backend(settings):
    """Mock du backend email pour les tests"""
    settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'


# Configuration pytest-django
pytest_plugins = ['pytest_django']
