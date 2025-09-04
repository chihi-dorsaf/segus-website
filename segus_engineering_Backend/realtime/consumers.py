import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class WorkSessionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Récupérer le token d'authentification
        token = self.scope.get('query_string', b'').decode('utf-8')
        if 'token=' in token:
            token = token.split('token=')[1].split('&')[0]
        
        # Authentifier l'utilisateur
        user = await self.authenticate_user(token)
        if not user:
            await self.close()
            return
        
        self.user = user
        self.user_group_name = f'user_{user.id}'
        
        # Rejoindre les groupes appropriés
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        if user.role == 'ADMIN':
            await self.channel_layer.group_add(
                'admins',
                self.channel_name
            )
        else:
            await self.channel_layer.group_add(
                'employees',
                self.channel_name
            )
        
        await self.accept()
        logger.info(f"WebSocket connected: {user.email} ({user.role})")

    async def disconnect(self, close_code):
        if hasattr(self, 'user'):
            # Quitter les groupes
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
            
            if self.user.role == 'ADMIN':
                await self.channel_layer.group_discard(
                    'admins',
                    self.channel_name
                )
            else:
                await self.channel_layer.group_discard(
                    'employees',
                    self.channel_name
                )
            
            logger.info(f"WebSocket disconnected: {self.user.email}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            event_type = data.get('type')
            
            if event_type == 'work_session_started':
                await self.handle_session_started(data)
            elif event_type == 'work_session_paused':
                await self.handle_session_paused(data)
            elif event_type == 'work_session_resumed':
                await self.handle_session_resumed(data)
            elif event_type == 'work_session_ended':
                await self.handle_session_ended(data)
            elif event_type == 'request_stats_update':
                await self.handle_stats_request(data)
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
        except Exception as e:
            logger.error(f"Error handling message: {e}")

    async def handle_session_started(self, data):
        # Diffuser aux admins
        await self.channel_layer.group_send(
            'admins',
            {
                'type': 'work_session_update',
                'data': {
                    'type': 'session_started',
                    'user_id': self.user.id,
                    'user_email': self.user.email,
                    'session_data': data.get('data', {}),
                    'timestamp': data.get('timestamp')
                }
            }
        )
        
        # Diffuser aux autres employés
        await self.channel_layer.group_send(
            'employees',
            {
                'type': 'work_session_update',
                'data': {
                    'type': 'session_started',
                    'user_id': self.user.id,
                    'user_email': self.user.email,
                    'timestamp': data.get('timestamp')
                }
            }
        )

    async def handle_session_paused(self, data):
        # Diffuser aux admins
        await self.channel_layer.group_send(
            'admins',
            {
                'type': 'work_session_update',
                'data': {
                    'type': 'session_paused',
                    'user_id': self.user.id,
                    'user_email': self.user.email,
                    'session_data': data.get('data', {}),
                    'timestamp': data.get('timestamp')
                }
            }
        )

    async def handle_session_resumed(self, data):
        # Diffuser aux admins
        await self.channel_layer.group_send(
            'admins',
            {
                'type': 'work_session_update',
                'data': {
                    'type': 'session_resumed',
                    'user_id': self.user.id,
                    'user_email': self.user.email,
                    'session_data': data.get('data', {}),
                    'timestamp': data.get('timestamp')
                }
            }
        )

    async def handle_session_ended(self, data):
        # Diffuser aux admins
        await self.channel_layer.group_send(
            'admins',
            {
                'type': 'work_session_update',
                'data': {
                    'type': 'session_ended',
                    'user_id': self.user.id,
                    'user_email': self.user.email,
                    'session_data': data.get('data', {}),
                    'timestamp': data.get('timestamp')
                }
            }
        )

    async def handle_stats_request(self, data):
        if self.user.role == 'ADMIN':
            # Calculer les statistiques en temps réel
            stats = await self.get_current_stats()
            await self.send(text_data=json.dumps({
                'type': 'admin_stats_update',
                'data': stats
            }))

    async def work_session_update(self, event):
        # Envoyer la mise à jour au client
        await self.send(text_data=json.dumps({
            'type': 'work_session_update',
            'data': event['data']
        }))

    async def admin_stats_update(self, event):
        # Envoyer les statistiques aux admins
        await self.send(text_data=json.dumps({
            'type': 'admin_stats_update',
            'data': event['data']
        }))

    @database_sync_to_async
    def authenticate_user(self, token):
        """Authentifier un utilisateur via JWT token"""
        try:
            if not token:
                return None
            
            if token.startswith('Bearer%20'):
                token = token[10:]
            elif token.startswith('Bearer '):
                token = token[7:]
            
            UntypedToken(token)
            from rest_framework_simplejwt.authentication import JWTAuthentication
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            user = jwt_auth.get_user(validated_token)
            return user
        except (InvalidToken, TokenError) as e:
            logger.error(f"Token authentication failed: {e}")
            return None

    @database_sync_to_async
    def get_current_stats(self):
        """Récupérer les statistiques actuelles"""
        from employees.models import WorkSession
        from django.utils import timezone
        from datetime import datetime
        
        today = timezone.now().date()
        
        # Sessions actives
        active_sessions = WorkSession.objects.filter(
            start_time__date=today,
            end_time__isnull=True
        ).count()
        
        # Sessions en pause
        paused_sessions = WorkSession.objects.filter(
            start_time__date=today,
            end_time__isnull=True,
            pauses__end_time__isnull=True
        ).distinct().count()
        
        return {
            'active_sessions': active_sessions,
            'paused_sessions': paused_sessions,
            'total_sessions_today': WorkSession.objects.filter(
                start_time__date=today
            ).count(),
            'timestamp': timezone.now().isoformat()
        }
