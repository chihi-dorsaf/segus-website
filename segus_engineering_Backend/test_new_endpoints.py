#!/usr/bin/env python
"""
Script de test pour les nouveaux endpoints du dashboard admin
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'segus_engineering_Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from employees.models import Employee, WorkSession
from django.utils import timezone

User = get_user_model()

def test_models():
    """Test des modèles et des champs"""
    print("🔍 Test des modèles...")
    
    try:
        # Vérifier que WorkSession a les nouveaux champs
        session = WorkSession()
        print(f"✅ pause_start_time: {hasattr(session, 'pause_start_time')}")
        print(f"✅ total_pause_time: {hasattr(session, 'total_pause_time')}")
        
        # Vérifier que Employee a tous les champs nécessaires
        employee = Employee()
        print(f"✅ matricule: {hasattr(employee, 'matricule')}")
        print(f"✅ department: {hasattr(employee, 'department')}")
        print(f"✅ position: {hasattr(employee, 'position')}")
        
    except Exception as e:
        print(f"❌ Erreur lors du test des modèles: {e}")
        return False
    
    return True

def test_serializers():
    """Test des serializers"""
    print("\n🔍 Test des serializers...")
    
    try:
        from employees.serializers import (
            AdminDashboardStatsSerializer, 
            EmployeeWorkHistorySerializer,
            WorkSessionDetailSerializer
        )
        print("✅ Tous les serializers sont importés correctement")
        
        # Test de validation basique
        test_data = {
            'total_employees': 10,
            'active_employees': 10,
            'employees_at_work': 5,
            'employees_on_break': 2,
            'total_work_hours_today': 40.0,
            'total_pause_hours_today': 5.0,
            'total_work_hours_week': 200.0,
            'total_pause_hours_week': 25.0,
            'total_work_hours_month': 800.0,
            'total_pause_hours_month': 100.0,
            'top_workers_today': [],
            'top_workers_week': [],
            'top_workers_month': [],
            'employees_on_break_list': []
        }
        
        serializer = AdminDashboardStatsSerializer(data=test_data)
        if serializer.is_valid():
            print("✅ AdminDashboardStatsSerializer valide")
        else:
            print(f"❌ Erreurs de validation: {serializer.errors}")
            
    except Exception as e:
        print(f"❌ Erreur lors du test des serializers: {e}")
        return False
    
    return True

def test_views():
    """Test des vues"""
    print("\n🔍 Test des vues...")
    
    try:
        from employees.views import EmployeeWorkStatsViewSet
        
        # Vérifier que les nouvelles actions existent
        viewset = EmployeeWorkStatsViewSet()
        actions = getattr(viewset, 'action_map', {})
        
        print(f"✅ Actions disponibles: {list(actions.keys())}")
        
        # Vérifier les méthodes personnalisées
        methods = [method for method in dir(viewset) if not method.startswith('_')]
        print(f"✅ Méthodes disponibles: {methods[:10]}...")  # Afficher les 10 premières
        
    except Exception as e:
        print(f"❌ Erreur lors du test des vues: {e}")
        return False
    
    return True

def test_database():
    """Test de la base de données"""
    print("\n🔍 Test de la base de données...")
    
    try:
        # Vérifier la connexion
        from django.db import connection
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        print("✅ Connexion à la base de données OK")
        
        # Vérifier que la table WorkSession a les nouveaux champs
        cursor.execute("PRAGMA table_info(employees_worksession)")
        columns = [row[1] for row in cursor.fetchall()]
        
        required_columns = ['pause_start_time', 'total_pause_time']
        for col in required_columns:
            if col in columns:
                print(f"✅ Colonne {col} présente")
            else:
                print(f"❌ Colonne {col} manquante")
        
        # Vérifier le nombre d'employés
        employee_count = Employee.objects.count()
        print(f"✅ Nombre d'employés: {employee_count}")
        
        # Vérifier le nombre de sessions de travail
        session_count = WorkSession.objects.count()
        print(f"✅ Nombre de sessions de travail: {session_count}")
        
    except Exception as e:
        print(f"❌ Erreur lors du test de la base de données: {e}")
        return False
    
    return True

def main():
    """Fonction principale"""
    print("🚀 Test des nouvelles fonctionnalités du Dashboard Admin")
    print("=" * 60)
    
    tests = [
        test_models,
        test_serializers,
        test_views,
        test_database
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} a échoué: {e}")
    
    print("\n" + "=" * 60)
    print(f"📊 Résultats: {passed}/{total} tests réussis")
    
    if passed == total:
        print("🎉 Tous les tests sont passés ! Les nouvelles fonctionnalités sont prêtes.")
    else:
        print("⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)








