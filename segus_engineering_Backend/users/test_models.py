from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from users.models import PasswordResetCode

User = get_user_model()


class UserModelTest(TestCase):
    """Tests pour le modèle User"""
    
    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'EMPLOYE'
        }
    
    def test_create_user(self):
        """Test de création d'un utilisateur"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.role, 'EMPLOYE')
        self.assertTrue(user.check_password('testpass123'))
        self.assertFalse(user.is_admin)
        self.assertTrue(user.is_employee)
    
    def test_create_admin_user(self):
        """Test de création d'un administrateur"""
        admin_data = self.user_data.copy()
        admin_data['role'] = 'ADMIN'
        admin = User.objects.create_user(**admin_data)
        self.assertEqual(admin.role, 'ADMIN')
        self.assertTrue(admin.is_admin)
        self.assertFalse(admin.is_employee)
    
    def test_email_unique_constraint(self):
        """Test de l'unicité de l'email"""
        User.objects.create_user(**self.user_data)
        
        # Tentative de création d'un autre utilisateur avec le même email
        duplicate_data = self.user_data.copy()
        duplicate_data['username'] = 'anotheruser'
        
        with self.assertRaises(Exception):  # IntegrityError ou ValidationError
            User.objects.create_user(**duplicate_data)
    
    def test_full_name_property(self):
        """Test de la propriété full_name"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.full_name, 'Test User')
        
        # Test avec nom vide
        user.first_name = ''
        user.last_name = ''
        user.save()
        self.assertEqual(user.full_name, 'testuser')
    
    def test_string_representation(self):
        """Test de la représentation string du modèle"""
        user = User.objects.create_user(**self.user_data)
        expected = f"{user.email} ({user.get_role_display()})"
        self.assertEqual(str(user), expected)
    
    def test_gender_choices(self):
        """Test des choix de genre"""
        user = User.objects.create_user(**self.user_data)
        user.gender = 'M'
        user.save()
        self.assertEqual(user.gender, 'M')
        
        user.gender = 'F'
        user.save()
        self.assertEqual(user.gender, 'F')
    
    def test_optional_fields(self):
        """Test des champs optionnels"""
        user_data = {
            'username': 'testuser2',
            'email': 'test2@example.com',
            'password': 'testpass123',
            'phone': '+216 12 345 678',
            'address': '123 Rue de la Paix, Tunis',
            'birth_date': '1990-01-01',
            'emergency_contact': 'Contact Urgence',
            'emergency_phone': '+216 98 765 432'
        }
        
        user = User.objects.create_user(**user_data)
        self.assertEqual(user.phone, '+216 12 345 678')
        self.assertEqual(user.address, '123 Rue de la Paix, Tunis')
        self.assertEqual(user.emergency_contact, 'Contact Urgence')


class PasswordResetCodeModelTest(TestCase):
    """Tests pour le modèle PasswordResetCode"""
    
    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_password_reset_code(self):
        """Test de création d'un code de réinitialisation"""
        reset_code = PasswordResetCode.objects.create(
            user=self.user,
            code='123456'
        )
        
        self.assertEqual(reset_code.user, self.user)
        self.assertEqual(reset_code.code, '123456')
        self.assertFalse(reset_code.is_used)
        self.assertIsNotNone(reset_code.expires_at)
    
    def test_auto_expiration_time(self):
        """Test de l'expiration automatique (10 minutes)"""
        reset_code = PasswordResetCode.objects.create(
            user=self.user,
            code='123456'
        )
        
        # Vérifier que expires_at est défini automatiquement
        expected_expiry = timezone.now() + timedelta(minutes=10)
        time_diff = abs((reset_code.expires_at - expected_expiry).total_seconds())
        self.assertLess(time_diff, 5)  # Tolérance de 5 secondes
    
    def test_is_expired_property(self):
        """Test de la propriété is_expired"""
        # Code non expiré
        reset_code = PasswordResetCode.objects.create(
            user=self.user,
            code='123456'
        )
        self.assertFalse(reset_code.is_expired)
        
        # Code expiré
        expired_code = PasswordResetCode.objects.create(
            user=self.user,
            code='654321',
            expires_at=timezone.now() - timedelta(minutes=1)
        )
        self.assertTrue(expired_code.is_expired)
    
    def test_multiple_codes_per_user(self):
        """Test de création de plusieurs codes pour un utilisateur"""
        code1 = PasswordResetCode.objects.create(
            user=self.user,
            code='111111'
        )
        code2 = PasswordResetCode.objects.create(
            user=self.user,
            code='222222'
        )
        
        self.assertEqual(self.user.password_reset_codes.count(), 2)
        self.assertIn(code1, self.user.password_reset_codes.all())
        self.assertIn(code2, self.user.password_reset_codes.all())
    
    def test_code_usage(self):
        """Test de l'utilisation d'un code"""
        reset_code = PasswordResetCode.objects.create(
            user=self.user,
            code='123456'
        )
        
        # Marquer comme utilisé
        reset_code.is_used = True
        reset_code.save()
        
        self.assertTrue(reset_code.is_used)
