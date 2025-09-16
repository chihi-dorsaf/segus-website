from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import PasswordResetCode
import json

User = get_user_model()


class JWTCreateWithEmailViewTest(APITestCase):
    """Tests pour la vue jwt_create_with_email"""
    
    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.login_url = '/api/auth/jwt/create-with-email/'
    
    def test_successful_login_with_email(self):
        """Test de connexion réussie avec email"""
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIsInstance(response.data['access'], str)
        self.assertIsInstance(response.data['refresh'], str)
    
    def test_login_with_invalid_email(self):
        """Test de connexion avec email invalide"""
        data = {
            'email': 'nonexistent@example.com',
            'password': 'testpass123'
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)
    
    def test_login_with_invalid_password(self):
        """Test de connexion avec mot de passe invalide"""
        data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)
    
    def test_login_with_missing_fields(self):
        """Test de connexion avec champs manquants"""
        # Email manquant
        data = {'password': 'testpass123'}
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Mot de passe manquant
        data = {'email': 'test@example.com'}
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_login_with_empty_data(self):
        """Test de connexion avec données vides"""
        response = self.client.post(self.login_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserViewSetTest(APITestCase):
    """Tests pour le ViewSet User"""
    
    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.client = APIClient()
        
        # Créer un utilisateur admin
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            role='ADMIN'
        )
        
        # Créer un utilisateur employé
        self.employee_user = User.objects.create_user(
            username='employee',
            email='employee@example.com',
            password='emppass123',
            role='EMPLOYE'
        )
        
        self.users_url = '/api/users/'
    
    def authenticate_user(self, user):
        """Méthode helper pour authentifier un utilisateur"""
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    def test_list_users_as_admin(self):
        """Test de listage des utilisateurs en tant qu'admin"""
        self.authenticate_user(self.admin_user)
        
        response = self.client.get(self.users_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreaterEqual(len(response.data), 2)  # Au moins admin et employee
    
    def test_list_users_as_employee(self):
        """Test de listage des utilisateurs en tant qu'employé"""
        self.authenticate_user(self.employee_user)
        
        response = self.client.get(self.users_url)
        
        # Les employés peuvent voir la liste mais avec des permissions limitées
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_list_users_unauthenticated(self):
        """Test de listage des utilisateurs sans authentification"""
        response = self.client.get(self.users_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_retrieve_user_as_admin(self):
        """Test de récupération d'un utilisateur en tant qu'admin"""
        self.authenticate_user(self.admin_user)
        
        response = self.client.get(f'{self.users_url}{self.employee_user.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.employee_user.id)
        self.assertEqual(response.data['email'], self.employee_user.email)
    
    def test_create_user_as_admin(self):
        """Test de création d'utilisateur en tant qu'admin"""
        self.authenticate_user(self.admin_user)
        
        user_data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'EMPLOYE'
        }
        
        response = self.client.post(self.users_url, user_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], 'newuser@example.com')
        
        # Vérifier que l'utilisateur a été créé en base
        new_user = User.objects.get(email='newuser@example.com')
        self.assertEqual(new_user.username, 'newuser')
    
    def test_update_user_as_admin(self):
        """Test de mise à jour d'utilisateur en tant qu'admin"""
        self.authenticate_user(self.admin_user)
        
        update_data = {
            'first_name': 'Updated',
            'last_name': 'Name'
        }
        
        response = self.client.patch(
            f'{self.users_url}{self.employee_user.id}/',
            update_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Updated')
        self.assertEqual(response.data['last_name'], 'Name')
    
    def test_delete_user_as_admin(self):
        """Test de suppression d'utilisateur en tant qu'admin"""
        self.authenticate_user(self.admin_user)
        
        # Créer un utilisateur temporaire pour le supprimer
        temp_user = User.objects.create_user(
            username='tempuser',
            email='temp@example.com',
            password='temppass123'
        )
        
        response = self.client.delete(f'{self.users_url}{temp_user.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Vérifier que l'utilisateur a été supprimé
        with self.assertRaises(User.DoesNotExist):
            User.objects.get(id=temp_user.id)
    
    def test_employee_cannot_create_user(self):
        """Test qu'un employé ne peut pas créer d'utilisateur"""
        self.authenticate_user(self.employee_user)
        
        user_data = {
            'username': 'unauthorized',
            'email': 'unauthorized@example.com',
            'password': 'pass123'
        }
        
        response = self.client.post(self.users_url, user_data, format='json')
        
        # Selon les permissions, cela devrait être interdit
        self.assertIn(response.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_401_UNAUTHORIZED
        ])


class PasswordResetViewTest(APITestCase):
    """Tests pour les vues de réinitialisation de mot de passe"""
    
    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='oldpass123'
        )
        
        self.request_reset_url = '/api/auth/password-reset-code/request/'
        self.verify_code_url = '/api/auth/password-reset-code/verify/'
        self.confirm_reset_url = '/api/auth/password-reset-code/confirm/'
    
    def test_request_password_reset_code(self):
        """Test de demande de code de réinitialisation"""
        data = {'email': 'test@example.com'}
        
        response = self.client.post(self.request_reset_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        
        # Vérifier qu'un code a été créé
        reset_codes = PasswordResetCode.objects.filter(user=self.user)
        self.assertEqual(reset_codes.count(), 1)
    
    def test_request_password_reset_invalid_email(self):
        """Test de demande avec email invalide"""
        data = {'email': 'nonexistent@example.com'}
        
        response = self.client.post(self.request_reset_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_verify_password_reset_code(self):
        """Test de vérification du code de réinitialisation"""
        # Créer un code de réinitialisation
        reset_code = PasswordResetCode.objects.create(
            user=self.user,
            code='123456'
        )
        
        data = {
            'email': 'test@example.com',
            'code': '123456'
        }
        
        response = self.client.post(self.verify_code_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
    
    def test_verify_invalid_code(self):
        """Test de vérification avec code invalide"""
        data = {
            'email': 'test@example.com',
            'code': '999999'
        }
        
        response = self.client.post(self.verify_code_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_confirm_password_reset(self):
        """Test de confirmation de réinitialisation"""
        # Créer un code de réinitialisation
        reset_code = PasswordResetCode.objects.create(
            user=self.user,
            code='123456'
        )
        
        data = {
            'email': 'test@example.com',
            'code': '123456',
            'new_password': 'newpass123'
        }
        
        response = self.client.post(self.confirm_reset_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Vérifier que le mot de passe a été changé
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpass123'))
        
        # Vérifier que le code a été marqué comme utilisé
        reset_code.refresh_from_db()
        self.assertTrue(reset_code.is_used)
