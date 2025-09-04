#!/usr/bin/env python3
"""
Test détaillé d'envoi d'email
"""

import os
import sys
import django
import traceback

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'segus_engineering_Backend.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_email_detailed():
    """Test détaillé d'envoi d'email"""
    print("🚀 Test détaillé d'envoi d'email")
    print(f"📧 Email configuré: {settings.EMAIL_HOST_USER}")
    print(f"🔧 Serveur SMTP: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
    print(f"🔐 Mot de passe configuré: {'*' * len(settings.EMAIL_HOST_PASSWORD)}")
    print(f"📤 Email d'expéditeur: {settings.DEFAULT_FROM_EMAIL}")
    
    try:
        # Test d'envoi d'email simple
        print("\n📤 Tentative d'envoi d'email...")
        send_mail(
            subject='Test Email - Segus Engineering',
            message='Ceci est un test d\'envoi d\'email depuis Django.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['chihidorsaf99@gmail.com'],
            fail_silently=False,
        )
        print("✅ Email envoyé avec succès!")
        
    except Exception as e:
        print(f"❌ Erreur d'envoi d'email: {str(e)}")
        print(f"🔍 Type d'erreur: {type(e).__name__}")
        print("📋 Traceback complet:")
        traceback.print_exc()
        
        print("\n🔧 Solutions possibles:")
        print("1. Vérifiez que l'authentification à 2 facteurs est activée sur Gmail")
        print("2. Générez un nouveau mot de passe d'application Gmail:")
        print("   - Allez dans les paramètres Google")
        print("   - Sécurité > Authentification à 2 facteurs")
        print("   - Mots de passe d'application > Générer")
        print("3. Vérifiez que le mot de passe d'application est correct")
        print("4. Essayez avec un autre fournisseur email (Outlook, Yahoo, etc.)")

if __name__ == "__main__":
    test_email_detailed() 