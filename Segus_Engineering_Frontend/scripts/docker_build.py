#!/usr/bin/env python3
"""
Script d'automatisation pour le build et déploiement Docker du frontend Angular
Permet de construire et déployer les images Docker avec différentes options
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path
import json
from datetime import datetime

def run_command(command, cwd=None, capture_output=True):
    """Exécute une commande et retourne le résultat"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            capture_output=capture_output,
            text=True,
            check=True
        )
        return result.stdout, result.stderr, 0
    except subprocess.CalledProcessError as e:
        return e.stdout, e.stderr, e.returncode

def main():
    parser = argparse.ArgumentParser(description='Script d\'automatisation Docker pour le frontend Angular')
    parser.add_argument('--mode', choices=['dev', 'prod'], default='dev', help='Mode de build (dev/prod)')
    parser.add_argument('--build', action='store_true', help='Construire l\'image Docker')
    parser.add_argument('--push', action='store_true', help='Pousser l\'image vers le registry')
    parser.add_argument('--clean', action='store_true', help='Nettoyer les images non utilisées')
    parser.add_argument('--no-cache', action='store_true', help='Build sans cache')
    parser.add_argument('--tag', type=str, help='Tag personnalisé pour l\'image')
    parser.add_argument('--registry', type=str, help='URL du registry Docker')
    parser.add_argument('--compose', action='store_true', help='Utiliser docker-compose')
    parser.add_argument('--up', action='store_true', help='Démarrer les services avec docker-compose')
    parser.add_argument('--down', action='store_true', help='Arrêter les services docker-compose')
    parser.add_argument('--logs', action='store_true', help='Afficher les logs des conteneurs')
    parser.add_argument('--verbose', '-v', action='store_true', help='Mode verbose')
    
    args = parser.parse_args()
    
    # Répertoire du projet
    project_dir = Path(__file__).parent.parent.parent
    frontend_dir = project_dir / "Segus_Engineering_Frontend"
    
    print("🐳 Script d'automatisation Docker - Frontend Angular")
    print(f"📁 Répertoire projet: {project_dir}")
    print(f"🎯 Mode: {args.mode}")
    print("-" * 60)
    
    # Vérifier que Docker est installé
    stdout, stderr, code = run_command("docker --version")
    if code != 0:
        print("❌ Docker n'est pas installé ou accessible")
        sys.exit(1)
    
    print(f"✅ Docker version: {stdout.strip()}")
    
    # Configuration des images
    image_name = "segus-frontend"
    dockerfile = "Dockerfile.dev" if args.mode == "dev" else "Dockerfile"
    
    # Tag de l'image
    if args.tag:
        image_tag = args.tag
    else:
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        image_tag = f"{args.mode}-{timestamp}"
    
    full_image_name = f"{image_name}:{image_tag}"
    
    if args.registry:
        full_image_name = f"{args.registry}/{full_image_name}"
    
    # Nettoyage si demandé
    if args.clean:
        print("🧹 Nettoyage des images Docker non utilisées...")
        stdout, stderr, code = run_command("docker system prune -f")
        if code == 0:
            print("✅ Nettoyage terminé")
        else:
            print(f"⚠️  Erreur lors du nettoyage: {stderr}")
    
    # Build de l'image Docker
    if args.build:
        print(f"🔨 Construction de l'image Docker: {full_image_name}")
        print(f"📄 Dockerfile: {dockerfile}")
        
        build_command = f"docker build -f {dockerfile} -t {full_image_name}"
        
        if args.no_cache:
            build_command += " --no-cache"
        
        if args.verbose:
            build_command += " --progress=plain"
        
        build_command += f" {frontend_dir}"
        
        print(f"🚀 Commande: {build_command}")
        
        stdout, stderr, code = run_command(build_command, capture_output=False)
        
        if code == 0:
            print(f"✅ Image construite avec succès: {full_image_name}")
        else:
            print(f"❌ Échec de la construction: {stderr}")
            sys.exit(1)
    
    # Push vers le registry
    if args.push:
        if not args.registry:
            print("⚠️  Aucun registry spécifié pour le push")
        else:
            print(f"📤 Push de l'image vers le registry: {args.registry}")
            
            # Login si nécessaire (à adapter selon le registry)
            print("🔐 Assurez-vous d'être connecté au registry")
            
            push_command = f"docker push {full_image_name}"
            stdout, stderr, code = run_command(push_command, capture_output=False)
            
            if code == 0:
                print(f"✅ Image pushée avec succès: {full_image_name}")
            else:
                print(f"❌ Échec du push: {stderr}")
                sys.exit(1)
    
    # Gestion docker-compose
    if args.compose:
        compose_file = "docker-compose.dev.yml" if args.mode == "dev" else "docker-compose.yml"
        compose_path = project_dir / compose_file
        
        if not compose_path.exists():
            print(f"❌ Fichier docker-compose non trouvé: {compose_path}")
            sys.exit(1)
        
        print(f"🐙 Utilisation de docker-compose: {compose_file}")
        
        if args.up:
            print("🚀 Démarrage des services...")
            up_command = f"docker-compose -f {compose_file} up -d"
            
            if args.verbose:
                up_command = up_command.replace(" -d", "")
            
            stdout, stderr, code = run_command(up_command, cwd=project_dir, capture_output=False)
            
            if code == 0:
                print("✅ Services démarrés avec succès")
                
                # Afficher les services en cours d'exécution
                stdout, stderr, code = run_command(f"docker-compose -f {compose_file} ps", cwd=project_dir)
                if code == 0:
                    print("\n📋 Services en cours d'exécution:")
                    print(stdout)
            else:
                print(f"❌ Échec du démarrage: {stderr}")
                sys.exit(1)
        
        if args.down:
            print("🛑 Arrêt des services...")
            down_command = f"docker-compose -f {compose_file} down"
            
            stdout, stderr, code = run_command(down_command, cwd=project_dir, capture_output=False)
            
            if code == 0:
                print("✅ Services arrêtés avec succès")
            else:
                print(f"❌ Échec de l'arrêt: {stderr}")
                sys.exit(1)
        
        if args.logs:
            print("📜 Affichage des logs...")
            logs_command = f"docker-compose -f {compose_file} logs -f frontend"
            
            try:
                subprocess.run(logs_command, shell=True, cwd=project_dir, check=False)
            except KeyboardInterrupt:
                print("\n⏹️  Affichage des logs interrompu")
    
    # Informations finales
    if args.build and not args.compose:
        print("\n📋 Informations de l'image:")
        print(f"   Nom: {full_image_name}")
        print(f"   Mode: {args.mode}")
        print(f"   Dockerfile: {dockerfile}")
        
        # Taille de l'image
        stdout, stderr, code = run_command(f"docker images {image_name} --format 'table {{{{.Repository}}}}\\t{{{{.Tag}}}}\\t{{{{.Size}}}}'")
        if code == 0:
            print(f"\n📊 Tailles des images:")
            print(stdout)
        
        print(f"\n🚀 Pour démarrer le conteneur:")
        if args.mode == "dev":
            print(f"   docker run -p 4200:4200 {full_image_name}")
        else:
            print(f"   docker run -p 80:80 {full_image_name}")
    
    print("\n✅ Script terminé avec succès!")

if __name__ == "__main__":
    main()
