import json
import time
from django.http import StreamingHttpResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views import View
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

# Store pour les connexions SSE actives
sse_connections = {}

class WorkSessionSSEView(View):
    """Vue pour Server-Sent Events des sessions de travail"""
    
    def get(self, request):
        try:
            logger.info(f"SSE request received: {request.GET}")
            
            # Authentification via JWT token
            token = request.GET.get('token')
            if not token:
                logger.error("No token provided in SSE request")
                response = StreamingHttpResponse(
                    "data: {\"error\": \"Token manquant\"}\n\n",
                    content_type='text/plain',
                    status=401
                )
                response['Access-Control-Allow-Origin'] = 'http://localhost:4200'
                response['Access-Control-Allow-Credentials'] = 'true'
                return response
            
            logger.info(f"Authenticating token: {token[:50]}...")
            user = self.authenticate_user(token)
            if not user:
                logger.error("Authentication failed for SSE request")
                response = StreamingHttpResponse(
                    "data: {\"error\": \"Authentification échouée\"}\n\n",
                    content_type='text/plain',
                    status=401
                )
                response['Access-Control-Allow-Origin'] = 'http://localhost:4200'
                response['Access-Control-Allow-Credentials'] = 'true'
                return response
            
            logger.info(f"User authenticated successfully: {user.email}")
            
            # Créer la réponse SSE
            response = StreamingHttpResponse(
                self.event_stream(user),
                content_type='text/event-stream'
            )
            response['Cache-Control'] = 'no-cache'
            response['X-Accel-Buffering'] = 'no'  # Disable nginx buffering
            response['Access-Control-Allow-Origin'] = 'http://localhost:4200'
            response['Access-Control-Allow-Credentials'] = 'true'
            
            logger.info("SSE response created successfully")
            return response
            
        except Exception as e:
            logger.error(f"Error in SSE get method: {e}", exc_info=True)
            response = StreamingHttpResponse(
                f"data: {{\"error\": \"Erreur serveur: {str(e)}\"}}\n\n",
                content_type='text/plain',
                status=500
            )
            response['Access-Control-Allow-Origin'] = 'http://localhost:4200'
            response['Access-Control-Allow-Credentials'] = 'true'
            return response
    
    def options(self, request):
        """Handle CORS preflight requests"""
        response = HttpResponse()
        response['Access-Control-Allow-Origin'] = 'http://localhost:4200'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response['Access-Control-Allow-Credentials'] = 'true'
        return response
    
    def authenticate_user(self, token):
        """Authentifier un utilisateur via JWT token"""
        try:
            if token.startswith('Bearer%20'):
                token = token[10:]
            elif token.startswith('Bearer '):
                token = token[7:]
            
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            user = jwt_auth.get_user(validated_token)
            return user
        except (InvalidToken, TokenError) as e:
            logger.error(f"Token authentication failed: {e}")
            return None
    
    def event_stream(self, user):
        """Générateur pour le flux d'événements SSE"""
        try:
            connection_id = f"{user.id}_{int(time.time())}"
            logger.info(f"Creating SSE connection {connection_id} for user {user.email}")
            
            sse_connections[connection_id] = {
                'user': user,
                'last_ping': time.time(),
                'pending_messages': []
            }
            
            # Message de connexion
            yield f"data: {json.dumps({'type': 'connected', 'user_id': user.id})}\n\n"
            logger.info(f"Sent connection message for user {user.email}")
            
            # Boucle de maintien de connexion
            while True:
                try:
                    # Ping périodique pour maintenir la connexion
                    current_time = time.time()
                    if current_time - sse_connections[connection_id]['last_ping'] > 30:
                        yield f"data: {json.dumps({'type': 'ping', 'timestamp': current_time})}\n\n"
                        sse_connections[connection_id]['last_ping'] = current_time
                    
                    # Vérifier s'il y a des messages en attente
                    if connection_id in sse_connections and sse_connections[connection_id]['pending_messages']:
                        for message in sse_connections[connection_id]['pending_messages']:
                            yield f"data: {json.dumps(message)}\n\n"
                        sse_connections[connection_id]['pending_messages'].clear()
                    
                    time.sleep(5)  # Attendre 5 secondes avant la prochaine vérification
                    
                except Exception as e:
                    logger.error(f"Error in event stream loop: {e}")
                    break
                
        except GeneratorExit:
            # Nettoyage lors de la déconnexion
            if connection_id in sse_connections:
                del sse_connections[connection_id]
            logger.info(f"SSE connection closed for user {user.email}")
        except Exception as e:
            logger.error(f"Error in event_stream: {e}", exc_info=True)
            if connection_id in sse_connections:
                del sse_connections[connection_id]

def broadcast_work_session_event(event_type, user_id, data):
    """Diffuser un événement de session de travail à toutes les connexions SSE"""
    message = {
        'type': 'work_session_update',
        'event_type': event_type,
        'user_id': user_id,
        'data': data,
        'timestamp': time.time()
    }
    
    # Ajouter le message aux connexions appropriées
    for connection_id, connection in sse_connections.items():
        user = connection['user']
        
        # Envoyer aux admins ou à l'utilisateur concerné
        if user.role == 'ADMIN' or user.id == user_id:
            connection['pending_messages'].append(message)

@csrf_exempt
def notify_session_event(request):
    """Endpoint pour notifier les événements de session"""
    if request.method == 'OPTIONS':
        response = HttpResponse()
        response['Access-Control-Allow-Origin'] = 'http://localhost:4200'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response['Access-Control-Allow-Credentials'] = 'true'
        return response
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            event_type = data.get('type')
            user_id = data.get('user_id')
            session_data = data.get('data', {})
            
            # Diffuser l'événement
            broadcast_work_session_event(event_type, user_id, session_data)
            
            response = HttpResponse(
                json.dumps({'status': 'success'}),
                content_type='application/json'
            )
            response['Access-Control-Allow-Origin'] = 'http://localhost:4200'
            response['Access-Control-Allow-Credentials'] = 'true'
            return response
        except Exception as e:
            logger.error(f"Error processing session event: {e}")
            response = HttpResponse(
                json.dumps({'error': str(e)}),
                content_type='application/json',
                status=500
            )
            response['Access-Control-Allow-Origin'] = 'http://localhost:4200'
            response['Access-Control-Allow-Credentials'] = 'true'
            return response
    
    response = HttpResponse(
        json.dumps({'error': 'Method not allowed'}),
        content_type='application/json',
        status=405
    )
    response['Access-Control-Allow-Origin'] = 'http://localhost:4200'
    response['Access-Control-Allow-Credentials'] = 'true'
    return response

@csrf_exempt
def socketio_view(request):
    """Vue pour gérer les connexions Socket.IO"""
    return HttpResponse("Socket.IO endpoint")

# Créer une application WSGI pour Socket.IO (commenté car non utilisé)
# socketio_app = socketio.WSGIApp(sio)
