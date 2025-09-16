# Multi-stage Dockerfile pour le backend Django Segus Engineering
# Stage 1: Build stage
FROM python:3.11-slim as builder

# Définir les variables d'environnement pour Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Installer les dépendances système nécessaires pour la compilation
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    libmariadb-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Créer un utilisateur non-root pour la sécurité
RUN groupadd -r django && useradd -r -g django django

# Créer le répertoire de travail
WORKDIR /app

# Copier et installer les dépendances Python
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Production stage
FROM python:3.11-slim as production

# Variables d'environnement pour la production
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=segus_engineering_Backend.settings \
    PATH="/home/django/.local/bin:$PATH"

# Installer uniquement les dépendances runtime nécessaires
RUN apt-get update && apt-get install -y \
    libpq5 \
    libmariadb3 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge -y --auto-remove

# Créer un utilisateur non-root
RUN groupadd -r django && useradd -r -g django django

# Créer les répertoires nécessaires
RUN mkdir -p /app /app/static /app/media /app/logs \
    && chown -R django:django /app

# Copier les dépendances Python depuis le stage builder
COPY --from=builder --chown=django:django /root/.local /home/django/.local

# Définir le répertoire de travail
WORKDIR /app

# Copier le code source
COPY --chown=django:django . .

# Créer un script d'entrée
COPY --chown=django:django <<EOF /app/entrypoint.sh
#!/bin/bash
set -e

# Fonction de logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Attendre que la base de données soit prête (si nécessaire)
if [ "$DATABASE_URL" ]; then
    log "Waiting for database..."
    python manage.py wait_for_db || true
fi

# Exécuter les migrations
log "Running database migrations..."
python manage.py migrate --noinput

# Collecter les fichiers statiques
log "Collecting static files..."
python manage.py collectstatic --noinput --clear

# Créer un superutilisateur si les variables d'environnement sont définies
if [ "$DJANGO_SUPERUSER_EMAIL" ] && [ "$DJANGO_SUPERUSER_PASSWORD" ]; then
    log "Creating superuser..."
    python manage.py createsuperuser --noinput --email "$DJANGO_SUPERUSER_EMAIL" || true
fi

# Démarrer l'application
log "Starting Django application..."
exec "$@"
EOF

# Rendre le script exécutable
RUN chmod +x /app/entrypoint.sh

# Changer vers l'utilisateur non-root
USER django

# Exposer le port
EXPOSE 8000

# Définir le point d'entrée
ENTRYPOINT ["/app/entrypoint.sh"]

# Commande par défaut
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "segus_engineering_Backend.wsgi:application"]

# Labels pour la métadonnée
LABEL maintainer="Segus Engineering Team" \
      version="1.0" \
      description="Backend Django pour Segus Engineering" \
      org.opencontainers.image.source="https://github.com/segus-engineering/backend"
