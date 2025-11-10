import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from employees.permissions import IsAdminRole
from .models import Project, SubTask, Task
from .serializers import (
    ProjectDetailSerializer,
    ProjectSerializer,
    SubTaskSerializer,
    TaskSerializer,
)

User = get_user_model()
logger = logging.getLogger(__name__)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Configuration des permissions par action"""
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProjectDetailSerializer
        return ProjectSerializer

    def get_queryset(self):
        queryset = Project.objects.select_related("created_by").prefetch_related(
            "assigned_employees", "tasks__assigned_employees"
        )

        # Filtrage par statut
        status_filter = self.request.query_params.get("status", None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filtrage par employé assigné
        employee_id = self.request.query_params.get("employee", None)
        if employee_id:
            queryset = queryset.filter(assigned_employees__id=employee_id)

        # Recherche
        search = self.request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        return queryset.order_by("-created_at")

    def perform_create(self, serializer):
        print(f"DEBUG VIEWS: perform_create called with user: {self.request.user}")
        print(f"DEBUG VIEWS: User ID: {self.request.user.id}")
        print(f"DEBUG VIEWS: User role: {self.request.user.role}")
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"])
    def all(self, request):
        """Récupérer tous les projets sans pagination"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def stats(self, request, pk=None):
        """Récupérer les statistiques d'un projet"""
        project = self.get_object()
        stats = {
            "totalTasks": project.total_tasks,
            "completedTasks": project.completed_tasks,
            "progressPercentage": project.progress_percentage,
            "totalEmployees": project.assigned_employees.count(),
            "tasksInProgress": project.tasks.filter(status="IN_PROGRESS").count(),
            "tasksTodo": project.tasks.filter(status="TODO").count(),
            "tasksBlocked": project.tasks.filter(status="BLOCKED").count(),
        }
        return Response(stats)

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        """Assigner un employé à un projet"""
        project = self.get_object()
        employee_id = request.data.get("employee_id")

        try:
            employee = User.objects.get(id=employee_id)
            project.assigned_employees.add(employee)
            # Notifier l'employé en temps réel
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{employee.id}",
                {
                    "type": "notification",
                    "data": {
                        "title": "Affectation au projet",
                        "message": f"Vous avez été ajouté au projet: {project.title}",
                        "type": "project",
                        "project_id": project.id,
                        "created_at": timezone.now().isoformat(),
                        "is_read": False,
                    },
                },
            )
            return Response({"message": "Employé assigné avec succès"})
        except User.DoesNotExist:
            return Response({"error": "Employé non trouvé"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=["post"])
    def unassign(self, request, pk=None):
        """Désassigner un employé d'un projet"""
        project = self.get_object()
        employee_id = request.data.get("employee_id")

        try:
            employee = User.objects.get(id=employee_id)
            project.assigned_employees.remove(employee)
            return Response({"message": "Employé désassigné avec succès"})
        except User.DoesNotExist:
            return Response({"error": "Employé non trouvé"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=["get"], url_path="employee/dashboard")
    def employee_dashboard(self, request):
        """Dashboard pour l'employé connecté"""
        user = request.user

        try:
            # Récupérer l'employé
            from employees.models import Employee

            employee = Employee.objects.get(user=user)

            # Projets assignés à l'employé
            projects = Project.objects.filter(assigned_employees=user)

            # Statistiques des projets
            total_projects = projects.count()
            active_projects = projects.filter(status="IN_PROGRESS").count()
            completed_projects = projects.filter(status="COMPLETED").count()

            # Calculer les projets en retard de manière sécurisée
            overdue_projects = 0
            try:
                overdue_projects = projects.filter(
                    deadline__lt=timezone.now().date(),
                    status__in=["TODO", "IN_PROGRESS"],
                ).count()
            except Exception:
                overdue_projects = 0

            # Tâches assignées
            tasks = Task.objects.filter(assigned_employees=user)
            total_tasks = tasks.count()
            completed_tasks = tasks.filter(status="COMPLETED").count()
            in_progress_tasks = tasks.filter(status="IN_PROGRESS").count()
            todo_tasks = tasks.filter(status="TODO").count()

            # Sous-tâches assignées
            subtasks = SubTask.objects.filter(assigned_employees=user)
            total_subtasks = subtasks.count()
            completed_subtasks = subtasks.filter(is_completed=True).count()

            # Tâches urgentes (priorité haute et deadline proche)
            urgent_tasks = []
            try:
                urgent_tasks = tasks.filter(status__in=["TODO", "IN_PROGRESS"]).order_by(
                    "deadline"
                )[:5]
            except Exception:
                urgent_tasks = []

            # Projets récents avec détails
            recent_projects = []
            try:
                for project in projects.order_by("-created_at")[:5]:
                    project_data = {
                        "id": project.id,
                        "name": project.title,
                        "status": (project.status.lower() if project.status else "unknown"),
                        "deadline": (project.deadline.isoformat() if project.deadline else None),
                        "progress": getattr(project, "progress_percentage", 0) or 0,
                        "client_name": getattr(project, "client_name", "N/A"),
                    }
                    recent_projects.append(project_data)
            except Exception as e:
                logger.error(f"Erreur lors de la récupération des projets récents: {str(e)}")
                recent_projects = []

            # Tâches urgentes avec détails
            urgent_tasks_data = []
            try:
                for task in urgent_tasks:
                    task_data = {
                        "id": task.id,
                        "title": task.title,
                        "priority": (
                            getattr(task, "priority", "medium").lower()
                            if hasattr(task, "priority")
                            else "medium"
                        ),
                        "deadline": (task.deadline.isoformat() if task.deadline else None),
                        "progress": getattr(task, "progress", 0) or 0,
                        "project_name": task.project.title if task.project else "N/A",
                        "status": task.status.lower() if task.status else "unknown",
                    }
                    urgent_tasks_data.append(task_data)
            except Exception as e:
                logger.error(f"Erreur lors de la récupération des tâches urgentes: {str(e)}")
                urgent_tasks_data = []

            # Activité récente simulée
            recent_activity = [
                {
                    "type": "task",
                    "title": "Tâche mise à jour",
                    "description": "Progression mise à jour",
                    "project_name": "Projet récent",
                    "timestamp": timezone.now().isoformat(),
                }
            ]

            # Calculer la performance (basée sur les tâches terminées)
            performance_percentage = 0
            if total_tasks > 0:
                performance_percentage = round((completed_tasks / total_tasks) * 100)

            performance_level = (
                "Excellent"
                if performance_percentage >= 90
                else (
                    "Bon"
                    if performance_percentage >= 70
                    else "Moyen" if performance_percentage >= 50 else "À améliorer"
                )
            )

            dashboard_data = {
                "employee_info": {
                    "name": employee.full_name,
                    "position": getattr(employee, "position", "Employé"),
                    "email": employee.email or user.email,
                },
                "projects_overview": {
                    "total": total_projects,
                    "active": active_projects,
                    "completed": completed_projects,
                    "overdue": overdue_projects,
                },
                "tasks_overview": {
                    "total": total_tasks,
                    "completed": completed_tasks,
                    "in_progress": in_progress_tasks,
                    "todo": todo_tasks,
                },
                "subtasks_overview": {
                    "total": total_subtasks,
                    "completed": completed_subtasks,
                    "pending": total_subtasks - completed_subtasks,
                },
                "performance": {
                    "percentage": performance_percentage,
                    "level": performance_level,
                },
                "recent_projects": recent_projects,
                "urgent_tasks": urgent_tasks_data,
                "recent_activity": recent_activity,
            }

            return Response(dashboard_data)

        except Employee.DoesNotExist:
            return Response(
                {"error": "Profil employé non trouvé"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Erreur dans employee_dashboard: {str(e)}")
            return Response(
                {"error": "Erreur lors du chargement du dashboard"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"], url_path="employee/projects")
    def employee_projects(self, request):
        """Projets assignés à l'employé connecté"""
        user = request.user
        projects = Project.objects.filter(assigned_employees=user)

        # Filtrage par statut si fourni
        status_filter = request.query_params.get("status", None)
        if status_filter:
            projects = projects.filter(status=status_filter)

        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="employee/tasks")
    def employee_tasks(self, request):
        """Tâches assignées à l'employé connecté"""
        user = request.user
        tasks = Task.objects.filter(assigned_employees=user)

        # Filtrage par statut si fourni
        status_filter = request.query_params.get("status", None)
        if status_filter:
            tasks = tasks.filter(status=status_filter)

        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Task.objects.select_related("project", "created_by").prefetch_related(
            "assigned_employees", "subtasks"
        )

        # Filtrage par projet
        project_id = self.request.query_params.get("project", None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        # Filtrage par statut
        status_filter = self.request.query_params.get("status", None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filtrage par employé assigné
        employee_id = self.request.query_params.get("employee", None)
        if employee_id:
            queryset = queryset.filter(assigned_employees__id=employee_id)

        # Filtrage par priorité
        priority_filter = self.request.query_params.get("priority", None)
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)

        return queryset.order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        # Émettre des notifications temps réel pour chaque employé assigné
        subtask = serializer.instance
        try:
            assigned_users = list(subtask.assigned_employees.all())
        except Exception:
            assigned_users = []

        if assigned_users:
            channel_layer = get_channel_layer()
            for user in assigned_users:
                try:
                    async_to_sync(channel_layer.group_send)(
                        f"user_{user.id}",
                        {
                            "type": "notification",
                            "data": {
                                "title": "Nouvelle sous-tâche",
                                "message": f"Vous avez été assigné à la sous-tâche: {getattr(subtask, 'section_name', 'Sous-tâche')}",
                                "type": "subtask",
                                "subtask_id": subtask.id,
                                "task_id": subtask.task_id if hasattr(subtask, 'task_id') else None,
                                "created_at": timezone.now().isoformat(),
                                "is_read": False,
                            },
                        },
                    )
                except Exception:
                    # Ne pas casser la création si la notif échoue
                    logger.exception("Erreur d'envoi de notification temps réel")


class SubTaskViewSet(viewsets.ModelViewSet):
    queryset = SubTask.objects.all()
    serializer_class = SubTaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = SubTask.objects.select_related("task", "created_by").prefetch_related(
            "assigned_employees"
        )

        # Filtrage par tâche
        task_id = self.request.query_params.get("task", None)
        if task_id:
            queryset = queryset.filter(task_id=task_id)

        # Filtrage par statut de completion
        is_completed = self.request.query_params.get("completed", None)
        if is_completed is not None:
            completed = is_completed.lower() in ["true", "1", "yes"]
            queryset = queryset.filter(is_completed=completed)

        # Filtrage par employé assigné
        employee_id = self.request.query_params.get("employee", None)
        if employee_id:
            queryset = queryset.filter(assigned_employees__id=employee_id)

        return queryset.order_by("section_number")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="mark_completed")
    def mark_completed(self, request, pk=None):
        subtask = self.get_object()
        subtask.is_completed = True
        from django.utils import timezone
        subtask.completed_at = timezone.now()
        subtask.save()
        return Response(SubTaskSerializer(subtask).data)

    @action(detail=True, methods=["post"], url_path="mark_uncompleted")
    def mark_uncompleted(self, request, pk=None):
        subtask = self.get_object()
        subtask.is_completed = False
        subtask.completed_at = None
        subtask.save()
        return Response(SubTaskSerializer(subtask).data)

    @action(detail=False, methods=["get"], url_path="my-subtasks")
    def my_subtasks(self, request):
        """Sous-tâches assignées à l'employé connecté"""
        user = request.user
        subtasks = SubTask.objects.filter(assigned_employees=user)

        # Filtrage par statut de completion si fourni
        is_completed = request.query_params.get("completed", None)
        if is_completed is not None:
            completed = is_completed.lower() in ["true", "1", "yes"]
            subtasks = subtasks.filter(is_completed=completed)

        serializer = SubTaskSerializer(subtasks, many=True)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        """Mise à jour d'une sous-tâche avec gestion du statut"""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # Si is_completed est mis à True, définir completed_at
        if "is_completed" in request.data and request.data["is_completed"]:
            from django.utils import timezone

            serializer.validated_data["completed_at"] = timezone.now()
        elif "is_completed" in request.data and not request.data["is_completed"]:
            # Si is_completed est mis à False, effacer completed_at
            serializer.validated_data["completed_at"] = None

        self.perform_update(serializer)

        if getattr(instance, "_prefetched_objects_cache", None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)
