#!/usr/bin/env python
"""
Script de nettoyage pour supprimer les utilisateurs en double
"""
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'segus_engineering_Backend.settings')
django.setup()

from users.models import User
from employees.models import Employee
from django.db.models import Count
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def cleanup_duplicate_users():
    """Nettoie les utilisateurs en double en gardant le plus récent"""
    
    # Trouver les emails en double
    duplicate_emails = User.objects.values('email').annotate(
        count=Count('email')
    ).filter(count__gt=1)
    
    logger.info(f"Trouvé {len(duplicate_emails)} emails en double")
    
    for email_data in duplicate_emails:
        email = email_data['email']
        users = User.objects.filter(email=email).order_by('-date_joined')
        
        logger.info(f"Email {email}: {users.count()} utilisateurs")
        
        # Garder le plus récent (premier dans la liste triée par -date_joined)
        user_to_keep = users.first()
        users_to_delete = users[1:]
        
        logger.info(f"Garder utilisateur ID {user_to_keep.id} ({user_to_keep.username})")
        
        for user in users_to_delete:
            logger.info(f"Suppression utilisateur ID {user.id} ({user.username})")
            
            # Supprimer l'employé associé s'il existe
            try:
                employee = Employee.objects.get(user=user)
                logger.info(f"Suppression employé associé: {employee.matricule}")
                employee.delete()
            except Employee.DoesNotExist:
                pass
            
            # Supprimer l'utilisateur
            user.delete()
    
    logger.info("Nettoyage terminé")

def check_database_integrity():
    """Vérifie l'intégrité de la base de données"""
    
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    admin_users = User.objects.filter(role='ADMIN').count()
    employee_users = User.objects.filter(role='EMPLOYE').count()
    
    logger.info(f"Statistiques utilisateurs:")
    logger.info(f"- Total: {total_users}")
    logger.info(f"- Actifs: {active_users}")
    logger.info(f"- Admins: {admin_users}")
    logger.info(f"- Employés: {employee_users}")
    
    # Vérifier les emails uniques
    duplicate_emails = User.objects.values('email').annotate(
        count=Count('email')
    ).filter(count__gt=1)
    
    if duplicate_emails:
        logger.warning(f"ATTENTION: {len(duplicate_emails)} emails en double trouvés!")
        for email_data in duplicate_emails:
            logger.warning(f"- {email_data['email']}: {email_data['count']} utilisateurs")
    else:
        logger.info("✓ Tous les emails sont uniques")

if __name__ == '__main__':
    logger.info("=== Vérification de l'intégrité de la base de données ===")
    check_database_integrity()
    
    logger.info("\n=== Nettoyage des utilisateurs en double ===")
    cleanup_duplicate_users()
    
    logger.info("\n=== Vérification finale ===")
    check_database_integrity()
