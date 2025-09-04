# projects/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, TaskViewSet, SubTaskViewSet

router = DefaultRouter()

# IMPORTANT: L'ordre est crucial - les paths spécifiques AVANT le path vide
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'subtasks', SubTaskViewSet, basename='subtask')
router.register(r'', ProjectViewSet, basename='project')

urlpatterns = [
    path('', include(router.urls)),
]