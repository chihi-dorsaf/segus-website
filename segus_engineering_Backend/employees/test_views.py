from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from employees.models import Employee, WorkSession
from datetime import date, timedelta
from django.utils import timezone

User = get_user_model()


class EmployeeViewSetTest(APITestCase):
    """Tests pour le ViewSet Employee"""
    
    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.client = APIClient()
        
        # Créer un utilisateur admin
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            role='ADMIN',
            first_name='Admin',
            last_name='User'
        )
        
        # Créer un utilisateur employé
        self.employee_user = User.objects.create_user(
            username='employee',
            email='employee@example.com',
            password='emppass123',
            role='EMPLOYE',
            first_name='Employee',
            last_name='User'
        )
        
        # Créer un profil employé
        self.employee = Employee.objects.create(
            user=self.employee_user,
            position='Développeur',
            phone='+216 12 345 678',
            salary=2500.000
        )
        
        self.employees_url = '/api/employees/'
    
    def authenticate_user(self, user):
        """Méthode helper pour authentifier un utilisateur"""
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    def test_list_employees_as_admin(self):
        """Test de listage des employés en tant qu'admin"""
        self.authenticate_user(self.admin_user)
        
        response = self.client.get(self.employees_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_list_employees_as_employee(self):
        """Test de listage des employés en tant qu'employé"""
        self.authenticate_user(self.employee_user)
        
        response = self.client.get(self.employees_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_list_employees_unauthenticated(self):
        """Test de listage des employés sans authentification"""
        response = self.client.get(self.employees_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_retrieve_employee_as_admin(self):
        """Test de récupération d'un employé en tant qu'admin"""
        self.authenticate_user(self.admin_user)
        
        response = self.client.get(f'{self.employees_url}{self.employee.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.employee.id)
        self.assertEqual(response.data['position'], 'Développeur')
    
    def test_create_employee_as_admin(self):
        """Test de création d'employé en tant qu'admin"""
        self.authenticate_user(self.admin_user)
        
        # Créer un nouvel utilisateur pour l'employé
        new_user = User.objects.create_user(
            username='newemployee',
            email='newemployee@example.com',
            password='newpass123',
            first_name='New',
            last_name='Employee'
        )
        
        employee_data = {
            'user': new_user.id,
            'position': 'Designer',
            'phone': '+216 98 765 432',
            'salary': 2000.000,
            'hire_date': date.today().isoformat()
        }
        
        response = self.client.post(self.employees_url, employee_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['position'], 'Designer')
        
        # Vérifier que l'employé a été créé en base
        new_employee = Employee.objects.get(user=new_user)
        self.assertEqual(new_employee.position, 'Designer')
    
    def test_update_employee_as_admin(self):
        """Test de mise à jour d'employé en tant qu'admin"""
        self.authenticate_user(self.admin_user)
        
        update_data = {
            'position': 'Senior Développeur',
            'salary': 3000.000
        }
        
        response = self.client.patch(
            f'{self.employees_url}{self.employee.id}/',
            update_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['position'], 'Senior Développeur')
        self.assertEqual(float(response.data['salary']), 3000.000)
    
    def test_delete_employee_as_admin(self):
        """Test de suppression d'employé en tant qu'admin"""
        self.authenticate_user(self.admin_user)
        
        # Créer un employé temporaire pour le supprimer
        temp_user = User.objects.create_user(
            username='tempemployee',
            email='temp@example.com',
            password='temppass123'
        )
        temp_employee = Employee.objects.create(user=temp_user)
        
        response = self.client.delete(f'{self.employees_url}{temp_employee.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Vérifier que l'employé a été supprimé
        with self.assertRaises(Employee.DoesNotExist):
            Employee.objects.get(id=temp_employee.id)
    
    def test_employee_cannot_delete_employee(self):
        """Test qu'un employé ne peut pas supprimer un autre employé"""
        self.authenticate_user(self.employee_user)
        
        # Créer un autre employé
        other_user = User.objects.create_user(
            username='otheremployee',
            email='other@example.com',
            password='otherpass123'
        )
        other_employee = Employee.objects.create(user=other_user)
        
        response = self.client.delete(f'{self.employees_url}{other_employee.id}/')
        
        self.assertIn(response.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_401_UNAUTHORIZED
        ])


class WorkSessionViewSetTest(APITestCase):
    """Tests pour le ViewSet WorkSession"""
    
    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.client = APIClient()
        
        # Créer un utilisateur employé
        self.employee_user = User.objects.create_user(
            username='employee',
            email='employee@example.com',
            password='emppass123',
            role='EMPLOYE'
        )
        
        # Créer un profil employé
        self.employee = Employee.objects.create(
            user=self.employee_user,
            position='Développeur'
        )
        
        # Créer un utilisateur admin
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            role='ADMIN'
        )
        
        self.work_sessions_url = '/api/work-sessions/'
    
    def authenticate_user(self, user):
        """Méthode helper pour authentifier un utilisateur"""
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    def test_create_work_session_as_employee(self):
        """Test de création de session de travail en tant qu'employé"""
        self.authenticate_user(self.employee_user)
        
        session_data = {
            'employee': self.employee.id,
            'notes': 'Session de travail test'
        }
        
        response = self.client.post(self.work_sessions_url, session_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'active')
        self.assertEqual(response.data['notes'], 'Session de travail test')
    
    def test_list_work_sessions_as_employee(self):
        """Test de listage des sessions de travail en tant qu'employé"""
        self.authenticate_user(self.employee_user)
        
        # Créer une session de travail
        WorkSession.objects.create(employee=self.employee)
        
        response = self.client.get(self.work_sessions_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_pause_work_session(self):
        """Test de mise en pause d'une session de travail"""
        self.authenticate_user(self.employee_user)
        
        # Créer une session active
        session = WorkSession.objects.create(employee=self.employee)
        
        response = self.client.post(
            f'{self.work_sessions_url}{session.id}/pause/',
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Vérifier que la session est en pause
        session.refresh_from_db()
        self.assertEqual(session.status, 'paused')
    
    def test_resume_work_session(self):
        """Test de reprise d'une session de travail"""
        self.authenticate_user(self.employee_user)
        
        # Créer une session en pause
        session = WorkSession.objects.create(employee=self.employee)
        session.pause_session()
        
        response = self.client.post(
            f'{self.work_sessions_url}{session.id}/resume/',
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Vérifier que la session est active
        session.refresh_from_db()
        self.assertEqual(session.status, 'active')
    
    def test_end_work_session(self):
        """Test de fin d'une session de travail"""
        self.authenticate_user(self.employee_user)
        
        # Créer une session active
        session = WorkSession.objects.create(employee=self.employee)
        
        response = self.client.post(
            f'{self.work_sessions_url}{session.id}/end/',
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Vérifier que la session est terminée
        session.refresh_from_db()
        self.assertEqual(session.status, 'completed')
        self.assertIsNotNone(session.end_time)
    
    def test_get_current_session(self):
        """Test de récupération de la session courante"""
        self.authenticate_user(self.employee_user)
        
        # Créer une session active
        session = WorkSession.objects.create(employee=self.employee)
        
        response = self.client.get(f'{self.work_sessions_url}current/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], session.id)
        self.assertEqual(response.data['status'], 'active')
    
    def test_get_current_session_none_active(self):
        """Test de récupération de session courante quand aucune n'est active"""
        self.authenticate_user(self.employee_user)
        
        response = self.client.get(f'{self.work_sessions_url}current/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_work_session_statistics(self):
        """Test des statistiques de session de travail"""
        self.authenticate_user(self.employee_user)
        
        # Créer plusieurs sessions terminées
        for i in range(3):
            session = WorkSession.objects.create(employee=self.employee)
            session.start_time = timezone.now() - timedelta(hours=8, days=i)
            session.total_work_time = timedelta(hours=8)
            session.status = 'completed'
            session.save()
        
        response = self.client.get(f'{self.work_sessions_url}statistics/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_sessions', response.data)
        self.assertIn('total_work_time', response.data)
        self.assertEqual(response.data['total_sessions'], 3)
    
    def test_unauthorized_access_to_work_sessions(self):
        """Test d'accès non autorisé aux sessions de travail"""
        response = self.client.get(self.work_sessions_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_employee_cannot_access_other_employee_sessions(self):
        """Test qu'un employé ne peut pas accéder aux sessions d'un autre"""
        # Créer un autre employé
        other_user = User.objects.create_user(
            username='otheremployee',
            email='other@example.com',
            password='otherpass123'
        )
        other_employee = Employee.objects.create(user=other_user)
        other_session = WorkSession.objects.create(employee=other_employee)
        
        self.authenticate_user(self.employee_user)
        
        response = self.client.get(f'{self.work_sessions_url}{other_session.id}/')
        
        self.assertIn(response.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND
        ])
