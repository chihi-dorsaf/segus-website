from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EmployeeViewSet, EmployeeWorkStatsViewSet, WorkSessionViewSet

router = DefaultRouter()
router.register(r"", EmployeeViewSet)
router.register(r"work-sessions", WorkSessionViewSet, basename="worksession")
router.register(r"work-stats", EmployeeWorkStatsViewSet, basename="workstats")

urlpatterns = [
    path("", include(router.urls)),
]
