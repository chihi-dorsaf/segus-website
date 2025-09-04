from django.apps import AppConfig


class RealtimeConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'realtime'
    
    def ready(self):
        # Importer le serveur Socket.IO au démarrage de l'application
        from . import socketio_server
