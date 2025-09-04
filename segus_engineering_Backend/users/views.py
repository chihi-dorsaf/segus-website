# users/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, PasswordResetCode
from projects.serializers import UserSimpleSerializer
from .serializers import (
    JWTCreateWithEmailSerializer,
    PasswordResetCodeRequestSerializer,
    PasswordResetCodeVerifySerializer,
    PasswordResetCodeConfirmSerializer,
)
from django.conf import settings
from django.core.mail import send_mail
import random
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def jwt_create_with_email(request):
    try:
        logger.info("[JWTView] Tentative de création de token avec email")
        serializer = JWTCreateWithEmailSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            logger.info(f"[JWTView] Token créé avec succès pour {user.email}")
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        else:
            logger.error(f"[JWTView] Erreur de validation: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"[JWTView] Erreur lors de la création du token: {str(e)}")
        return Response({
            'error': f'Erreur lors de la création du token: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSimpleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        logger.info(f"[UserViewSet] Fetching queryset for {self.request.user.email}, role: {self.request.user.role}")
        if self.request.user.role != 'ADMIN':
            return User.objects.filter(role='EMPLOYE', is_active=True)
        return User.objects.filter(is_active=True)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], url_path='password-reset/request-code')
    def password_reset_request_code(self, request):
        serializer = PasswordResetCodeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        code = f"{random.randint(100000, 999999)}"
        PasswordResetCode.objects.create(user=user, code=code)
        subject = 'Code de réinitialisation du mot de passe'
        message = f'Votre code de réinitialisation est: {code}. Il expire dans 10 minutes.'
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)
        return Response({'message': 'Code envoyé par email'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], url_path='password-reset/verify-code')
    def password_reset_verify_code(self, request):
        serializer = PasswordResetCodeVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'message': 'Code valide'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], url_path='password-reset/confirm')
    def password_reset_confirm(self, request):
        serializer = PasswordResetCodeConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        prc = serializer.validated_data['reset_obj']
        new_password = serializer.validated_data['new_password']
        user.set_password(new_password)
        user.save()
        prc.is_used = True
        prc.save()
        return Response({'message': 'Mot de passe réinitialisé avec succès'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='employees', url_name='employees')
    def employees(self, request):
        """
        Fetch users with role EMPLOYE for projects
        Accessible via: GET /api/users/employees/
        """
        try:
            logger.info(f"[UserViewSet] Fetching employees for {request.user.email}")
            
            # Debug: Compter tous les utilisateurs
            total_users = User.objects.count()
            total_employees = User.objects.filter(role='EMPLOYE').count()
            active_employees = User.objects.filter(role='EMPLOYE', is_active=True).count()
            
            logger.info(f"[UserViewSet] Database stats - Total users: {total_users}, Total employees: {total_employees}, Active employees: {active_employees}")
            
            # Récupérer les employés actifs
            employees = User.objects.filter(role='EMPLOYE', is_active=True).order_by('first_name', 'last_name')
            
            if not employees.exists():
                logger.warning("[UserViewSet] No active employees found in database")
                # Retourner une liste vide pour respecter le contrat d'API (array attendu côté front)
                return Response([], status=status.HTTP_200_OK)
            
            # Sérialiser les données
            serializer = self.get_serializer(employees, many=True)
            logger.info(f"[UserViewSet] Successfully serialized {len(serializer.data)} employees")
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"[UserViewSet] Error fetching employees: {str(e)}")
            return Response({
                'error': f'Erreur lors de la récupération des employés: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)