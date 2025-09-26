import logging
import time

import socketio
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import UntypedToken

logger = logging.getLogger(__name__)
User = get_user_model()

# Créer une instance Socket.IO
sio = socketio.AsyncServer(
    cors_allowed_origins=["http://localhost:4200"],
    logger=True,
    engineio_logger=True,
    async_mode="asgi",
)

# Dictionnaire pour stocker les connexions actives
active_connections = {}
employee_sessions = {}


def authenticate_socket(token):
    """Authentifier un utilisateur via JWT token"""
    try:
        if token.startswith("Bearer "):
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


@sio.event
def connect(sid, environ, auth):
    """Gérer les nouvelles connexions"""
    try:
        # Récupérer le token d'authentification
        token = auth.get("token") if auth else None
        if not token:
            logger.error("No token provided for connection")
            return False

        # Authentifier l'utilisateur
        user = authenticate_socket(token)
        if not user:
            logger.error("Authentication failed for connection")
            return False

        # Stocker les informations de connexion
        active_connections[sid] = {
            "user_id": user.id,
            "user_email": user.email,
            "user_role": user.role,
            "connected_at": time.time(),
        }

        logger.info(f"User {user.email} ({user.role}) connected with SID: {sid}")

        # Rejoindre la room appropriée selon le rôle
        if user.role == "ADMIN":
            sio.enter_room(sid, "admins")
            # Envoyer les statistiques actuelles aux admins
            sio.emit("admin_stats_update", get_current_stats(), room=sid)
        else:
            sio.enter_room(sid, "employees")
            sio.enter_room(sid, f"employee_{user.id}")

        # Notifier les autres utilisateurs de la connexion
        sio.emit(
            "user_connected",
            {
                "user_id": user.id,
                "user_email": user.email,
                "user_role": user.role,
                "timestamp": time.time(),
            },
            skip_sid=sid,
        )

        return True

    except Exception as e:
        logger.error(f"Error in connect event: {e}")
        return False


@sio.event
def disconnect(sid):
    """Gérer les déconnexions"""
    try:
        if sid in active_connections:
            user_info = active_connections[sid]
            logger.info(f"User {user_info['user_email']} disconnected")

            # Notifier les autres utilisateurs de la déconnexion
            sio.emit(
                "user_disconnected",
                {
                    "user_id": user_info["user_id"],
                    "user_email": user_info["user_email"],
                    "timestamp": time.time(),
                },
                skip_sid=sid,
            )

            # Nettoyer les données de connexion
            del active_connections[sid]

    except Exception as e:
        logger.error(f"Error in disconnect event: {e}")


@sio.event
def work_session_started(sid, data):
    """Gérer le début d'une session de travail"""
    try:
        if sid not in active_connections:
            return

        user_info = active_connections[sid]
        session_data = {
            "employee_id": user_info["user_id"],
            "employee_email": user_info["user_email"],
            "session_id": data.get("session_id"),
            "start_time": data.get("start_time"),
            "notes": data.get("notes", ""),
            "timestamp": time.time(),
        }

        # Stocker la session active
        employee_sessions[user_info["user_id"]] = session_data

        logger.info(f"Work session started for {user_info['user_email']}")

        # Notifier tous les admins
        sio.emit(
            "work_session_update",
            {"type": "session_started", "data": session_data},
            room="admins",
        )

        # Notifier l'employé de la confirmation
        sio.emit("session_confirmed", session_data, room=sid)

    except Exception as e:
        logger.error(f"Error in work_session_started: {e}")


@sio.event
def work_session_paused(sid, data):
    """Gérer la pause d'une session de travail"""
    try:
        if sid not in active_connections:
            return

        user_info = active_connections[sid]
        pause_data = {
            "employee_id": user_info["user_id"],
            "employee_email": user_info["user_email"],
            "session_id": data.get("session_id"),
            "pause_reason": data.get("reason"),
            "pause_start": data.get("pause_start"),
            "timestamp": time.time(),
        }

        logger.info(f"Work session paused for {user_info['user_email']}")

        # Notifier tous les admins
        sio.emit(
            "work_session_update",
            {"type": "session_paused", "data": pause_data},
            room="admins",
        )

    except Exception as e:
        logger.error(f"Error in work_session_paused: {e}")


