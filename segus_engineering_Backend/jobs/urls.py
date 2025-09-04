from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobCategoryViewSet, JobOfferViewSet, JobApplicationViewSet, JobAlertViewSet

router = DefaultRouter()
router.register(r'categories', JobCategoryViewSet)
router.register(r'offers', JobOfferViewSet)
router.register(r'applications', JobApplicationViewSet)
router.register(r'alerts', JobAlertViewSet)

urlpatterns = [
    path('api/jobs/', include(router.urls)),
]
