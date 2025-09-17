#!/usr/bin/env python3
"""
Script d'automatisation pour les tests Angular
Permet d'exécuter les tests unitaires avec différentes options
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

def run_command(command, cwd=None):
    """Exécute une commande et retourne le résultat"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout, result.stderr, 0
    except subprocess.CalledProcessError as e:
        return e.stdout, e.stderr, e.returncode

def main():
    parser = argparse.ArgumentParser(description='Script d\'automatisation pour les tests Angular')
    parser.add_argument('--coverage', action='store_true', help='Générer le rapport de couverture')
    parser.add_argument('--watch', action='store_true', help='Mode watch pour les tests')
    parser.add_argument('--headless', action='store_true', help='Exécuter en mode headless')
    parser.add_argument('--single-run', action='store_true', help='Exécution unique des tests')
    parser.add_argument('--lint', action='store_true', help='Exécuter le linting avant les tests')
    parser.add_argument('--build', action='store_true', help='Builder l\'application avant les tests')
    parser.add_argument('--verbose', '-v', action='store_true', help='Mode verbose')
    
    args = parser.parse_args()
    
    # Répertoire du projet Angular
    project_dir = Path(__file__).parent.parent
    
    print("🚀 Script d'automatisation des tests Angular")
    print(f"📁 Répertoire: {project_dir}")
    print("-" * 50)
    
    # Vérifier que npm est installé
    stdout, stderr, code = run_command("npm --version")
    if code != 0:
        print("❌ npm n'est pas installé ou accessible")
        sys.exit(1)
    
    print(f"✅ npm version: {stdout.strip()}")
    
    # Vérifier que Angular CLI est installé
    stdout, stderr, code = run_command("ng version", cwd=project_dir)
    if code != 0:
        print("⚠️  Angular CLI n'est pas installé globalement")
        print("💡 Installation d'Angular CLI...")
        stdout, stderr, code = run_command("npm install -g @angular/cli")
        if code != 0:
            print("❌ Échec de l'installation d'Angular CLI")
            sys.exit(1)
    
    # Installer les dépendances si nécessaire
    if not (project_dir / "node_modules").exists():
        print("📦 Installation des dépendances...")
        stdout, stderr, code = run_command("npm install", cwd=project_dir)
        if code != 0:
            print(f"❌ Échec de l'installation des dépendances: {stderr}")
            sys.exit(1)
        print("✅ Dépendances installées")
    
    # Linting si demandé
    if args.lint:
        print("🔍 Exécution du linting...")
        stdout, stderr, code = run_command("ng lint", cwd=project_dir)
        if code != 0:
            print(f"⚠️  Erreurs de linting détectées: {stderr}")
        else:
            print("✅ Linting réussi")
    
    # Build si demandé
    if args.build:
        print("🔨 Build de l'application...")
        stdout, stderr, code = run_command("ng build", cwd=project_dir)
        if code != 0:
            print(f"❌ Échec du build: {stderr}")
            sys.exit(1)
        print("✅ Build réussi")
    
    # Construction de la commande de test
    test_command = "ng test"
    
    if args.headless or args.single_run:
        test_command += " --browsers=ChromeHeadless"
    
    if args.single_run:
        test_command += " --single-run"
    
    if args.watch:
        test_command += " --watch"
    
    if args.coverage:
        test_command += " --code-coverage"
    
    if args.verbose:
        test_command += " --verbose"
    
    # Exécution des tests
    print(f"🧪 Exécution des tests: {test_command}")
    print("-" * 50)
    
    # Exécuter les tests en mode interactif
    try:
        result = subprocess.run(
            test_command,
            shell=True,
            cwd=project_dir,
            check=False
        )
        
        if result.returncode == 0:
            print("\n✅ Tous les tests sont passés!")
            
            if args.coverage:
                coverage_dir = project_dir / "coverage"
                if coverage_dir.exists():
                    print(f"📊 Rapport de couverture généré dans: {coverage_dir}")
                    print("🌐 Ouvrez coverage/index.html dans votre navigateur")
        else:
            print(f"\n❌ Certains tests ont échoué (code: {result.returncode})")
            sys.exit(result.returncode)
            
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrompus par l'utilisateur")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Erreur lors de l'exécution des tests: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