@sio.event
def work_session_resumed(sid, data):
    """Gérer la reprise d'une session de travail"""
    try:
        if sid not in active_connections:
            return

        user_info = active_connections[sid]
        resume_data = {
            "employee_id": user_info["user_id"],
            "employee_email": user_info["user_email"],
            "session_id": data.get("session_id"),
            "resume_time": data.get("resume_time"),
            "timestamp": time.time(),
        }

        logger.info(f"Work session resumed for {user_info['user_email']}")

        # Notifier tous les admins
        sio.emit(
            "work_session_update",
            {"type": "session_resumed", "data": resume_data},
            room="admins",
        )

    except Exception as e:
        logger.error(f"Error in work_session_resumed: {e}")


@sio.event
def work_session_ended(sid, data):
    """Gérer la fin d'une session de travail"""
    try:
        if sid not in active_connections:
            return

        user_info = active_connections[sid]
        end_data = {
            "employee_id": user_info["user_id"],
            "employee_email": user_info["user_email"],
            "session_id": data.get("session_id"),
            "end_time": data.get("end_time"),
            "total_work_time": data.get("total_work_time"),
            "total_pause_time": data.get("total_pause_time"),
            "timestamp": time.time(),
        }

        # Supprimer la session active
        if user_info["user_id"] in employee_sessions:
            del employee_sessions[user_info["user_id"]]

        logger.info(f"Work session ended for {user_info['user_email']}")

        # Notifier tous les admins
        sio.emit(
            "work_session_update",
            {"type": "session_ended", "data": end_data},
            room="admins",
        )

    except Exception as e:
        logger.error(f"Error in work_session_ended: {e}")


@sio.event
def request_stats_update(sid, data):
    """Demander une mise à jour des statistiques"""
    try:
        if sid not in active_connections:
            return

        user_info = active_connections[sid]
        if user_info["user_role"] == "ADMIN":
            stats = get_current_stats()
            sio.emit("admin_stats_update", stats, room=sid)

    except Exception as e:
        logger.error(f"Error in request_stats_update: {e}")


def get_current_stats():
    """Obtenir les statistiques actuelles"""
    try:
        # Ici vous pouvez intégrer avec votre API Django existante
        # pour obtenir les vraies statistiques
        stats = {
            "active_sessions": len(employee_sessions),
            "connected_employees": len(
                [c for c in active_connections.values() if c["user_role"] == "EMPLOYE"]
            ),
            "connected_admins": len(
                [c for c in active_connections.values() if c["user_role"] == "ADMIN"]
            ),
            "employee_sessions": list(employee_sessions.values()),
            "timestamp": time.time(),
        }
        return stats
    except Exception as e:
        logger.error(f"Error getting current stats: {e}")
        return {}


def broadcast_stats_update():
    """Diffuser une mise à jour des statistiques à tous les admins"""
    try:
        stats = get_current_stats()
        sio.emit("admin_stats_update", stats, room="admins")
    except Exception as e:
        logger.error(f"Error broadcasting stats update: {e}")


def notify_session_update(session_type, session_data):
    """Fonction utilitaire pour notifier les mises à jour de session depuis Django"""
    try:
        sio.emit(
            "work_session_update",
            {
                "type": session_type,
                "data": session_data,
                "timestamp": time.time(),
            },
            room="admins",
        )

        # Notifier aussi l'employé spécifique
        if "employee_id" in session_data:
            sio.emit(
                "session_status_update",
                {"type": session_type, "data": session_data},
                room=f'employee_{session_data["employee_id"]}',
            )

    except Exception as e:
        logger.error(f"Error notifying session update: {e}")


# Fonction pour obtenir l'instance Socket.IO (à utiliser dans Django)
def get_socketio_instance():
    return sio
