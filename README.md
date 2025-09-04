# 🏢 Segus Engineering - Plateforme de Gestion de Projets

Une application web moderne de gestion de projets et d'employés développée avec **Angular** et **Django REST Framework**.

## 📋 Table des Matières

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [API Documentation](#api-documentation)
- [Contribution](#contribution)
- [Licence](#licence)

## 🎯 Aperçu

Segus Engineering est une plateforme complète de gestion de projets conçue pour optimiser la productivité des équipes d'ingénierie. Elle offre une interface intuitive pour la gestion des projets, des tâches, des employés et du suivi des heures de travail.

## ✨ Fonctionnalités

### 👨‍💼 Administration
- **Gestion des projets** : Création, modification, suivi des projets
- **Gestion des employés** : Profils, assignations, performances
- **Gestion des tâches** : Organisation hiérarchique des tâches et sous-tâches
- **Tableau de bord analytique** : Statistiques et métriques en temps réel
- **Système de notifications** : Alertes et messages en temps réel
- **Gestion des messages de contact** : Interface pour traiter les demandes clients

### 👨‍💻 Employés
- **Dashboard personnel** : Vue d'ensemble des projets et tâches assignés
- **Interface Kanban** : Gestion visuelle des tâches avec drag & drop
- **Suivi des heures** : Enregistrement des sessions de travail
- **Notifications** : Alertes sur les deadlines et mises à jour
- **Profil personnel** : Gestion des informations personnelles

### 🎨 Interface Utilisateur
- **Design moderne** : Interface responsive avec les couleurs Segus (#002552, #1a73c1, #ff6b35)
- **Navigation intuitive** : Menus contextuels et navigation fluide
- **Animations** : Transitions et effets visuels modernes
- **Mobile-friendly** : Optimisé pour tous les appareils

## 🛠️ Technologies

### Frontend
- **Angular 16+** - Framework principal
- **TypeScript** - Langage de programmation
- **Bootstrap 5** - Framework CSS
- **FontAwesome** - Icônes
- **RxJS** - Programmation réactive

### Backend
- **Django 4.2+** - Framework web Python
- **Django REST Framework** - API REST
- **SQLite** - Base de données (développement)
- **JWT** - Authentification
- **CORS** - Gestion des requêtes cross-origin

### Outils de développement
- **Angular CLI** - Outils de développement Angular
- **Django Management Commands** - Outils Django
- **Git** - Contrôle de version

## 🚀 Installation

### Prérequis
- **Node.js** (v16+)
- **Python** (v3.8+)
- **Git**

### 1. Cloner le repository
```bash
git clone https://github.com/chihi-dorsaf/segus-website.git
cd segus-website
```

### 2. Configuration Backend (Django)
```bash
cd segus_engineering_Backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Installer les dépendances
pip install -r requirements.txt

# Appliquer les migrations
python manage.py migrate

# Créer un superutilisateur
python manage.py createsuperuser

# Lancer le serveur
python manage.py runserver
```

### 3. Configuration Frontend (Angular)
```bash
cd ../Segus_Engineering_Frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
ng serve
```

## ⚙️ Configuration

### Variables d'environnement Backend
Créer un fichier `.env` dans `segus_engineering_Backend/` :
```env
SECRET_KEY=votre_clé_secrète_django
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

### Configuration Frontend
Modifier `src/environments/environment.ts` :
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8000/api/'
};
```

## 📖 Utilisation

### Accès à l'application
- **Frontend** : http://localhost:4200
- **Backend API** : http://127.0.0.1:8000/api/
- **Admin Django** : http://127.0.0.1:8000/admin/

### Comptes par défaut
Après l'installation, créez des comptes via l'interface admin Django ou utilisez les endpoints d'inscription.

### Workflow type
1. **Admin** : Créer des projets et assigner des employés
2. **Employés** : Consulter le dashboard et gérer les tâches
3. **Suivi** : Utiliser les métriques pour optimiser les performances

## 📚 API Documentation

### Endpoints principaux

#### Authentification
- `POST /api/auth/jwt/create-with-email/` - Connexion
- `POST /api/auth/users/` - Inscription
- `POST /api/auth/jwt/refresh/` - Rafraîchir le token

#### Projets
- `GET /api/projects/` - Liste des projets
- `POST /api/projects/` - Créer un projet
- `GET /api/projects/employee/dashboard/` - Dashboard employé
- `GET /api/projects/employee/projects/` - Projets de l'employé

#### Tâches
- `GET /api/projects/tasks/` - Liste des tâches
- `PUT /api/projects/subtasks/{id}/` - Mettre à jour une sous-tâche
- `GET /api/projects/subtasks/my-subtasks/` - Sous-tâches de l'employé

#### Employés
- `GET /api/employees/employees/` - Liste des employés
- `GET /api/employees/work-sessions/` - Sessions de travail

## 🤝 Contribution

### Workflow de développement
1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajouter nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

### Standards de code
- **Backend** : Suivre PEP 8 pour Python
- **Frontend** : Utiliser les conventions Angular et TypeScript
- **Commits** : Messages en français, descriptifs

### Tests
```bash
# Backend
python manage.py test

# Frontend
ng test
```

## 📁 Structure du Projet

```
segus-website/
├── segus_engineering_Backend/          # Backend Django
│   ├── accounts/                       # Gestion des comptes
│   ├── employees/                      # Module employés
│   ├── projects/                       # Module projets/tâches
│   ├── contact_messages/               # Messages de contact
│   ├── chatbot/                        # Chatbot intégré
│   └── segus_engineering_Backend/      # Configuration Django
├── Segus_Engineering_Frontend/         # Frontend Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── FrontOffice/           # Interface employés
│   │   │   ├── BackOffice/            # Interface admin
│   │   │   ├── shared/                # Composants partagés
│   │   │   └── services/              # Services Angular
│   │   └── assets/                    # Ressources statiques
├── .gitignore                         # Fichiers ignorés par Git
└── README.md                          # Documentation
```

## 🔧 Dépannage

### Problèmes courants

#### Erreur CORS
Vérifier la configuration CORS dans `settings.py` :
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
]
```

#### Erreur de base de données
Réappliquer les migrations :
```bash
python manage.py migrate --run-syncdb
```

#### Erreur npm
Nettoyer le cache :
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

## 📞 Support

Pour toute question ou problème :
- **Email** : support@segus-engineering.com
- **Issues GitHub** : [Créer une issue](https://github.com/chihi-dorsaf/segus-website/issues)

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**Développé avec ❤️ par l'équipe Segus Engineering**
