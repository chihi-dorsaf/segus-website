# urls.py
from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

from users.views import (
    UserViewSet,
    jwt_create_with_email,
    password_reset_confirm_view,
    password_reset_request_code_view,
    password_reset_verify_code_view,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # Djoser (auth générique)
    path("api/auth/", include("djoser.urls")),
    path("api/auth/jwt/", include("djoser.urls.jwt")),
    path(
        "api/auth/jwt/create-with-email/",
        jwt_create_with_email,
        name="jwt_create_with_email",
    ),
    # Password reset by code (expected paths in tests)
    path(
        "api/auth/password-reset-code/request/",
        password_reset_request_code_view,
        name="password-reset-request",
    ),
    path(
        "api/auth/password-reset-code/verify/",
        password_reset_verify_code_view,
        name="password-reset-verify",
    ),
    path(
        "api/auth/password-reset-code/confirm/",
        password_reset_confirm_view,
        name="password-reset-confirm",
    ),
    path("auth/", include("djoser.urls")),
    # Nos endpoints users (séparés pour éviter conflits avec Djoser)
    path("api/users/", include("users.urls")),
    # Autres apps
    path("api/employees/", include("employees.urls")),
    # Root-level work sessions endpoints
    path("api/", include("employees.work_urls")),
    path("api/projects/", include("projects.urls")),
    # Root-level tasks and subtasks endpoints
    path("api/", include("projects.root_urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/chatbot/", include("chatbot.urls")),
    path("api/gamification/", include("gamification.urls")),
    path("api/realtime/", include("realtime.urls")),
    path("api/contact-messages/", include("contact_messages.urls")),
    path("", include("jobs.urls")),
]

# Serve media in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
