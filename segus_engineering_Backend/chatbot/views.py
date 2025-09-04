from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
import re
from .models import ChatConversation, ChatMessage, ChatbotKnowledge
from .serializers import ChatConversationSerializer, ChatMessageSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    """Envoyer un message au chatbot et recevoir une réponse"""
    try:
        user_message = request.data.get('message', '').strip()
        conversation_id = request.data.get('conversation_id')
        
        if not user_message:
            return Response({'error': 'Message vide'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Créer ou récupérer la conversation
        if conversation_id:
            try:
                conversation = ChatConversation.objects.get(id=conversation_id, user=request.user)
            except ChatConversation.DoesNotExist:
                conversation = ChatConversation.objects.create(user=request.user)
        else:
            conversation = ChatConversation.objects.create(user=request.user)
        
        # Sauvegarder le message utilisateur
        user_msg = ChatMessage.objects.create(
            conversation=conversation,
            message_type='user',
            content=user_message
        )
        
        # Générer la réponse du bot
        bot_response = generate_bot_response(user_message, request.user)
        
        # Sauvegarder la réponse du bot
        bot_msg = ChatMessage.objects.create(
            conversation=conversation,
            message_type='bot',
            content=bot_response
        )
        
        # Mettre à jour le titre de la conversation si c'est le premier message
        if conversation.messages.count() == 2:  # user + bot message
            conversation.title = user_message[:50] + ('...' if len(user_message) > 50 else '')
            conversation.save()
        
        return Response({
            'conversation_id': conversation.id,
            'user_message': {
                'id': user_msg.id,
                'content': user_msg.content,
                'timestamp': user_msg.timestamp
            },
            'bot_response': {
                'id': bot_msg.id,
                'content': bot_msg.content,
                'timestamp': bot_msg.timestamp
            }
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversations(request):
    """Récupérer toutes les conversations de l'utilisateur"""
    conversations = ChatConversation.objects.filter(user=request.user, is_active=True)
    serializer = ChatConversationSerializer(conversations, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversation_messages(request, conversation_id):
    """Récupérer tous les messages d'une conversation"""
    try:
        conversation = ChatConversation.objects.get(id=conversation_id, user=request.user)
        messages = conversation.messages.all()
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)
    except ChatConversation.DoesNotExist:
        return Response({'error': 'Conversation non trouvée'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_conversation(request, conversation_id):
    """Supprimer une conversation"""
    try:
        conversation = ChatConversation.objects.get(id=conversation_id, user=request.user)
        conversation.is_active = False
        conversation.save()
        return Response({'message': 'Conversation supprimée'})
    except ChatConversation.DoesNotExist:
        return Response({'error': 'Conversation non trouvée'}, status=status.HTTP_404_NOT_FOUND)

def generate_bot_response(user_message, user):
    """Générer une réponse du chatbot basée sur le message utilisateur"""
    user_message_lower = user_message.lower()
    
    # Réponses pour les questions sur les tâches
    if any(keyword in user_message_lower for keyword in ['tâche', 'taches', 'task', 'travail']):
        if any(word in user_message_lower for word in ['voir', 'afficher', 'consulter', 'comment']):
            return """📋 **Comment voir vos tâches :**

1. **Dans l'espace Admin :**
   • Allez dans l'onglet "Projets"
   • Cliquez sur un projet pour voir ses tâches
   • Utilisez les filtres pour trier

2. **Dans l'espace Employé :**
   • Menu "Mes Tâches" 
   • Tableau de bord personnel

🔗 **Raccourci :** Cliquez sur votre nom d'utilisateur → "Mes Tâches" """
        
        elif any(word in user_message_lower for word in ['créer', 'ajouter', 'nouvelle']):
            return """➕ **Créer une nouvelle tâche :**

1. Sélectionnez un projet
2. Cliquez sur "Ajouter une tâche"
3. Remplissez :
   • Titre et description
   • Dates de début/fin
   • Priorité
   • Employés assignés
4. Sauvegardez

🔗 **Raccourci :** Bouton "+" dans la vue projet"""
    
    # Réponses pour les questions sur les projets
    elif any(keyword in user_message_lower for keyword in ['projet', 'project']):
        if any(word in user_message_lower for word in ['voir', 'afficher', 'consulter']):
            return """📁 **Comment voir vos projets :**

1. **Menu principal :** Onglet "Projets"
2. **Filtres disponibles :**
   • Par statut (Actif, Terminé, En pause)
   • Par employé assigné
   • Par date

3. **Vues :**
   • Grille (cartes)
   • Liste (tableau)

🔗 **Raccourci :** Ctrl+P pour accès rapide"""
        
        elif any(word in user_message_lower for word in ['créer', 'nouveau']):
            return """🆕 **Créer un nouveau projet :**

1. Cliquez sur "Nouveau Projet"
2. Remplissez les informations :
   • Titre et description
   • Dates de début/fin
   • Statut initial
3. Assignez les employés
4. Sauvegardez

🔗 **Raccourci :** Bouton "+" en haut à droite"""
    
    # Questions sur la navigation
    elif any(keyword in user_message_lower for keyword in ['navigation', 'menu', 'aller', 'accéder']):
        return """🧭 **Navigation dans l'application :**

**Menu principal :**
• 🏠 Tableau de bord
• 📁 Projets
• 👥 Employés
• 📊 Rapports
• ⚙️ Paramètres

**Raccourcis clavier :**
• Ctrl+H : Accueil
• Ctrl+P : Projets
• Ctrl+E : Employés
• Ctrl+/ : Aide

**Menu utilisateur :**
• Profil
• Mes tâches
• Notifications
• Déconnexion"""
    
    # Questions sur les employés
    elif any(keyword in user_message_lower for keyword in ['employé', 'employe', 'utilisateur', 'user']):
        return """👥 **Gestion des employés :**

**Voir les employés :**
• Menu "Employés"
• Recherche par nom/email
• Filtres par rôle

**Actions disponibles :**
• Ajouter un employé
• Modifier les informations
• Assigner à des projets
• Voir les statistiques

🔗 **Raccourci :** Ctrl+E"""
    
    # Questions sur les notifications
    elif any(keyword in user_message_lower for keyword in ['notification', 'alerte', 'message']):
        return """🔔 **Notifications :**

**Types de notifications :**
• Assignation à un projet
• Nouvelle tâche
• Échéances proches
• Mises à jour de statut

**Où les voir :**
• Icône cloche en haut à droite
• Emails automatiques
• Tableau de bord

🔗 **Raccourci :** Cliquez sur l'icône 🔔"""
    
    # Questions sur les rapports
    elif any(keyword in user_message_lower for keyword in ['rapport', 'statistique', 'analytics']):
        return """📊 **Rapports et statistiques :**

**Rapports disponibles :**
• Progression des projets
• Performance des employés
• Temps de travail
• Statistiques globales

**Accès :**
• Menu "Rapports"
• Tableaux de bord
• Export Excel/PDF

🔗 **Raccourci :** Menu → Rapports"""
    
    # Salutations
    elif any(keyword in user_message_lower for keyword in ['bonjour', 'salut', 'hello', 'hi']):
        return f"""👋 Bonjour {user.first_name or user.username} !

Je suis votre assistant Segus Engineering. Je peux vous aider avec :

• 📋 Gestion des tâches
• 📁 Navigation dans les projets  
• 👥 Questions sur les employés
• 🔔 Notifications
• 📊 Rapports

**Exemples de questions :**
• "Comment voir mes tâches ?"
• "Comment créer un projet ?"
• "Où sont les notifications ?"

Que puis-je faire pour vous ?"""
    
    # Aide générale
    elif any(keyword in user_message_lower for keyword in ['aide', 'help', 'comment']):
        return """❓ **Aide - Segus Engineering**

**Questions fréquentes :**
• "Comment voir mes tâches ?"
• "Comment créer un projet ?"
• "Où sont mes notifications ?"
• "Comment assigner un employé ?"

**Raccourcis utiles :**
• Ctrl+H : Accueil
• Ctrl+P : Projets
• Ctrl+E : Employés
• Ctrl+/ : Cette aide

**Navigation rapide :**
• Menu principal en haut
• Barre de recherche
• Filtres dans chaque section

Posez-moi une question spécifique !"""
    
    # Réponse par défaut
    else:
        return """🤔 Je ne suis pas sûr de comprendre votre question.

**Je peux vous aider avec :**
• 📋 Gestion des tâches et projets
• 🧭 Navigation dans l'application
• 👥 Questions sur les employés
• 🔔 Notifications et alertes

**Exemples de questions :**
• "Comment voir mes tâches ?"
• "Comment créer un nouveau projet ?"
• "Où trouver les notifications ?"

Reformulez votre question ou tapez "aide" pour plus d'options."""
