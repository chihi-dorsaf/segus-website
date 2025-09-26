"""
ASGI config for segus_engineering_Backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

from realtime import routing

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "segus_engineering_Backend.settings")

# Get Django ASGI application
django_asgi_app = get_asgi_application()

# Main ASGI application with Channels
application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AuthMiddlewareStack(URLRouter(routing.websocket_urlpatterns)),
    }
)
