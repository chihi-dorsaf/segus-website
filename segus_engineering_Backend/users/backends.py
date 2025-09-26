from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()


class EmailBackend(ModelBackend):
    """
    Backend d'authentification personnalisé pour permettre l'authentification par email
    """

    def authenticate(self, request, email=None, password=None, **kwargs):
        if email is None or password is None:
            return None

        try:
            # Chercher l'utilisateur par email
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
