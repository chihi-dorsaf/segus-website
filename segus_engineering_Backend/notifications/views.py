from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from employees.models import Employee

from .models import Notification
from .serializers import NotificationSerializer

User = get_user_model()


class UserNotifications(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        if request.user.id != int(user_id) and not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)
        qs = Notification.objects.filter(user_id=user_id)
        return Response(NotificationSerializer(qs, many=True).data)


class UnreadCount(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        if request.user.id != int(user_id) and not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)
        count = Notification.objects.filter(user_id=user_id, is_read=False).count()
        return Response({"count": count})


class MarkRead(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk)
        except Notification.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if request.user != notif.user and not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)
        notif.is_read = True
        notif.save()
        return Response({"success": True})


class MarkAllRead(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, user_id):
        if request.user.id != int(user_id) and not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)
        Notification.objects.filter(user_id=user_id, is_read=False).update(is_read=True)
        return Response({"success": True})


class ProjectAssignment(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        project_id = request.data.get("project_id")
        project_title = request.data.get("project_title", "Nouveau projet")
        employee_ids = request.data.get("employee_ids", []) or []
        employee_matricules = request.data.get("employee_matricules", []) or []

        # Résoudre les utilisateurs via id et/ou matricule
        users = []
        if employee_ids:
            # Interpréter ces IDs comme des IDs d'employés et résoudre les users liés
            emp_user_ids = Employee.objects.filter(id__in=employee_ids).values_list(
                "user_id", flat=True
            )
            users += list(User.objects.filter(id__in=emp_user_ids))
        if employee_matricules:
            emp_user_ids = Employee.objects.filter(matricule__in=employee_matricules).values_list(
                "user_id", flat=True
            )
            users += list(User.objects.filter(id__in=emp_user_ids))

        created = 0
        emailed = 0
        for u in set(users):
            Notification.objects.create(
                user=u,
                title="Affectation au projet",
                message=f"Vous avez été affecté(e) au projet: {project_title}",
                type="project_assignment",
                project_id=project_id,
            )
            if u.email:
                try:
                    send_mail(
                        subject=f"Nouveau projet: {project_title}",
                        message=(
                            f"Bonjour {u.get_full_name() or u.username},\n\n"
                            f"Vous avez été affecté(e) au projet: {project_title} (ID {project_id}).\n"
                            "Connectez-vous à votre espace pour voir les détails."
                        ),
                        from_email=None,
                        recipient_list=[u.email],
                        fail_silently=True,
                    )
                    emailed += 1
                except Exception:
                    pass
            created += 1

        return Response({"success": True, "notifications_created": created, "emails_sent": emailed})
