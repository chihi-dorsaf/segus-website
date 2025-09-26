# users/views.py
import logging
import random

from django.conf import settings
from django.core.mail import send_mail
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from employees.permissions import IsAdminRole
from projects.serializers import UserSimpleSerializer

from .models import PasswordResetCode, User
from .serializers import (
    JWTCreateWithEmailSerializer,
    PasswordResetCodeConfirmSerializer,
    PasswordResetCodeRequestSerializer,
    PasswordResetCodeVerifySerializer,
)

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([AllowAny])
def jwt_create_with_email(request):
    try:
        logger.info("[JWTView] Tentative de création de token avec email")
        serializer = JWTCreateWithEmailSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            refresh = RefreshToken.for_user(user)
            logger.info(f"[JWTView] Token créé avec succès pour {user.email}")
            return Response(
                {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }
            )
        else:
            logger.error(f"[JWTView] Erreur de validation: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"[JWTView] Erreur lors de la création du token: {str(e)}")
        return Response(
            {"error": f"Erreur lors de la création du token: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_request_code_view(request):
    serializer = PasswordResetCodeRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]
    code = f"{random.randint(100000, 999999)}"
    PasswordResetCode.objects.create(user=user, code=code)
    subject = "Code de réinitialisation du mot de passe"
    message = f"Votre code de réinitialisation est: {code}. Il expire dans 10 minutes."
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)
    return Response({"message": "Code envoyé par email"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_verify_code_view(request):
    serializer = PasswordResetCodeVerifySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    return Response({"message": "Code valide"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_confirm_view(request):
    serializer = PasswordResetCodeConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]
    prc = serializer.validated_data["reset_obj"]
    new_password = serializer.validated_data["new_password"]
    user.set_password(new_password)
    user.save()
    prc.is_used = True
    prc.save()
    return Response({"message": "Mot de passe réinitialisé avec succès"}, status=status.HTTP_200_OK)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSimpleSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Configuration des permissions par action"""
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated()]

    def get_queryset(self):
        logger.info(
            f"[UserViewSet] Fetching queryset for {self.request.user.email}, role: {self.request.user.role}"
        )
        if self.request.user.role != "ADMIN":
            return User.objects.filter(role="EMPLOYE", is_active=True)
        return User.objects.filter(is_active=True)

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
        url_path="password-reset/request-code",
    )
    def password_reset_request_code(self, request):
        serializer = PasswordResetCodeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        code = f"{random.randint(100000, 999999)}"
        PasswordResetCode.objects.create(user=user, code=code)
        subject = "Code de réinitialisation du mot de passe"
        message = f"Votre code de réinitialisation est: {code}. Il expire dans 10 minutes."
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=True,
        )
        return Response({"message": "Code envoyé par email"}, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
        url_path="password-reset/verify-code",
    )
    def password_reset_verify_code(self, request):
        serializer = PasswordResetCodeVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({"message": "Code valide"}, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
        url_path="password-reset/confirm",
    )
    def password_reset_confirm(self, request):
        serializer = PasswordResetCodeConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        prc = serializer.validated_data["reset_obj"]
        new_password = serializer.validated_data["new_password"]
        user.set_password(new_password)
        user.save()
        prc.is_used = True
        prc.save()
        return Response(
            {"message": "Mot de passe réinitialisé avec succès"},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get", "patch"], url_path="me", url_name="me")
    def me(self, request):
        """
        Get or update current user profile
        Accessible via: GET/PATCH /api/auth/users/me/
        """
        try:
            user = request.user
            logger.info(f"[UserViewSet] Profile request for {user.email}")

            if request.method == "GET":
                from .serializers import UserSerializer

                serializer = UserSerializer(user)
                return Response(serializer.data, status=status.HTTP_200_OK)

            elif request.method == "PATCH":
                from .serializers import UserSerializer

                serializer = UserSerializer(user, data=request.data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    logger.info(f"[UserViewSet] Profile updated for {user.email}")
                    return Response(serializer.data, status=status.HTTP_200_OK)
                else:
                    logger.error(
                        f"[UserViewSet] Profile update validation errors: {serializer.errors}"
                    )
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"[UserViewSet] Error in profile endpoint: {str(e)}")
            return Response(
                {"error": f"Erreur lors de la gestion du profil: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"], url_path="employees", url_name="employees")
    def employees(self, request):
        """
        Fetch users with role EMPLOYE for projects
        Accessible via: GET /api/users/employees/
        """
        try:
            logger.info(f"[UserViewSet] Fetching employees for {request.user.email}")

            # Debug: Compter tous les utilisateurs
            total_users = User.objects.count()
            total_employees = User.objects.filter(role="EMPLOYE").count()
            active_employees = User.objects.filter(role="EMPLOYE", is_active=True).count()

            logger.info(
                f"[UserViewSet] Database stats - Total users: {total_users}, Total employees: {total_employees}, Active employees: {active_employees}"
            )

            # Récupérer les employés actifs
            employees = User.objects.filter(role="EMPLOYE", is_active=True).order_by(
                "first_name", "last_name"
            )

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
            return Response(
                {"error": f"Erreur lors de la récupération des employés: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
