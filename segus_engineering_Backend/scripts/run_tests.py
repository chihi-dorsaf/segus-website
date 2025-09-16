#!/usr/bin/env python
"""
Script pour exécuter les tests du projet Segus Engineering Backend
"""
import os
import sys
import subprocess
import argparse
from pathlib import Path

def run_command(command, description):
    """Exécute une commande et affiche le résultat"""
    print(f"\n{'='*60}")
    print(f"🔄 {description}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print(f"⚠️  Warnings: {result.stderr}")
        print(f"✅ {description} - Terminé avec succès")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Échec")
        print(f"Erreur: {e.stderr}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Exécuter les tests du backend Segus Engineering')
    parser.add_argument('--coverage', action='store_true', help='Exécuter avec coverage')
    parser.add_argument('--verbose', '-v', action='store_true', help='Mode verbose')
    parser.add_argument('--fast', action='store_true', help='Tests rapides seulement')
    parser.add_argument('--app', help='Tester une app spécifique')
    parser.add_argument('--parallel', action='store_true', help='Exécuter en parallèle')
    
    args = parser.parse_args()
    
    # Changer vers le répertoire du projet
    project_root = Path(__file__).parent.parent
    os.chdir(project_root)
    
    print("🚀 Démarrage des tests Segus Engineering Backend")
    print(f"📁 Répertoire: {project_root}")
    
    # Configuration des commandes de test
    base_command = "python manage.py test"
    
    if args.app:
        base_command += f" {args.app}"
    
    if args.verbose:
        base_command += " --verbosity=2"
    
    if args.parallel:
        base_command += " --parallel"
    
    if args.fast:
        base_command += " --keepdb"
    
    # Exécuter les tests avec ou sans coverage
    if args.coverage:
        # Tests avec coverage
        coverage_command = f"coverage run --source='.' {base_command.replace('python manage.py test', 'manage.py test')}"
        success = run_command(coverage_command, "Tests avec coverage")
        
        if success:
            run_command("coverage report", "Rapport de coverage")
            run_command("coverage html", "Génération du rapport HTML")
            print(f"\n📊 Rapport HTML généré dans: {project_root}/htmlcov/index.html")
    else:
        # Tests simples
        success = run_command(base_command, "Tests unitaires")
    
    # Tests avec pytest si disponible
    if success:
        pytest_command = "pytest"
        if args.verbose:
            pytest_command += " -v"
        if args.coverage:
            pytest_command += " --cov=."
        
        run_command(pytest_command, "Tests avec pytest")
    
    # Vérification de la qualité du code
    print(f"\n{'='*60}")
    print("🔍 Vérification de la qualité du code")
    print(f"{'='*60}")
    
    run_command("flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics", "Vérification syntaxe")
    run_command("black --check .", "Vérification formatage")
    run_command("isort --check-only .", "Vérification imports")
    
    print(f"\n{'='*60}")
    print("✨ Tests terminés!")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
