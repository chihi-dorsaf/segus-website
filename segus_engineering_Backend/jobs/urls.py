from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    JobAlertViewSet,
    JobApplicationViewSet,
    JobCategoryViewSet,
    JobOfferViewSet,
)

router = DefaultRouter()
router.register(r"categories", JobCategoryViewSet)
router.register(r"offers", JobOfferViewSet)
router.register(r"applications", JobApplicationViewSet)
router.register(r"alerts", JobAlertViewSet)

urlpatterns = [
    path("api/jobs/", include(router.urls)),
]
