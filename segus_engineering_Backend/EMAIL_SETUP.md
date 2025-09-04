# Configuration Email - Segus Engineering

## 📧 Configuration des Emails

Ce système permet d'envoyer automatiquement des emails de bienvenue aux nouveaux employés avec leurs identifiants de connexion.

### 🔧 Configuration SMTP

#### Option 1: Gmail (Recommandé pour les tests)

1. **Activer l'authentification à 2 facteurs** sur votre compte Gmail
2. **Générer un mot de passe d'application** :
   - Allez dans les paramètres de votre compte Google
   - Sécurité → Authentification à 2 facteurs → Mots de passe d'application
   - Générez un mot de passe pour "Django"

3. **Modifier `settings.py`** :
```python
EMAIL_HOST_USER = 'votre-email@gmail.com'
EMAIL_HOST_PASSWORD = 'votre-mot-de-passe-d-application'
```

#### Option 2: Autres fournisseurs SMTP

Modifiez les paramètres dans `settings.py` selon votre fournisseur :

```python
# Pour Outlook/Hotmail
EMAIL_HOST = 'smtp-mail.outlook.com'
EMAIL_PORT = 587

# Pour Yahoo
EMAIL_HOST = 'smtp.mail.yahoo.com'
EMAIL_PORT = 587

# Pour un serveur SMTP personnalisé
EMAIL_HOST = 'smtp.votre-serveur.com'
EMAIL_PORT = 587
```

### 🚀 Test de la Configuration

1. **Démarrer le serveur Django** :
```bash
python manage.py runserver
```

2. **Tester la création d'employé** :
```bash
python test_employee_creation_with_email.py
```

### 📋 Fonctionnalités

#### ✅ Création d'Employé
- Génération automatique d'un nom d'utilisateur unique
- Génération d'un mot de passe sécurisé (12 caractères)
- Envoi automatique d'un email de bienvenue
- Template HTML moderne et responsive

#### ✅ Réinitialisation de Mot de Passe
- Endpoint : `POST /api/employees/{id}/reset-password/`
- Génération d'un nouveau mot de passe sécurisé
- Envoi d'un email avec le nouveau mot de passe

#### ✅ Sécurité
- Mots de passe avec caractères mixtes (majuscules, minuscules, chiffres, symboles)
- Validation des emails uniques
- Logs détaillés des opérations

### 📧 Template d'Email

Le template d'email (`employees/templates/employees/welcome_email.html`) inclut :
- Design moderne et professionnel
- Informations de connexion claires
- Instructions de sécurité
- Liens vers la plateforme
- Informations de contact de l'entreprise

### 🔍 Logs

Les logs sont sauvegardés dans :
- Console : Affichage en temps réel
- Fichier : `logs/django.log`

### ⚠️ Notes Importantes

1. **Configuration Email** : Assurez-vous de configurer correctement les paramètres SMTP
2. **Sécurité** : Ne committez jamais les mots de passe d'email dans le code
3. **Tests** : Testez toujours avec un email valide avant la production
4. **Production** : Utilisez un service d'email professionnel (SendGrid, Mailgun, etc.)

### 🛠️ Dépannage

#### Erreur "SMTP Authentication failed"
- Vérifiez que l'authentification à 2 facteurs est activée
- Vérifiez le mot de passe d'application

#### Erreur "Connection refused"
- Vérifiez les paramètres SMTP (host, port)
- Vérifiez votre connexion internet

#### Email non reçu
- Vérifiez le dossier spam
- Vérifiez l'adresse email de destination
- Consultez les logs Django pour les erreurs 