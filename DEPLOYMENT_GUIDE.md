# 🚀 Guide de Déploiement - Segus Engineering

Ce guide vous accompagne dans le déploiement de l'application Segus Engineering sur différentes plateformes.

## 📋 Prérequis de Déploiement

### Environnement de Production
- **Serveur** : Linux (Ubuntu 20.04+ recommandé)
- **Python** : 3.8+
- **Node.js** : 16+
- **Base de données** : PostgreSQL 12+
- **Serveur web** : Nginx
- **WSGI** : Gunicorn

## 🔧 Configuration de Production

### 1. Variables d'Environnement Backend

Créer un fichier `.env` dans `segus_engineering_Backend/` :

```env
# Django Settings
SECRET_KEY=votre_clé_secrète_très_longue_et_sécurisée
DEBUG=False
ALLOWED_HOSTS=votre-domaine.com,www.votre-domaine.com

# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/segus_db

# Security
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

# CORS
CORS_ALLOWED_ORIGINS=https://votre-domaine.com,https://www.votre-domaine.com

# Email (optionnel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=votre-email@gmail.com
EMAIL_HOST_PASSWORD=votre-mot-de-passe-app
```

### 2. Configuration Frontend Production

Modifier `src/environments/environment.prod.ts` :

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://votre-domaine.com/api/'
};
```

## 🐳 Déploiement avec Docker

### Dockerfile Backend
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "segus_engineering_Backend.wsgi:application"]
```

### Dockerfile Frontend
```dockerfile
FROM node:16-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build --prod

FROM nginx:alpine
COPY --from=build /app/dist/segus-engineering-frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
```

### Docker Compose
```yaml
version: '3.8'

services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: segus_db
      POSTGRES_USER: segus_user
      POSTGRES_PASSWORD: segus_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./segus_engineering_Backend
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://segus_user:segus_password@db:5432/segus_db

  frontend:
    build: ./Segus_Engineering_Frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## ☁️ Déploiement Cloud

### Heroku

#### Backend
```bash
# Installer Heroku CLI
# Créer Procfile
echo "web: gunicorn segus_engineering_Backend.wsgi" > Procfile

# Déployer
heroku create segus-backend
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set SECRET_KEY=votre_clé_secrète
git push heroku main
heroku run python manage.py migrate
```

#### Frontend (Netlify)
```bash
# Build de production
ng build --prod

# Déployer sur Netlify
# 1. Connecter le repo GitHub
# 2. Build command: ng build --prod
# 3. Publish directory: dist/segus-engineering-frontend
```

### AWS EC2

#### 1. Configuration du serveur
```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation des dépendances
sudo apt install python3-pip nginx postgresql postgresql-contrib nodejs npm -y

# Installation PM2 pour Node.js
sudo npm install -g pm2
```

#### 2. Configuration PostgreSQL
```bash
sudo -u postgres psql
CREATE DATABASE segus_db;
CREATE USER segus_user WITH PASSWORD 'votre_password';
GRANT ALL PRIVILEGES ON DATABASE segus_db TO segus_user;
\q
```

#### 3. Déploiement Backend
```bash
# Cloner le projet
git clone https://github.com/chihi-dorsaf/segus-website.git
cd segus-website/segus_engineering_Backend

# Environnement virtuel
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configuration
cp .env.example .env
# Éditer .env avec vos valeurs

# Migrations et collecte des fichiers statiques
python manage.py migrate
python manage.py collectstatic --noinput

# Démarrage avec Gunicorn
gunicorn --bind 0.0.0.0:8000 segus_engineering_Backend.wsgi:application
```

#### 4. Configuration Nginx
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /var/www/segus-frontend;
        try_files $uri $uri/ /index.html;
    }
}
```

## 🔒 Sécurité

### SSL/TLS avec Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

### Firewall
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 📊 Monitoring

### Logs Backend
```bash
# Logs Django
tail -f /path/to/django.log

# Logs Gunicorn
tail -f /var/log/gunicorn/error.log
```

### Monitoring avec PM2
```bash
pm2 start ecosystem.config.js
pm2 monit
pm2 logs
```

## 🔄 CI/CD avec GitHub Actions

### .github/workflows/deploy.yml
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.4
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /path/to/segus-website
          git pull origin main
          cd segus_engineering_Backend
          source venv/bin/activate
          pip install -r requirements.txt
          python manage.py migrate
          python manage.py collectstatic --noinput
          sudo systemctl restart gunicorn
          sudo systemctl restart nginx
```

## 🧪 Tests de Déploiement

### Checklist Post-Déploiement
- [ ] API Backend accessible
- [ ] Frontend se charge correctement
- [ ] Authentification fonctionne
- [ ] Base de données connectée
- [ ] Fichiers statiques servis
- [ ] SSL/HTTPS actif
- [ ] Logs sans erreurs

### Tests Automatisés
```bash
# Backend
python manage.py test

# Frontend
ng test --watch=false --browsers=ChromeHeadless
```

## 🆘 Dépannage

### Problèmes Courants

#### Erreur 502 Bad Gateway
```bash
# Vérifier Gunicorn
sudo systemctl status gunicorn
sudo systemctl restart gunicorn

# Vérifier Nginx
sudo nginx -t
sudo systemctl restart nginx
```

#### Erreur de Base de Données
```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -l
```

#### Problèmes de Permissions
```bash
# Fichiers statiques
sudo chown -R www-data:www-data /var/www/segus-frontend
sudo chmod -R 755 /var/www/segus-frontend
```

## 📞 Support

Pour toute assistance de déploiement :
- **Documentation** : Consulter ce guide
- **Issues** : Créer une issue GitHub
- **Contact** : support@segus-engineering.com

---

**Bon déploiement ! 🚀**
