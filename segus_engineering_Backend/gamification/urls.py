from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DailyObjectiveViewSet, SubTaskViewSet, DailyPerformanceViewSet,
    MonthlyPerformanceViewSet, BadgeViewSet, EmployeeStatsViewSet
)

router = DefaultRouter()
router.register(r'daily-objectives', DailyObjectiveViewSet)
router.register(r'subtasks', SubTaskViewSet)
router.register(r'daily-performance', DailyPerformanceViewSet)
router.register(r'monthly-performance', MonthlyPerformanceViewSet)
router.register(r'badges', BadgeViewSet)
router.register(r'employee-stats', EmployeeStatsViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
