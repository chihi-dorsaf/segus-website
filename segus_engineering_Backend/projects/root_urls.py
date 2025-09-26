from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SubTaskViewSet, TaskViewSet

router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"subtasks", SubTaskViewSet, basename="subtask")

urlpatterns = [
    path("", include(router.urls)),
]





