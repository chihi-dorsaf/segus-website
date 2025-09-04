# urls.py
from django.contrib import admin
from django.urls import path, include
from users.views import jwt_create_with_email

urlpatterns = [
    path('admin/', admin.site.urls),

    # Djoser (auth générique)
    path('api/auth/', include('djoser.urls')),
    path('api/auth/jwt/', include('djoser.urls.jwt')),
    path('api/auth/jwt/create-with-email/', jwt_create_with_email, name='jwt_create_with_email'),
    path('auth/', include('djoser.urls')),

    # Nos endpoints users (séparés pour éviter conflits avec Djoser)
    path('api/users/', include('users.urls')),

    # Autres apps
    path('api/employees/', include('employees.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/chatbot/', include('chatbot.urls')),
    path('api/gamification/', include('gamification.urls')),
    path('api/realtime/', include('realtime.urls')),
    path('api/contact-messages/', include('contact_messages.urls')),
    path('', include('jobs.urls')),
]