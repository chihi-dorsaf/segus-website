import csv
import io
import logging
from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Avg, Count, Q
from django.http import HttpResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Employee, WorkSession
from .serializers import (
    AdminDashboardStatsSerializer,
    EmployeeCreateSerializer,
    EmployeeSerializer,
    EmployeeUpdateSerializer,
    EmployeeWorkHistorySerializer,
    EmployeeWorkStatsSerializer,
    WorkSessionDetailSerializer,
    WorkSessionSerializer,
)
from .permissions import IsAdminRole
from .services import send_password_reset_email
from .utils import generate_secure_password

# Configuration du logger
logger = logging.getLogger(__name__)
User = get_user_model()


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion complète des employés.

    Endpoints disponibles:
    - GET /api/employees/ - Liste tous les employés
    - POST /api/employees/ - Crée un nouvel employé
    - GET /api/employees/{id}/ - Récupère un employé spécifique
    - PUT/PATCH /api/employees/{id}/ - Met à jour un employé
    - DELETE /api/employees/{id}/ - Supprime un employé
    - GET /api/employees/stats/ - Statistiques des employés
    - GET /api/employees/export/ - Export CSV
    - POST /api/employees/import/ - Import CSV
    - GET /api/employees/generate-matricule/ - Génère un matricule
    - GET /api/employees/search/ - Recherche avancée
    - PATCH /api/employees/{id}/toggle-status/ - Change le statut
    """

    queryset = Employee.objects.select_related("user").all()
    permission_classes = [IsAuthenticated]  # Simplifié pour éviter les erreurs
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["is_active", "position"]
    search_fields = [
        "matricule",
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
        "position",
    ]
    ordering_fields = ["created_at", "hire_date", "salary", "user__username"]
    ordering = ["-created_at"]
    # Tests expect a simple list, not paginated dict
    pagination_class = None

    # Spécifie explicitement les méthodes HTTP autorisées
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        """Retourne le sérialiseur approprié selon l'action"""
        if self.action == "create":
            return EmployeeCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return EmployeeUpdateSerializer
        return EmployeeSerializer

    def create(self, request, *args, **kwargs):
        """Override create to return proper serialized data"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        # Force use of EmployeeSerializer for response to ensure all fields are present
        response_serializer = EmployeeSerializer(instance)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        # Force use of EmployeeSerializer for response to ensure all fields are present
        response_serializer = EmployeeSerializer(instance)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    def get_permissions(self):
        """Configuration des permissions par action"""
        if self.action == "forgot_password":
            return [AllowAny()]
        elif self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        """Liste des employés avec filtres et pagination"""
        try:
            logger.info("[EmployeeViewSet] Recuperation de la liste des employes")

            queryset = self.filter_queryset(self.get_queryset())

            # Filtres supplémentaires
            search = request.query_params.get("search", "")
            if search:
                queryset = queryset.filter(
                    Q(matricule__icontains=search)
                    | Q(user__username__icontains=search)
                    | Q(user__email__icontains=search)
                    | Q(user__first_name__icontains=search)
                    | Q(user__last_name__icontains=search)
                    | Q(position__icontains=search)
                )

            # Filtre par statut
            status_filter = request.query_params.get("status", "")
            if status_filter:
                queryset = queryset.filter(is_active=(status_filter.lower() == "active"))

            # Tri
            ordering = request.query_params.get("ordering", "-created_at")
            if ordering:
                queryset = queryset.order_by(ordering)

            # Retourner une liste brute (les tests attendent une liste, pas un objet paginé)
            serializer = self.get_serializer(queryset, many=True)
            logger.info(f"[EmployeeViewSet] {len(serializer.data)} employes recuperes")
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"[EmployeeViewSet] Erreur lors de la recuperation des employes: {str(e)}")
            return Response(
                {"error": f"Erreur lors de la récupération des employés: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def retrieve(self, request, *args, **kwargs):
        """Récupère un employé spécifique"""
        try:
            employee_id = kwargs.get("pk")
            logger.info(f"[EmployeeViewSet] Recuperation de l'employe {employee_id}")

            employee = self.get_object()
            serializer = self.get_serializer(employee)

            logger.info(f"[EmployeeViewSet] Employe {employee.full_name} recupere avec succes")
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"[EmployeeViewSet] Erreur lors de la recuperation de l'employe: {str(e)}")
            return Response(
                {"error": f"Erreur lors de la récupération de l'employé: {str(e)}"},
                status=status.HTTP_404_NOT_FOUND,
            )

    def create(self, request, *args, **kwargs):
        """Crée un nouvel employé"""
        try:
            logger.info("[EmployeeViewSet] Tentative de creation d'un employe")
            logger.info(f"[EmployeeViewSet] Donnees recues: {request.data}")

            # Vérification des données requises pour le nouveau format
            # Le test fournit toutes les infos utilisateur via user.*
            # Ne pas exiger 'email' au niveau racine
            required_fields = ["position"]
            missing_fields = [field for field in required_fields if not request.data.get(field)]

            if missing_fields:
                logger.error(f"[EmployeeViewSet] Champs manquants: {missing_fields}")
                return Response(
                    {
                        "error": "Champs obligatoires manquants",
                        "missing_fields": missing_fields,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Mapper les champs imbriqués user.* si fournis par les tests
            payload = request.data.copy()
            user_data = payload.get("user") or {}
            if not payload.get("email") and isinstance(user_data, dict):
                if user_data.get("email"):
                    payload["email"] = user_data.get("email")
                if user_data.get("first_name"):
                    payload["first_name"] = user_data.get("first_name")
                if user_data.get("last_name"):
                    payload["last_name"] = user_data.get("last_name")

            # Validation et création
            serializer = self.get_serializer(data=payload)

            if not serializer.is_valid():
                logger.error(f"[EmployeeViewSet] Erreur de validation: {serializer.errors}")
                return Response(
                    {"error": "Données invalides", "details": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Création dans une transaction
            with transaction.atomic():
                employee = serializer.save()
                logger.info(
                    f"[EmployeeViewSet] Employe cree: {employee.full_name} - {employee.matricule}"
                )

            # Réponse plate attendue par les tests (incluant le champ position)
            response_serializer = EmployeeSerializer(employee)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"[EmployeeViewSet] Erreur creation employe: {str(e)}")
            import traceback

            logger.error(f"[EmployeeViewSet] Traceback: {traceback.format_exc()}")

            return Response(
                {
                    "error": f"Erreur lors de la création: {str(e)}",
                    "details": "Vérifiez les logs serveur pour plus de détails",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def update(self, request, *args, **kwargs):
        """Met à jour un employé (PUT - mise à jour complète)"""
        try:
            employee_id = kwargs.get("pk")
            logger.info(f"[EmployeeViewSet] Mise a jour complete de l'employe {employee_id}")

            partial = kwargs.pop("partial", False)
            employee = self.get_object()
            serializer = self.get_serializer(employee, data=request.data, partial=partial)

            serializer.is_valid(raise_exception=True)

            with transaction.atomic():
                updated_employee = serializer.save()

            logger.info(
                f"[EmployeeViewSet] Employe {updated_employee.full_name} mis a jour avec succes"
            )

            response_serializer = EmployeeSerializer(updated_employee)
            return Response(response_serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"[EmployeeViewSet] Erreur mise a jour employe: {str(e)}")
            return Response(
                {"error": f"Erreur lors de la mise à jour: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def partial_update(self, request, *args, **kwargs):
        """Met à jour partiellement un employé (PATCH)"""
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Supprime un employé"""
        try:
            employee_id = kwargs.get("pk")
            logger.info(f"[EmployeeViewSet] Suppression de l'employe {employee_id}")

            employee = self.get_object()
            employee_name = employee.full_name

            with transaction.atomic():
                # Supprimer l'utilisateur associé (l'employé sera supprimé via CASCADE)
                employee.user.delete()

            logger.info(f"[EmployeeViewSet] Employe {employee_name} supprime avec succes")

            return Response(
                {"message": "Employé supprimé avec succès"},
                status=status.HTTP_204_NO_CONTENT,
            )

        except Exception as e:
            logger.error(f"[EmployeeViewSet] Erreur suppression employe: {str(e)}")
            return Response(
                {"error": f"Erreur lors de la suppression: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["get"], url_path="stats")
    def employee_stats(self, request):
        """Statistiques des employés"""
        try:
            logger.info("[EmployeeViewSet] Calcul des statistiques des employes")

            total_employees = Employee.objects.count()
            active_employees = Employee.objects.filter(is_active=True).count()
            inactive_employees = Employee.objects.filter(is_active=False).count()

            # Employés par position
            employees_by_position = (
                Employee.objects.values("position").annotate(count=Count("id")).order_by("-count")
            )
            position_stats = {}
            for item in employees_by_position:
                position_key = item["position"] or "Non spécifié"
                position_stats[position_key] = item["count"]

            # Salaire moyen
            average_salary = Employee.objects.aggregate(avg_salary=Avg("salary"))["avg_salary"]

            # Embauchés récents (30 derniers jours)
            recent_date = timezone.now().date() - timedelta(days=30)
            recent_hires = Employee.objects.filter(hire_date__gte=recent_date).count()

            stats = {
                "total_employees": total_employees,
                "active_employees": active_employees,
                "inactive_employees": inactive_employees,
                "employees_by_position": position_stats,
                "average_salary": float(average_salary) if average_salary else None,
                "recent_hires": recent_hires,
            }

            logger.info(
                f"[EmployeeViewSet] Statistiques calculees: {total_employees} employes total"
            )
            return Response(stats)

        except Exception as e:
            logger.error(f"[EmployeeViewSet] Erreur calcul statistiques: {str(e)}")
            return Response(
                {"error": f"Erreur lors du calcul des statistiques: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request):
        """Exporte les employés en CSV"""
        try:
            logger.info("[EmployeeViewSet] Export des employes en CSV")

            employees = self.get_queryset()

            # Créer la réponse HTTP avec le bon type de contenu
            response = HttpResponse(content_type="text/csv")
            response["Content-Disposition"] = (
                f'attachment; filename="employees_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
            )

            # Écriture du CSV
            writer = csv.writer(response)

            # En-têtes
            headers = [
                "ID Employé",
                "Nom Complet",
                "Email",
                "Position",
                "Date d'Embauche",
                "Salaire",
                "Statut",
                "Date de Création",
            ]
            writer.writerow(headers)

            # Données
            for employee in employees:
                row = [
                    employee.id or "",
                    employee.full_name or "",
                    employee.email or "",
                    employee.position or "",
                    (employee.hire_date.strftime("%Y-%m-%d") if employee.hire_date else ""),
                    str(employee.salary) if employee.salary else "",
                    "Actif" if employee.is_active else "Inactif",
                    (employee.created_at.strftime("%Y-%m-%d") if employee.created_at else ""),
                ]
                writer.writerow(row)

            logger.info(
                f"[EmployeeViewSet] Export CSV reussi: {employees.count()} employes exportes"
            )
            return response

        except Exception as e:
            logger.error(f"[EmployeeViewSet] Erreur export: {str(e)}")
            return Response(
                {"error": f"Erreur lors de l'export: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(
        detail=False,
        methods=["post"],
        url_path="import",
        parser_classes=[MultiPartParser, FormParser],
    )
    def import_employees(self, request):
        """Importe des employés depuis un fichier CSV"""
        try:
            logger.info("[EmployeeViewSet] Import d'employes depuis CSV")

            file = request.FILES.get("file")
            if not file:
                return Response(
                    {"error": "Aucun fichier fourni"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not file.name.endswith(".csv"):
                return Response(
                    {"error": "Le fichier doit être au format CSV"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Lecture et traitement du fichier CSV
            try:
                decoded_file = file.read().decode("utf-8")
            except UnicodeDecodeError:
                try:
                    file.seek(0)
                    decoded_file = file.read().decode("utf-8-sig")  # Gestion du BOM
                except UnicodeDecodeError:
                    return Response(
                        {
                            "error": "Impossible de décoder le fichier CSV. Vérifiez l'encodage (UTF-8 recommandé)."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            csv_data = csv.DictReader(io.StringIO(decoded_file))

            imported_count = 0
            errors = []

            for row_num, row in enumerate(csv_data, 1):
                try:
                    # Validation des champs requis
                    required_fields = ["username", "email", "password", "position"]
                    missing_fields = [field for field in required_fields if not row.get(field)]

                    if missing_fields:
                        errors.append(
                            f"Ligne {row_num}: Champs manquants: {', '.join(missing_fields)}"
                        )
                        continue

                    with transaction.atomic():
                        # Vérifier si l'utilisateur existe déjà
                        if User.objects.filter(username=row["username"]).exists():
                            errors.append(
                                f"Ligne {row_num}: L'utilisateur '{row['username']}' existe déjà"
                            )
                            continue

                        if User.objects.filter(email=row["email"]).exists():
                            errors.append(f"Ligne {row_num}: L'email '{row['email']}' existe déjà")
                            continue

                        # Préparer les données pour le sérialiseur
                        employee_data = {
                            "username": row["username"],
                            "email": row["email"],
                            "password": row["password"],
                            "first_name": row.get("first_name", ""),
                            "last_name": row.get("last_name", ""),
                            "position": row["position"],
                            "phone": row.get("phone", ""),
                            "address": row.get("address", ""),
                            "gender": row.get("gender", ""),
                            "emergency_contact": row.get("emergency_contact", ""),
                            "emergency_phone": row.get("emergency_phone", ""),
                            "notes": row.get("notes", ""),
                        }

                        # Utiliser le sérialiseur pour créer l'employé
                        serializer = EmployeeCreateSerializer(data=employee_data)
                        if serializer.is_valid():
                            serializer.save()
                            imported_count += 1
                        else:
                            errors.append(f"Ligne {row_num}: {serializer.errors}")

                except Exception as e:
                    errors.append(f"Ligne {row_num}: {str(e)}")

            logger.info(
                f"[EmployeeViewSet] Import termine: {imported_count} employes importes, {len(errors)} erreurs"
            )

            return Response(
                {
                    "message": f"{imported_count} employé(s) importé(s) avec succès",
                    "imported_count": imported_count,
                    "errors": errors[:10],  # Limite les erreurs affichées
                }
            )

        except Exception as e:
            logger.error(f"[EmployeeViewSet] Erreur import: {str(e)}")
            return Response(
                {"error": f"Erreur lors de l'import: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"], url_path="generate-matricule")
    def generate_matricule(self, request):
        """Génère un nouveau matricule unique"""
        try:
            logger.info("[EmployeeViewSet] Generation d'un nouveau matricule")

            # Utiliser la méthode du modèle pour générer le matricule
            temp_employee = Employee()
            matricule = temp_employee.generate_matricule()

            logger.info(f"[EmployeeViewSet] Matricule genere: {matricule}")

            return Response({"matricule": matricule})

        except Exception as e:
            logger.error(f"[EmployeeViewSet] Erreur generation matricule: {str(e)}")
            return Response(
                {"error": f"Erreur lors de la génération du matricule: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        """Recherche avancée d'employés"""
        try:
            query = request.query_params.get("q", "").strip()

            if not query:
                return Response(
                    {"error": "Paramètre de recherche requis (q)"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            logger.info(f"[EmployeeViewSet] Recherche avec requete: '{query}'")

            queryset = (
                self.get_queryset()
                .filter(
                    Q(matricule__icontains=query)
                    | Q(user__username__icontains=query)
                    | Q(user__email__icontains=query)
                    | Q(user__first_name__icontains=query)
                    | Q(user__last_name__icontains=query)
                    | Q(position__icontains=query)
                    | Q(phone__icontains=query)
                )
                .distinct()
            )

            serializer = self.get_serializer(queryset, many=True)

            logger.info(
                f"[EmployeeViewSet] Recherche terminee: {queryset.count()} resultats trouves"
            )

            return Response({"count": queryset.count(), "results": serializer.data})

        except Exception as e:
            logger.error(f"[EmployeeViewSet] Erreur recherche: {str(e)}")
            return Response(
                {"error": f"Erreur lors de la recherche: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["patch"], url_path="toggle-status")
    def toggle_status(self, request, pk=None):
        """Basculer le statut d'un employé"""
        try:
            employee = self.get_object()
            new_status = request.data.get("status")

            if new_status not in ["ACTIVE", "INACTIVE", "SUSPENDED"]:
                return Response(
                    {"error": "Statut invalide. Doit être ACTIVE, INACTIVE ou SUSPENDED"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            employee.status = new_status
            employee.save()

            logger.info(
                "[EmployeeViewSet] Status changed for %s to %s",
                employee.full_name,
                new_status,
            )

            return Response(
                {
                    "message": f"Statut de l'employé changé vers {new_status}",
                    "employee": EmployeeSerializer(employee).data,
                }
            )

        except Exception as e:
            logger.error("[EmployeeViewSet] Status change error: %s", str(e), exc_info=True)
            return Response(
                {"error": f"Erreur lors du changement de statut: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None):
        """Réinitialiser le mot de passe d'un employé"""
        try:
            employee = self.get_object()

            # Générer un nouveau mot de passe sécurisé
            new_password = generate_secure_password()

            # Mettre à jour le mot de passe de l'utilisateur
            employee.user.set_password(new_password)
            employee.user.save()

            # Envoyer l'email avec le nouveau mot de passe
            email_sent = send_password_reset_email(employee, new_password)

            if email_sent:
                logger.info(
                    "[EmployeeViewSet] Password reset for %s, email sent",
                    employee.full_name,
                )
                return Response(
                    {
                        "message": f"Mot de passe réinitialisé avec succès. Un email a été envoyé à {employee.email}",
                        "email_sent": True,
                    }
                )
            else:
                logger.warning(
                    "[EmployeeViewSet] Password reset for %s, but email failed",
                    employee.full_name,
                )
                return Response(
                    {
                        "message": "Mot de passe réinitialisé avec succès, mais l'envoi de l'email a échoué.",
                        "email_sent": False,
                        "new_password": new_password,  # Retourner le mot de passe en cas d'échec d'email
                    }
                )

        except Exception as e:
            logger.error("[EmployeeViewSet] Password reset error: %s", str(e), exc_info=True)
            return Response(
                {"error": f"Erreur lors de la réinitialisation du mot de passe: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(
        detail=False,
        methods=["post"],
        url_path="forgot-password",
        permission_classes=[AllowAny],
    )
    def forgot_password(self, request):
        """Demande de réinitialisation de mot de passe"""
        try:
            email = request.data.get("email")
            if not email:
                return Response(
                    {"error": "Adresse email requise"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Vérifier si l'utilisateur existe
            try:
                user = User.objects.get(email=email)
                _ = Employee.objects.get(user=user)
            except (User.DoesNotExist, Employee.DoesNotExist):
                # Ne pas révéler si l'email existe ou non pour des raisons de sécurité
                logger.info(
                    f"[EmployeeViewSet] Demande de reset password pour email inexistant: {email}"
                )
                return Response(
                    {
                        "message": "Si cette adresse email existe dans notre système, vous recevrez un email de réinitialisation."
                    },
                    status=status.HTTP_200_OK,
                )

            # Générer un token de réinitialisation (simulation)
            import secrets

            reset_token = secrets.token_urlsafe(32)

            # Envoyer l'email de réinitialisation
            from .services import send_forgot_password_email

            email_sent = send_forgot_password_email(email, reset_token)

            if email_sent:
                logger.info(f"[EmployeeViewSet] Email de reset password envoye a {email}")
                return Response(
                    {"message": "Un email de réinitialisation a été envoyé à votre adresse email."},
                    status=status.HTTP_200_OK,
                )
            else:
                logger.error(f"[EmployeeViewSet] Erreur envoi email reset password a {email}")
                return Response(
                    {"error": "Erreur lors de l'envoi de l'email de réinitialisation."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        except Exception as e:
            logger.error(f"[EmployeeViewSet] Erreur forgot password: {str(e)}")
            return Response(
                {"error": f"Erreur lors de la demande de réinitialisation: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"], url_path="debug-urls")
    def debug_urls(self, request):
        """Action de debug pour vérifier la configuration des URLs (à supprimer en production)"""
        try:
            from django.urls import reverse

            urls_info = {
                "employee-list": reverse("employee-list"),
                "employee-detail": reverse("employee-detail", args=[1]),
                "current_url": request.build_absolute_uri(),
                "method": request.method,
                "available_actions": [
                    "list",
                    "create",
                    "retrieve",
                    "update",
                    "partial_update",
                    "destroy",
                    "employee_stats",
                    "export",
                    "import_employees",
                    "generate_employee_id",
                    "search",
                    "toggle_status",
                ],
            }

            return Response(urls_info)

        except Exception as e:
            return Response(
                {"error": f"Erreur debug URLs: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class WorkSessionViewSet(viewsets.ModelViewSet):
    queryset = WorkSession.objects.all()
    serializer_class = WorkSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtrer par employé si spécifié"""
        queryset = super().get_queryset()
        
        # Les employés ne peuvent voir que leurs propres sessions
        if hasattr(self.request.user, 'role') and self.request.user.role == 'EMPLOYE':
            try:
                employee = Employee.objects.get(user=self.request.user)
                queryset = queryset.filter(employee=employee)
            except Employee.DoesNotExist:
                queryset = queryset.none()
        
        matricule = self.request.query_params.get("matricule")
        if matricule:
            queryset = queryset.filter(matricule=matricule)
        return queryset

    @action(detail=False, methods=["get"], url_path="statistics")
    def statistics(self, request):
        """Statistiques des sessions de travail pour l'employé connecté"""
        try:
            employee = Employee.objects.get(user=request.user)
            sessions = WorkSession.objects.filter(employee=employee)
            
            total_sessions = sessions.count()
            total_work_time = 0
            
            for session in sessions:
                if session.total_work_time:
                    total_work_time += session.total_work_time.total_seconds() / 3600
            
            return Response({
                "total_sessions": total_sessions,
                "total_work_time": round(total_work_time, 2),
            })
        except Employee.DoesNotExist:
            return Response(
                {"error": "Profil employé non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=["post"], url_path="work-sessions")
    def start_session(self, request):
        """Démarrer une nouvelle session de travail"""
        try:
            employee = Employee.objects.get(user=request.user)

            # Vérifier s'il y a déjà une session active
            active_session = WorkSession.objects.filter(employee=employee, status="active").first()

            if active_session:
                return Response(
                    {"error": "Une session est déjà en cours"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Créer une nouvelle session
            session = WorkSession.objects.create(
                employee=employee, notes=request.data.get("notes", "")
            )

            serializer = self.get_serializer(session)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Employee.DoesNotExist:
            return Response(
                {"error": "Profil employé non trouvé"}, status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=["post"], url_path="pause")
    def pause_session(self, request, pk=None):
        """Mettre en pause une session"""
        session = self.get_object()

        if session.employee.user != request.user:
            return Response({"error": "Non autorisé"}, status=status.HTTP_403_FORBIDDEN)

        session.pause_session()
        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="resume")
    def resume_session(self, request, pk=None):
        """Reprendre une session en pause"""
        session = self.get_object()

        if session.employee.user != request.user:
            return Response({"error": "Non autorisé"}, status=status.HTTP_403_FORBIDDEN)

        session.resume_session()
        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="end")
    def end_session(self, request, pk=None):
        """Terminer une session"""
        session = self.get_object()

        if session.employee.user != request.user:
            return Response({"error": "Non autorisé"}, status=status.HTTP_403_FORBIDDEN)

        session.end_session()
        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="current")
    def current_session(self, request):
        """Récupérer la session actuelle de l'employé connecté"""
        try:
            # Essayer de récupérer l'employé, sinon le créer
            employee, created = Employee.objects.get_or_create(
                user=request.user,
                defaults={"matricule": f"EMP{request.user.id:04d}", "is_active": True},
            )

            if created:
                logger.info(
                    f"[WorkSessionViewSet] Profil employé créé automatiquement pour user {request.user.id}"
                )

            current_session = WorkSession.objects.filter(
                employee=employee, status__in=["active", "paused"]
            ).first()

            if current_session:
                serializer = self.get_serializer(current_session)
                return Response(serializer.data)
            else:
                return Response({"detail": "Aucune session active"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"[WorkSessionViewSet] Erreur lors de la récupération de la session: {e}")
            return Response(
                {"error": "Erreur lors de la récupération de la session"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"], url_path="employee-statistics")
    def employee_stats(self, request):
        """Statistiques de travail pour tous les employés avec sessions actives"""
        try:
            logger.info("[WorkSessionViewSet] Récupération des statistiques employés")

            # Récupérer tous les employés actifs
            employees = Employee.objects.filter(is_active=True).select_related("user")
            stats = []

            for employee in employees:
                employee_stats = self._calculate_employee_stats(employee)

                # Filtrer pour ne montrer que les employés avec des sessions actives ou récentes
                if (
                    employee_stats["total_hours_today"] > 0
                    or employee_stats["total_hours_week"] > 0
                    or employee_stats["current_session_status"] in ["active", "paused"]
                ):

                    # Reformater les données pour correspondre au format attendu par le frontend
                    formatted_stats = {
                        "employee_id": employee_stats["employee_id"],
                        "employee_name": employee_stats["employee_name"],
                        "employee_email": employee.email or employee.user.email,
                        "employee_matricule": employee.matricule or f"EMP-{employee.id:03d}",
                        "today_worked_hours": employee_stats["total_hours_today"],
                        "week_worked_hours": employee_stats["total_hours_week"],
                        "month_worked_hours": employee_stats["total_hours_month"],
                        "today_pause_hours": employee_stats.get("pause_hours_today", 0),
                        "week_pause_hours": employee_stats.get("pause_hours_week", 0),
                        "month_pause_hours": employee_stats.get("pause_hours_month", 0),
                        "current_session_status": employee_stats["current_session_status"],
                    }
                    stats.append(formatted_stats)

            logger.info(f"[WorkSessionViewSet] {len(stats)} employés avec sessions actives trouvés")
            total_work_time = 0
            try:
                for e in stats:
                    total_work_time += (
                        e.get("today_worked_hours", 0)
                        + e.get("week_worked_hours", 0)
                        + e.get("month_worked_hours", 0)
                    )
            except Exception:
                total_work_time = 0

            return Response({
                "total_sessions": len(stats),
                "total_work_time": total_work_time,
                "employees": stats,
            })

        except Exception as e:
            logger.error(f"[WorkSessionViewSet] Erreur lors de la récupération des stats: {str(e)}")
            return Response(
                {"error": f"Erreur lors de la récupération des statistiques: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _calculate_employee_stats(self, employee):
        """Calculer les statistiques pour un employé"""
        from datetime import timedelta

        from django.utils import timezone

        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        month_start = today_start.replace(day=1)

        # Sessions d'aujourd'hui
        today_sessions = WorkSession.objects.filter(
            employee=employee, start_time__gte=today_start, status="completed"
        )

        # Sessions de la semaine
        week_sessions = WorkSession.objects.filter(
            employee=employee, start_time__gte=week_start, status="completed"
        )

        # Sessions du mois
        month_sessions = WorkSession.objects.filter(
            employee=employee, start_time__gte=month_start, status="completed"
        )

        # Calculer les heures de travail nettes (soustraire les pauses)
        def calculate_hours(sessions):
            total_seconds = 0
            for session in sessions:
                if session.end_time:
                    gross = (session.end_time - session.start_time).total_seconds()
                    pauses = (
                        session.total_pause_time.total_seconds() if session.total_pause_time else 0
                    )
                    total_seconds += max(0, gross - pauses)
            return round(total_seconds / 3600, 2)

        # Calculer les heures de pause totales
        def calculate_pause_hours(sessions):
            total_pause = sum(
                (session.total_pause_time.total_seconds() if session.total_pause_time else 0)
                for session in sessions
            )
            return round(total_pause / 3600, 2)

        # Session actuelle
        current_session = WorkSession.objects.filter(
            employee=employee, status__in=["active", "paused"]
        ).first()

        data = {
            "employee_id": employee.id,
            "employee_name": employee.full_name,
            "total_hours_today": calculate_hours(today_sessions),
            "total_hours_week": calculate_hours(week_sessions),
            "total_hours_month": calculate_hours(month_sessions),
            "current_session_status": (current_session.status if current_session else "none"),
            "current_session_start": (current_session.start_time if current_session else None),
        }

        # Ajouter les pauses
        data.update(
            {
                "pause_hours_today": calculate_pause_hours(today_sessions),
                "pause_hours_week": calculate_pause_hours(week_sessions),
                "pause_hours_month": calculate_pause_hours(month_sessions),
            }
        )

        return data


class EmployeeWorkStatsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def all_employees(self, request):
        """Statistiques de travail pour tous les employés (admin)"""
        if not request.user.is_staff:
            return Response({"error": "Accès non autorisé"}, status=status.HTTP_403_FORBIDDEN)

        employees = Employee.objects.filter(is_active=True)
        stats = []

        for employee in employees:
            employee_stats = self._calculate_employee_stats(employee)
            stats.append(employee_stats)

        serializer = EmployeeWorkStatsSerializer(stats, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="employee-stats")
    def employee_stats(self, request):
        """Statistiques de travail pour tous les employés avec sessions actives"""
        try:
            logger.info("[WorkSessionViewSet] Récupération des statistiques employés")

            # Récupérer tous les employés actifs
            employees = Employee.objects.filter(is_active=True).select_related("user")
            stats = []

            for employee in employees:
                employee_stats = self._calculate_employee_stats(employee)

                # Filtrer pour ne montrer que les employés avec des sessions actives ou récentes
                if (
                    employee_stats["total_hours_today"] > 0
                    or employee_stats["total_hours_week"] > 0
                    or employee_stats["current_session_status"] in ["active", "paused"]
                ):

                    # Reformater les données pour correspondre au format attendu par le frontend
                    formatted_stats = {
                        "employee_id": employee_stats["employee_id"],
                        "employee_name": employee_stats["employee_name"],
                        "employee_email": employee.email or employee.user.email,
                        "employee_matricule": employee.matricule or f"EMP-{employee.id:03d}",
                        "today_worked_hours": employee_stats["total_hours_today"],
                        "week_worked_hours": employee_stats["total_hours_week"],
                        "month_worked_hours": employee_stats["total_hours_month"],
                        "today_pause_hours": employee_stats["pause_hours_today"],
                        "week_pause_hours": employee_stats["pause_hours_week"],
                        "month_pause_hours": employee_stats["pause_hours_month"],
                        "current_session_status": employee_stats["current_session_status"],
                    }
                    stats.append(formatted_stats)

            logger.info(f"[WorkSessionViewSet] {len(stats)} employés avec sessions actives trouvés")
            return Response(stats)

        except Exception as e:
            logger.error(f"[WorkSessionViewSet] Erreur lors de la récupération des stats: {str(e)}")
            return Response(
                {"error": f"Erreur lors de la récupération des statistiques: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def my_stats(self, request):
        """Statistiques de travail pour l'employé connecté"""
        try:
            employee = Employee.objects.get(user=request.user)
            stats = self._calculate_employee_stats(employee)
            serializer = EmployeeWorkStatsSerializer([stats], many=True)
            return Response(serializer.data[0])
        except Employee.DoesNotExist:
            return Response(
                {"error": "Profil employé non trouvé"}, status=status.HTTP_404_NOT_FOUND
            )

    def _calculate_employee_stats(self, employee):
        """Calculer les statistiques pour un employé"""
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        month_start = today_start.replace(day=1)

        # Sessions d'aujourd'hui
        today_sessions = WorkSession.objects.filter(
            employee=employee, start_time__gte=today_start, status="completed"
        )

        # Sessions de la semaine
        week_sessions = WorkSession.objects.filter(
            employee=employee, start_time__gte=week_start, status="completed"
        )

        # Sessions du mois
        month_sessions = WorkSession.objects.filter(
            employee=employee, start_time__gte=month_start, status="completed"
        )

        # Calculer les heures de travail nettes (soustraire les pauses)
        def calculate_hours(sessions):
            total_seconds = 0
            for session in sessions:
                if session.end_time:
                    gross = (session.end_time - session.start_time).total_seconds()
                    pauses = (
                        session.total_pause_time.total_seconds() if session.total_pause_time else 0
                    )
                    total_seconds += max(0, gross - pauses)
            return round(total_seconds / 3600, 2)

        # Calculer les heures de pause totales
        def calculate_pause_hours(sessions):
            total_pause = sum(
                (session.total_pause_time.total_seconds() if session.total_pause_time else 0)
                for session in sessions
            )
            return round(total_pause / 3600, 2)

        # Session actuelle
        current_session = WorkSession.objects.filter(
            employee=employee, status__in=["active", "paused"]
        ).first()

        data = {
            "employee_id": employee.id,
            "employee_name": employee.full_name,
            "total_hours_today": calculate_hours(today_sessions),
            "total_hours_week": calculate_hours(week_sessions),
            "total_hours_month": calculate_hours(month_sessions),
            "current_session_status": (current_session.status if current_session else "none"),
            "current_session_start": (current_session.start_time if current_session else None),
        }

        # Ajouter les pauses
        data.update(
            {
                "pause_hours_today": calculate_pause_hours(today_sessions),
                "pause_hours_week": calculate_pause_hours(week_sessions),
                "pause_hours_month": calculate_pause_hours(month_sessions),
            }
        )

        return data

    @action(detail=False, methods=["get"], url_path="export")
    def export_sessions(self, request):
        """Exporter les sessions de travail en CSV"""
        try:
            import csv

            from django.http import HttpResponse

            sessions = WorkSession.objects.all().select_related("employee__user")

            response = HttpResponse(content_type="text/csv")
            response["Content-Disposition"] = 'attachment; filename="work_sessions.csv"'

            writer = csv.writer(response)
            writer.writerow(
                [
                    "ID",
                    "Employé",
                    "Matricule",
                    "Date Début",
                    "Date Fin",
                    "Durée (h)",
                    "Pause (h)",
                    "Statut",
                    "Notes",
                ]
            )

            for session in sessions:
                duration = session.duration_hours if hasattr(session, "duration_hours") else 0
                pause_time = (
                    session.total_pause_time.total_seconds() / 3600
                    if session.total_pause_time
                    else 0
                )

                writer.writerow(
                    [
                        session.id,
                        session.employee.full_name,
                        session.employee.matricule,
                        (
                            session.start_time.strftime("%Y-%m-%d %H:%M:%S")
                            if session.start_time
                            else ""
                        ),
                        (
                            session.end_time.strftime("%Y-%m-%d %H:%M:%S")
                            if session.end_time
                            else ""
                        ),
                        f"{duration:.2f}",
                        f"{pause_time:.2f}",
                        session.status,
                        session.notes or "",
                    ]
                )

            return response

        except Exception as e:
            return Response(
                {"error": f"Erreur lors de l'export: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def admin_dashboard(self, request):
        """Dashboard admin avec statistiques détaillées incluant les pauses"""
        if not request.user.is_staff:
            return Response({"error": "Accès non autorisé"}, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        month_start = today_start.replace(day=1)

        # Statistiques des employés
        total_employees = Employee.objects.filter(is_active=True).count()
        active_employees = Employee.objects.filter(is_active=True).count()

        # Employés actuellement au travail
        employees_at_work = (
            WorkSession.objects.filter(status="active").values("employee").distinct().count()
        )

        # Employés en pause
        employees_on_break = (
            WorkSession.objects.filter(status="paused").values("employee").distinct().count()
        )

        # Calculer les heures totales pour tous les employés
        def calculate_total_hours(sessions):
            total_seconds = 0
            total_pause_seconds = 0
            for session in sessions:
                if session.end_time:
                    gross = (session.end_time - session.start_time).total_seconds()
                    pauses = (
                        session.total_pause_time.total_seconds() if session.total_pause_time else 0
                    )
                    total_seconds += max(0, gross - pauses)
                    total_pause_seconds += pauses
            return round(total_seconds / 3600, 2), round(total_pause_seconds / 3600, 2)

        # Sessions d'aujourd'hui
        today_sessions = WorkSession.objects.filter(start_time__gte=today_start, status="completed")
        today_work, today_pause = calculate_total_hours(today_sessions)

        # Sessions de la semaine
        week_sessions = WorkSession.objects.filter(start_time__gte=week_start, status="completed")
        week_work, week_pause = calculate_total_hours(week_sessions)

        # Sessions du mois
        month_sessions = WorkSession.objects.filter(start_time__gte=month_start, status="completed")
        month_work, month_pause = calculate_total_hours(month_sessions)

        # Top employés du jour
        top_workers_today = self._get_top_workers(today_start, now)
        top_workers_week = self._get_top_workers(week_start, now)
        top_workers_month = self._get_top_workers(month_start, now)

        # Employés en pause
        employees_on_break_list = self._get_employees_on_break()

        data = {
            "total_employees": total_employees,
            "active_employees": active_employees,
            "employees_at_work": employees_at_work,
            "employees_on_break": employees_on_break,
            "total_work_hours_today": today_work,
            "total_pause_hours_today": today_pause,
            "total_work_hours_week": week_work,
            "total_pause_hours_week": week_pause,
            "total_work_hours_month": month_work,
            "total_pause_hours_month": month_pause,
            "top_workers_today": top_workers_today,
            "top_workers_week": top_workers_week,
            "top_workers_month": top_workers_month,
            "employees_on_break_list": employees_on_break_list,
        }

        serializer = AdminDashboardStatsSerializer(data)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def work_history(self, request, pk=None):
        """Historique détaillé des heures de travail d'un employé"""
        try:
            employee = Employee.objects.get(pk=pk)
        except Employee.DoesNotExist:
            return Response({"error": "Employé non trouvé"}, status=status.HTTP_404_NOT_FOUND)

        # Vérifier les permissions
        if not request.user.is_staff and request.user != employee.user:
            return Response({"error": "Accès non autorisé"}, status=status.HTTP_403_FORBIDDEN)

        # Calculer l'historique
        history = self._calculate_employee_work_history(employee)
        serializer = EmployeeWorkHistorySerializer(history)
        return Response(serializer.data)

    def _get_top_workers(self, start_date, end_date):
        """Obtenir les meilleurs travailleurs pour une période donnée"""
        sessions = WorkSession.objects.filter(
            start_time__gte=start_date, start_time__lte=end_date, status="completed"
        ).select_related("employee")

        employee_stats = {}
        for session in sessions:
            if session.end_time:
                employee_id = session.employee.id
                if employee_id not in employee_stats:
                    employee_stats[employee_id] = {
                        "employee_name": session.employee.full_name,
                        "total_hours": 0,
                        "pause_hours": 0,
                    }

                gross = (session.end_time - session.start_time).total_seconds()
                pauses = session.total_pause_time.total_seconds() if session.total_pause_time else 0
                net_hours = max(0, gross - pauses) / 3600

                employee_stats[employee_id]["total_hours"] += net_hours
                employee_stats[employee_id]["pause_hours"] += pauses / 3600

        # Trier par heures de travail
        sorted_workers = sorted(
            employee_stats.values(), key=lambda x: x["total_hours"], reverse=True
        )[
            :5
        ]  # Top 5

        return sorted_workers

    def _get_employees_on_break(self):
        """Obtenir la liste des employés actuellement en pause"""
        paused_sessions = WorkSession.objects.filter(
            status="paused", employee__user__role="EMPLOYE"
        ).select_related("employee")

        employees_on_break = []
        for session in paused_sessions:
            pause_duration = (
                timezone.now() - session.pause_start_time
                if session.pause_start_time
                else timezone.now() - session.start_time
            )
            employees_on_break.append(
                {
                    "employee_name": session.employee.full_name,
                    "pause_start": session.pause_start_time,
                    "pause_duration": str(pause_duration).split(".")[0],  # Format HH:MM:SS
                    "session_start": session.start_time,
                }
            )

        return employees_on_break

    def _calculate_employee_work_history(self, employee):
        """Calculer l'historique complet des heures de travail d'un employé"""
        # Sessions complètes de l'employé
        all_sessions = WorkSession.objects.filter(employee=employee).order_by("-start_time")

        # Calculer les statistiques globales
        total_sessions = all_sessions.count()
        total_work_hours = 0
        total_pause_hours = 0

        for session in all_sessions:
            if session.end_time:
                gross = (session.end_time - session.start_time).total_seconds()
                pauses = session.total_pause_time.total_seconds() if session.total_pause_time else 0
                total_work_hours += max(0, gross - pauses) / 3600
                total_pause_hours += pauses / 3600

        # Historique quotidien (30 derniers jours)
        daily_stats = self._calculate_daily_stats(employee, 30)

        # Historique hebdomadaire (12 dernières semaines)
        weekly_stats = self._calculate_weekly_stats(employee, 12)

        # Historique mensuel (12 derniers mois)
        monthly_stats = self._calculate_monthly_stats(employee, 12)

        # Sessions récentes (10 dernières)
        recent_sessions = all_sessions[:10]
        recent_sessions_data = []
        for session in recent_sessions:
            session_data = WorkSessionDetailSerializer(session).data
            # Calculer les champs calculés
            if session.end_time:
                duration = session.end_time - session.start_time
                session_data["duration_formatted"] = str(duration).split(".")[0]
            else:
                session_data["duration_formatted"] = "En cours"

            if session.total_pause_time:
                session_data["pause_duration_formatted"] = str(session.total_pause_time).split(".")[
                    0
                ]
            else:
                session_data["pause_duration_formatted"] = "00:00:00"

            # Temps de travail net
            if session.end_time:
                gross = (session.end_time - session.start_time).total_seconds()
                pauses = session.total_pause_time.total_seconds() if session.total_pause_time else 0
                net_seconds = max(0, gross - pauses)
                session_data["net_work_time"] = str(timedelta(seconds=int(net_seconds)))
            else:
                session_data["net_work_time"] = "En cours"

            recent_sessions_data.append(session_data)

        return {
            "employee_id": employee.id,
            "employee_name": employee.full_name,
            "matricule": employee.matricule or "",
            "position": employee.position or "",
            "total_work_sessions": total_sessions,
            "total_work_hours": round(total_work_hours, 2),
            "total_pause_hours": round(total_pause_hours, 2),
            "net_work_hours": round(total_work_hours, 2),
            "daily_stats": daily_stats,
            "weekly_stats": weekly_stats,
            "monthly_stats": monthly_stats,
            "recent_sessions": recent_sessions_data,
        }

    def _calculate_daily_stats(self, employee, days_count):
        """Calculer les statistiques quotidiennes"""
        now = timezone.now()
        daily_stats = []

        for i in range(days_count):
            date = now.date() - timedelta(days=i)
            date_start = timezone.make_aware(datetime.combine(date, datetime.min.time()))
            date_end = date_start + timedelta(days=1)

            sessions = WorkSession.objects.filter(
                employee=employee, start_time__gte=date_start, start_time__lt=date_end
            )

            total_hours = 0
            pause_hours = 0
            sessions_count = sessions.count()
            status = "completed"

            for session in sessions:
                if session.status == "active":
                    status = "active"
                elif session.status == "paused":
                    status = "paused"

                if session.end_time:
                    gross = (session.end_time - session.start_time).total_seconds()
                    pauses = (
                        session.total_pause_time.total_seconds() if session.total_pause_time else 0
                    )
                    total_hours += max(0, gross - pauses) / 3600
                    pause_hours += pauses / 3600

            daily_stats.append(
                {
                    "date": date,
                    "total_hours": round(total_hours, 2),
                    "pause_hours": round(pause_hours, 2),
                    "net_hours": round(total_hours, 2),
                    "sessions_count": sessions_count,
                    "status": status,
                }
            )

        return daily_stats

    def _calculate_weekly_stats(self, employee, weeks_count):
        """Calculer les statistiques hebdomadaires"""
        now = timezone.now()
        weekly_stats = []

        for i in range(weeks_count):
            week_start = now.date() - timedelta(weeks=i)
            week_start = week_start - timedelta(days=week_start.weekday())
            week_end = week_start + timedelta(days=7)

            week_start_dt = timezone.make_aware(datetime.combine(week_start, datetime.min.time()))
            week_end_dt = timezone.make_aware(datetime.combine(week_end, datetime.min.time()))

            sessions = WorkSession.objects.filter(
                employee=employee,
                start_time__gte=week_start_dt,
                start_time__lt=week_end_dt,
            )

            total_hours = 0
            pause_hours = 0
            sessions_count = sessions.count()

            for session in sessions:
                if session.end_time:
                    gross = (session.end_time - session.start_time).total_seconds()
                    pauses = (
                        session.total_pause_time.total_seconds() if session.total_pause_time else 0
                    )
                    total_hours += max(0, gross - pauses) / 3600
                    pause_hours += pauses / 3600

            # Calculer le breakdown quotidien pour cette semaine
            daily_breakdown = self._calculate_daily_stats(employee, 7)

            weekly_stats.append(
                {
                    "week_start": week_start,
                    "week_end": week_end - timedelta(days=1),
                    "total_hours": round(total_hours, 2),
                    "pause_hours": round(pause_hours, 2),
                    "net_hours": round(total_hours, 2),
                    "sessions_count": sessions_count,
                    "daily_breakdown": daily_breakdown,
                }
            )

        return weekly_stats

    def _calculate_monthly_stats(self, employee, months_count):
        """Calculer les statistiques mensuelles"""
        now = timezone.now()
        monthly_stats = []

        month_names = [
            "Janvier",
            "Février",
            "Mars",
            "Avril",
            "Mai",
            "Juin",
            "Juillet",
            "Août",
            "Septembre",
            "Octobre",
            "Novembre",
            "Décembre",
        ]

        for i in range(months_count):
            # Calculer le début du mois
            if now.month - i <= 0:
                year = now.year - ((i - now.month) // 12 + 1)
                month = 12 - ((i - now.month) % 12)
            else:
                year = now.year
                month = now.month - i

            month_start = datetime(year, month, 1).date()
            if month == 12:
                month_end = datetime(year + 1, 1, 1).date()
            else:
                month_end = datetime(year, month + 1, 1).date()

            month_start_dt = timezone.make_aware(datetime.combine(month_start, datetime.min.time()))
            month_end_dt = timezone.make_aware(datetime.combine(month_end, datetime.min.time()))

            sessions = WorkSession.objects.filter(
                employee=employee,
                start_time__gte=month_start_dt,
                start_time__lt=month_end_dt,
            )

            total_hours = 0
            pause_hours = 0
            sessions_count = sessions.count()

            for session in sessions:
                if session.end_time:
                    gross = (session.end_time - session.start_time).total_seconds()
                    pauses = (
                        session.total_pause_time.total_seconds() if session.total_pause_time else 0
                    )
                    total_hours += max(0, gross - pauses) / 3600
                    pause_hours += pauses / 3600

            # Calculer le breakdown hebdomadaire pour ce mois
            weekly_breakdown = self._calculate_weekly_stats(employee, 5)  # ~5 semaines par mois

            monthly_stats.append(
                {
                    "month": f"{year:04d}-{month:02d}",
                    "year": year,
                    "month_name": month_names[month - 1],
                    "total_hours": round(total_hours, 2),
                    "pause_hours": round(pause_hours, 2),
                    "net_hours": round(total_hours, 2),
                    "sessions_count": sessions_count,
                    "weekly_breakdown": weekly_breakdown,
                }
            )

        return monthly_stats
