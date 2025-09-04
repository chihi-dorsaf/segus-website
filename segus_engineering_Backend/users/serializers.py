from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from employees.models import Employee
from .models import PasswordResetCode
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration, used by Djoser for user creation
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    password_confirmation = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label='Password confirmation'
    )

    class Meta:
        model = User
        fields = ['email', 'username', 'first_name', 'last_name', 'role', 'password', 'password_confirmation']
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'required': False, 'default': 'EMPLOYE'},
        }

    def validate(self, data):
        """
        Validate that the password and password_confirmation match
        """
        if data['password'] != data['password_confirmation']:
            logger.warning("[UserRegistrationSerializer] Passwords do not match")
            raise serializers.ValidationError({"password_confirmation": "Les mots de passe ne correspondent pas."})
        
        # Validate email uniqueness
        email = data.get('email')
        if User.objects.filter(email=email).exists():
            logger.warning(f"[UserRegistrationSerializer] Email already exists: {email}")
            raise serializers.ValidationError({"email": "Cet email est déjà utilisé."})

        return data

    def create(self, validated_data):
        """
        Create a new user with the validated data
        """
        try:
            # Remove password_confirmation from validated_data
            validated_data.pop('password_confirmation', None)
            
            # Set default role if not provided
            if 'role' not in validated_data:
                validated_data['role'] = 'EMPLOYE'

            # Create user
            user = User.objects.create_user(**validated_data)
            logger.info(f"[UserRegistrationSerializer] User created successfully: {user.email}")
            return user

        except Exception as e:
            logger.error(f"[UserRegistrationSerializer] Error creating user: {str(e)}")
            raise serializers.ValidationError(f"Erreur lors de la création de l'utilisateur: {str(e)}")

class JWTCreateWithEmailSerializer(serializers.Serializer):
    """
    Sérialiseur pour l'authentification JWT avec email
    Supporte les rôles ADMIN et EMPLOYE
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, style={'input_type': 'password'})

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        logger.info(f"[JWTCreateWithEmailSerializer] Validation pour: {email}")
        
        if not email or not password:
            logger.warning("[JWTCreateWithEmailSerializer] Email ou mot de passe manquant")
            raise serializers.ValidationError("Email et mot de passe sont requis.")
        
        try:
            # Récupérer l'utilisateur directement par email et vérifier le mot de passe
            user = User.objects.filter(email=email, is_active=True).first()
            
            if user and user.check_password(password):
                logger.info(f"[JWTCreateWithEmailSerializer] Authentification réussie - Role: {user.role}")
                data['user'] = user
                return data
            else:
                logger.warning(f"[JWTCreateWithEmailSerializer] Échec d'authentification pour: {email}")
                raise serializers.ValidationError("Email ou mot de passe incorrect.")
                
        except Exception as e:
            logger.error(f"[JWTCreateWithEmailSerializer] Erreur lors de l'authentification: {str(e)}")
            raise serializers.ValidationError("Email ou mot de passe incorrect.")

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le profil utilisateur avec informations employé si applicable
    """
    employee_info = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'employee_info']
        read_only_fields = ['id', 'username', 'role']
    
    def get_employee_info(self, obj):
        """Retourner les infos employé si l'utilisateur est un employé"""
        if obj.role == 'EMPLOYE':
            try:
                from employees.models import Employee
                employee = Employee.objects.get(user=obj)
                return {
                    'matricule': employee.matricule,
                    'position': employee.position,
        
                    'hire_date': employee.hire_date,
                    'is_active': employee.is_active
                }
            except Employee.DoesNotExist:
                return None
        return None

class LoginResponseSerializer(serializers.Serializer):
    """
    Sérialiseur pour la réponse de login
    """
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserProfileSerializer()
    
class AdminLoginSerializer(JWTCreateWithEmailSerializer):
    """
    Sérialiseur spécifique pour la connexion admin
    """
    def validate(self, data):
        data = super().validate(data)
        user = data['user']
        
        if not user.is_admin:
            logger.warning(f"[AdminLoginSerializer] Tentative d'accès admin par non-admin: {user.email}")
            raise serializers.ValidationError("Accès administrateur requis.")
        
        return data

class EmployeeLoginSerializer(JWTCreateWithEmailSerializer):
    """
    Sérialiseur spécifique pour la connexion employé
    """
    def validate(self, data):
        data = super().validate(data)
        user = data['user']
        
        if not user.is_employee:
            logger.warning(f"[EmployeeLoginSerializer] Tentative d'accès employé par non-employé: {user.email}")
            raise serializers.ValidationError("Accès employé requis.")
        
        # Vérifier que l'employé existe dans la base
        try:
            from employees.models import Employee
            employee = Employee.objects.get(user=user)
            if not employee.is_active:
                logger.warning(f"[EmployeeLoginSerializer] Employé inactif: {user.email}")
                raise serializers.ValidationError("Votre compte employé n'est pas actif.")
        except Employee.DoesNotExist:
            logger.error(f"[EmployeeLoginSerializer] Profil employé manquant pour: {user.email}")
            raise serializers.ValidationError("Profil employé introuvable.")
        
        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'profile_photo', 'phone', 'address', 'birth_date', 'gender', 'emergency_contact', 'emergency_phone']
        read_only_fields = ['id', 'is_active']
        
    def update(self, instance, validated_data):
        # Handle profile photo upload
        if 'profile_photo' in validated_data:
            # Delete old photo if exists
            if instance.profile_photo:
                instance.profile_photo.delete(save=False)
        
        return super().update(instance, validated_data)

# --- Password reset by code serializers ---
class PasswordResetCodeRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate(self, attrs):
        email = attrs.get('email')
        try:
            user = User.objects.get(email=email)
            attrs['user'] = user
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'Aucun compte trouvé avec cet email'})
        return attrs

class PasswordResetCodeVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        email = attrs.get('email')
        code = attrs.get('code')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'Email introuvable'})

        try:
            prc = PasswordResetCode.objects.filter(user=user, code=code, is_used=False).latest('created_at')
        except PasswordResetCode.DoesNotExist:
            raise serializers.ValidationError({'code': 'Code invalide'})

        if prc.is_expired:
            raise serializers.ValidationError({'code': 'Code expiré'})

        attrs['user'] = user
        attrs['reset_obj'] = prc
        return attrs

class PasswordResetCodeConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True, min_length=6)

    def validate(self, attrs):
        email = attrs.get('email')
        code = attrs.get('code')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'Email introuvable'})

        try:
            prc = PasswordResetCode.objects.filter(user=user, code=code, is_used=False).latest('created_at')
        except PasswordResetCode.DoesNotExist:
            raise serializers.ValidationError({'code': 'Code invalide'})

        if prc.is_expired:
            raise serializers.ValidationError({'code': 'Code expiré'})

        attrs['user'] = user
        attrs['reset_obj'] = prc
        return attrs