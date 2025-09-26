#!/usr/bin/env python
"""
Script pour construire et déployer les images Docker du projet Segus Engineering
"""
import argparse
import os
import subprocess
import sys
from pathlib import Path


def run_command(command, description, check=True):
    """Exécute une commande et affiche le résultat"""
    print(f"\n{'='*60}")
    print(f"🔄 {description}")
    print(f"{'='*60}")
    print(f"Commande: {command}")

    try:
        result = subprocess.run(command, shell=True, check=check)
        if result.returncode == 0:
            print(f"✅ {description} - Terminé avec succès")
            return True
        else:
            print(f"❌ {description} - Échec (code: {result.returncode})")
            return False
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Échec")
        print(f"Erreur: {e}")
        return False


def check_docker():
    """Vérifie que Docker est installé et en cours d'exécution"""
    try:
        subprocess.run("docker --version", shell=True, check=True, capture_output=True)
        subprocess.run("docker info", shell=True, check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError:
        print("❌ Docker n'est pas installé ou ne fonctionne pas")
        return False


def main():
    parser = argparse.ArgumentParser(description="Construire et déployer les images Docker")
    parser.add_argument("--build", action="store_true", help="Construire les images")
    parser.add_argument("--dev", action="store_true", help="Mode développement")
    parser.add_argument("--prod", action="store_true", help="Mode production")
    parser.add_argument("--clean", action="store_true", help="Nettoyer avant construction")
    parser.add_argument("--no-cache", action="store_true", help="Construire sans cache")
    parser.add_argument("--push", action="store_true", help="Pousser vers le registry")

    args = parser.parse_args()

    # Changer vers le répertoire racine du projet
    project_root = Path(__file__).parent.parent.parent
    os.chdir(project_root)

    print("🐳 Script de construction Docker - Segus Engineering")
    print(f"📁 Répertoire: {project_root}")

    # Vérifier Docker
    if not check_docker():
        sys.exit(1)

    # Nettoyer si demandé
    if args.clean:
        run_command("docker system prune -f", "Nettoyage du système Docker")
        run_command("docker volume prune -f", "Nettoyage des volumes Docker")

    # Construction des images
    if args.build:
        build_options = ""
        if args.no_cache:
            build_options += " --no-cache"

        # Construction de l'image backend
        backend_dockerfile = "Dockerfile.dev" if args.dev else "Dockerfile"
        backend_tag = "segus-backend:dev" if args.dev else "segus-backend:latest"

        success = run_command(
            f"docker build{build_options} -f segus_engineering_Backend/{backend_dockerfile} -t {backend_tag} segus_engineering_Backend/",
            f"Construction de l'image backend ({backend_tag})",
        )

        if not success:
            print("❌ Échec de la construction de l'image backend")
            sys.exit(1)

    # Démarrage des services
    if args.dev:
        compose_file = "docker-compose.dev.yml"
        print("\n🚀 Démarrage en mode développement")
    elif args.prod:
        compose_file = "docker-compose.yml"
        print("\n🚀 Démarrage en mode production")
    else:
        compose_file = "docker-compose.dev.yml"
        print("\n🚀 Démarrage par défaut (développement)")

    # Arrêter les services existants
    run_command(
        f"docker-compose -f {compose_file} down",
        "Arrêt des services existants",
        check=False,
    )

    # Démarrer les services
    success = run_command(
        f"docker-compose -f {compose_file} up -d",
        f"Démarrage des services ({compose_file})",
    )

    if success:
        print(f"\n{'='*60}")
        print("🎉 Services démarrés avec succès!")
        print(f"{'='*60}")

        if args.dev:
            print("🔗 URLs de développement:")
            print("   - Backend: http://localhost:8001")
            print("   - Base de données: localhost:5433")
            print("   - Redis: localhost:6380")
        else:
            print("🔗 URLs:")
            print("   - Application: http://localhost")
            print("   - Backend API: http://localhost:8000")
            print("   - Frontend: http://localhost:4200")
            print("   - Adminer: http://localhost:8080")

        print("\n📊 Pour voir les logs:")
        print(f"   docker-compose -f {compose_file} logs -f")

        print("\n🛑 Pour arrêter:")
        print(f"   docker-compose -f {compose_file} down")

    # Push vers le registry si demandé
    if args.push and success:
        if input("\n❓ Pousser les images vers le registry? (y/N): ").lower() == "y":
            run_command(f"docker push {backend_tag}", "Push de l'image backend")


if __name__ == "__main__":
    main()
