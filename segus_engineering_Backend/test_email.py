#!/usr/bin/env python3
"""
Test d'envoi d'email
"""

import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'segus_engineering_Backend.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_email():
    """Test d'envoi d'email simple"""
    print("🚀 Test d'envoi d'email")
    print(f"📧 Email configuré: {settings.EMAIL_HOST_USER}")
    print(f"🔧 Serveur SMTP: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
    
    try:
        # Test d'envoi d'email simple
        send_mail(
            subject='Test Email - Segus Engineering',
            message='Ceci est un test d\'envoi d\'email depuis Django.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['chihidorsaf99@gmail.com'],  # Votre email pour le test
            fail_silently=False,
        )
        print("✅ Email envoyé avec succès!")
        
    except Exception as e:
        print(f"❌ Erreur d'envoi d'email: {str(e)}")
        print("🔍 Vérifiez:")
        print("   - Que le mot de passe d'application Gmail est correct")
        print("   - Que l'authentification à 2 facteurs est activée sur Gmail")
        print("   - Que l'application 'moins sécurisée' est activée (si nécessaire)")

if __name__ == "__main__":
    test_email() 