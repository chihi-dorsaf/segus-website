from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Count
from django.core.mail import send_mail
from django.conf import settings
from .models import ContactMessage
from .serializers import (
    ContactMessageSerializer, 
    ContactMessageCreateSerializer, 
    ContactMessageUpdateSerializer
)

class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    
    def get_permissions(self):
        """
        Permissions: 
        - POST (create) : Accessible à tous pour le formulaire de contact
        - Autres actions : Réservées aux admins
        """
        if self.action == 'create':
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """Utilise différents serializers selon l'action"""
        if self.action == 'create':
            return ContactMessageCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ContactMessageUpdateSerializer
        return ContactMessageSerializer
    
    def get_queryset(self):
        """Filtre les messages selon les paramètres de requête"""
        queryset = ContactMessage.objects.all()
        
        # Filtrage par statut
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filtrage par priorité
        priority_filter = self.request.query_params.get('priority', None)
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        # Recherche par nom ou email
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(subject__icontains=search)
            )
        
        # Filtrage par date
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        
        return queryset.order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """Création d'un nouveau message de contact"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Sauvegarde du message
        message = serializer.save()
        
        # Envoi d'email de notification aux admins (optionnel)
        try:
            self.send_admin_notification(message)
        except Exception as e:
            # Log l'erreur mais ne fait pas échouer la création
            print(f"Erreur envoi email admin: {e}")
        
        # Envoi d'email de confirmation au client (optionnel)
        try:
            self.send_client_confirmation(message)
        except Exception as e:
            print(f"Erreur envoi email client: {e}")
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                'message': 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
                'data': ContactMessageSerializer(message).data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Marquer un message comme lu"""
        message = self.get_object()
        message.mark_as_read(admin_user=request.user if request.user.is_authenticated else None)
        return Response({
            'message': 'Message marqué comme lu',
            'data': self.get_serializer(message).data
        })
    
    @action(detail=True, methods=['post'])
    def mark_as_replied(self, request, pk=None):
        """Marquer un message comme répondu"""
        message = self.get_object()
        message.mark_as_replied(admin_user=request.user if request.user.is_authenticated else None)
        return Response({
            'message': 'Message marqué comme répondu',
            'data': self.get_serializer(message).data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Statistiques des messages pour le dashboard admin"""
        total_messages = ContactMessage.objects.count()
        unread_messages = ContactMessage.objects.filter(status='unread').count()
        recent_messages = ContactMessage.objects.filter(
            created_at__gte=timezone.now() - timezone.timedelta(days=7)
        ).count()
        
        # Répartition par statut
        status_stats = ContactMessage.objects.values('status').annotate(
            count=Count('id')
        ).order_by('status')
        
        # Répartition par priorité
        priority_stats = ContactMessage.objects.values('priority').annotate(
            count=Count('id')
        ).order_by('priority')
        
        return Response({
            'total_messages': total_messages,
            'unread_messages': unread_messages,
            'recent_messages': recent_messages,
            'status_distribution': list(status_stats),
            'priority_distribution': list(priority_stats)
        })
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Récupère tous les messages non lus"""
        unread_messages = ContactMessage.objects.filter(status='unread')
        serializer = self.get_serializer(unread_messages, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Récupère les messages récents (7 derniers jours)"""
        recent_messages = ContactMessage.objects.filter(
            created_at__gte=timezone.now() - timezone.timedelta(days=7)
        )[:10]
        serializer = self.get_serializer(recent_messages, many=True)
        return Response(serializer.data)
    
    def send_admin_notification(self, message):
        """Envoie une notification email aux admins"""
        if not hasattr(settings, 'EMAIL_HOST') or not settings.EMAIL_HOST:
            return
        
        subject = f"Nouveau message de contact - {message.subject or 'Sans sujet'}"
        message_body = f"""
        Nouveau message de contact reçu:
        
        De: {message.get_full_name()} ({message.email})
        Sujet: {message.subject or 'Sans sujet'}
        
        Message:
        {message.message}
        
        Reçu le: {message.created_at.strftime('%d/%m/%Y à %H:%M')}
        """
        
        # Email des admins (à configurer)
        admin_emails = ['admin@segus-engineering.com']
        
        send_mail(
            subject=subject,
            message=message_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=admin_emails,
            fail_silently=True
        )
    
    def send_client_confirmation(self, message):
        """Envoie un email de confirmation au client"""
        if not hasattr(settings, 'EMAIL_HOST') or not settings.EMAIL_HOST:
            return
        
        subject = "Confirmation de réception - Segus Engineering"
        message_body = f"""
        Bonjour {message.first_name},
        
        Nous avons bien reçu votre message et nous vous remercions de nous avoir contactés.
        
        Votre demande:
        Sujet: {message.subject or 'Demande d\'information'}
        
        Notre équipe vous répondra dans les plus brefs délais.
        
        Cordialement,
        L'équipe Segus Engineering
        """
        
        send_mail(
            subject=subject,
            message=message_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[message.email],
            fail_silently=True
        )
