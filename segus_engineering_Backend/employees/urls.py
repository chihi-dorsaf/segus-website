from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmployeeViewSet, WorkSessionViewSet, EmployeeWorkStatsViewSet
)

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet)
router.register(r'work-sessions', WorkSessionViewSet, basename='worksession')
router.register(r'work-stats', EmployeeWorkStatsViewSet, basename='workstats')

urlpatterns = [
    path('', include(router.urls)),
]