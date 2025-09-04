from djoser.email import PasswordResetEmail
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags


class CustomPasswordResetEmail(PasswordResetEmail):
    template_name = 'emails/password_reset_email.html'
    subject = 'Réinitialisation du mot de passe'

    def get_subject(self):
        return self.subject

    def send(self, to, *args, **kwargs):
        # Build HTML + text email
        context = self.get_context_data()
        html_body = render_to_string(self.template_name, context)
        text_body = strip_tags(html_body)

        # Djoser passes a single email string; normalize to list
        recipients = [to] if isinstance(to, str) else to

        message = EmailMultiAlternatives(
            subject=self.get_subject(),
            body=text_body,
            from_email=None,  # uses DEFAULT_FROM_EMAIL
            to=recipients,
        )
        message.attach_alternative(html_body, "text/html")
        message.send()
        return html_body


