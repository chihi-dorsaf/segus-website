# projects/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ProjectViewSet, SubTaskViewSet, TaskViewSet

router = DefaultRouter()

# IMPORTANT: L'ordre est crucial - les paths spécifiques AVANT le path vide
router.register(r"", ProjectViewSet, basename="project")
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"subtasks", SubTaskViewSet, basename="subtask")

urlpatterns = [
    path("", include(router.urls)),
]
