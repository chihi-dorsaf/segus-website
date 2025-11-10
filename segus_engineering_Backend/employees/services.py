import logging

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def send_welcome_email(employee, password):
    """
    Envoie un email de bienvenue avec les identifiants à un nouvel employé
    """
    try:
        # Préparer les données pour le template
        context = {
            # Full employee object is needed by the template (employee.user.*, employee.matricule, etc.)
            "employee": employee,
            # Convenience fields if needed by other templates
            "employee_name": employee.full_name,
            "email": employee.email,
            "password": password,
            "login_url": (
                f"{settings.FRONTEND_URL}/login"
                if hasattr(settings, "FRONTEND_URL")
                else "http://localhost:4200/login"
            ),
        }

        # Rendre le template HTML
        html_message = render_to_string("emails/welcome_employee_email.html", context)

        # Version texte simple pour les clients email qui ne supportent pas HTML
        text_message = strip_tags(html_message)

        # Envoyer l'email
        send_mail(
            subject="🎉 Bienvenue chez Segus Engineering - Vos identifiants de connexion",
            message=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[employee.email],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(f"[EmployeeService] Email de bienvenue envoye avec succes a {employee.email}")
        return True

    except Exception as e:
        logger.error(
            f"[EmployeeService] Erreur lors de l'envoi de l'email de bienvenue a {employee.email}: {str(e)}"
        )
        return False


def send_password_reset_email(employee, new_password):
    """
    Envoie un email de réinitialisation de mot de passe
    """
    try:
        context = {
            "employee_name": employee.full_name,
            "email": employee.email,
            "password": new_password,
            "login_url": (
                f"{settings.FRONTEND_URL}/login"
                if hasattr(settings, "FRONTEND_URL")
                else "http://localhost:4200/login"
            ),
        }

        html_message = render_to_string("employees/password_reset_email.html", context)
        text_message = strip_tags(html_message)

        send_mail(
            subject="🔐 Segus Engineering - Nouveau mot de passe",
            message=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[employee.email],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(
            f"[EmployeeService] Email de reinitialisation envoye avec succes a {employee.email}"
        )
        return True

    except Exception as e:
        logger.error(
            f"[EmployeeService] Erreur lors de l'envoi de l'email de reinitialisation a {employee.email}: {str(e)}"
        )
        return False


def send_forgot_password_email(email, reset_token):
    """
    Envoie un email de mot de passe oublié avec un token de réinitialisation
    """
    try:
        reset_url = (
            f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
            if hasattr(settings, "FRONTEND_URL")
            else f"http://localhost:4200/reset-password?token={reset_token}"
        )

        context = {"reset_url": reset_url, "email": email}

        html_message = render_to_string("employees/forgot_password_email.html", context)
        text_message = strip_tags(html_message)

        send_mail(
            subject="🔐 Segus Engineering - Réinitialisation de mot de passe",
            message=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(f"[EmployeeService] Email de mot de passe oublie envoye avec succes a {email}")
        return True

    except Exception as e:
        logger.error(
            f"[EmployeeService] Erreur lors de l'envoi de l'email de mot de passe oublie a {email}: {str(e)}"
        )
        return False
