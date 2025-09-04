# users/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet

router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')  # Changed prefix to '' for /api/auth/users/

urlpatterns = [
    path('', include(router.urls)),
]