from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Case, When, IntegerField
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.core.mail import send_mail
from django.conf import settings
from .models import JobCategory, JobOffer, JobApplication, ApplicationStatusHistory, JobAlert
from .serializers import (
    JobCategorySerializer, JobOfferListSerializer, JobOfferDetailSerializer,
    JobOfferCreateUpdateSerializer, JobApplicationListSerializer,
    JobApplicationDetailSerializer, JobApplicationCreateSerializer,
    JobApplicationUpdateSerializer, JobAlertSerializer, JobStatsSerializer
)
from .filters import JobOfferFilter, JobApplicationFilter

class JobCategoryViewSet(viewsets.ModelViewSet):
    queryset = JobCategory.objects.filter(is_active=True)
    serializer_class = JobCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

class JobOfferViewSet(viewsets.ModelViewSet):
    queryset = JobOffer.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_class = JobOfferFilter
    
    def get_queryset(self):
        queryset = JobOffer.objects.select_related('category', 'created_by')
        
        # Pour les utilisateurs non-admin, ne montrer que les offres actives
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return JobOfferListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return JobOfferCreateUpdateSerializer
        else:
            return JobOfferDetailSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        # Générer le slug automatiquement
        from django.utils.text import slugify
        title = serializer.validated_data['title']
        slug = slugify(title)
        
        # S'assurer que le slug est unique
        counter = 1
        original_slug = slug
        while JobOffer.objects.filter(slug=slug).exists():
            slug = f"{original_slug}-{counter}"
            counter += 1
        
        serializer.save(created_by=self.request.user, slug=slug)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def toggle_status(self, request, pk=None):
        """Activer/désactiver une offre"""
        job_offer = self.get_object()
        job_offer.is_active = not job_offer.is_active
        job_offer.save()
        
        serializer = self.get_serializer(job_offer)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def toggle_featured(self, request, pk=None):
        """Mettre en avant/retirer une offre"""
        job_offer = self.get_object()
        job_offer.is_featured = not job_offer.is_featured
        job_offer.save()
        
        serializer = self.get_serializer(job_offer)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def applications(self, request, pk=None):
        """Récupérer les candidatures pour une offre"""
        job_offer = self.get_object()
        applications = job_offer.job_applications.all().order_by('-applied_at')
        
        # Filtrage par statut si spécifié
        status_filter = request.query_params.get('status')
        if status_filter:
            applications = applications.filter(status=status_filter)
        
        serializer = JobApplicationListSerializer(applications, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Récupérer les offres mises en avant"""
        featured_offers = self.get_queryset().filter(is_featured=True, is_active=True)[:6]
        serializer = self.get_serializer(featured_offers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Récupérer les offres récentes"""
        recent_offers = self.get_queryset().filter(is_active=True)[:10]
        serializer = self.get_serializer(recent_offers, many=True)
        return Response(serializer.data)

class JobApplicationViewSet(viewsets.ModelViewSet):
    queryset = JobApplication.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend]
    filterset_class = JobApplicationFilter
    
    def get_queryset(self):
        return JobApplication.objects.select_related(
            'job_offer', 'job_offer__category', 'reviewed_by'
        ).order_by('-applied_at')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return JobApplicationListSerializer
        elif self.action == 'create':
            return JobApplicationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return JobApplicationUpdateSerializer
        else:
            return JobApplicationDetailSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAdminUser]
        return [permission() for permission in permission_classes]
    
    def create(self, request, *args, **kwargs):
        """Créer une nouvelle candidature"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Enregistrer les métadonnées
        application = serializer.save(
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Envoyer un email de confirmation au candidat
        self.send_application_confirmation_email(application)
        
        # Notifier les admins
        self.notify_admins_new_application(application)
        
        response_serializer = JobApplicationDetailSerializer(application, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    def get_client_ip(self, request):
        """Récupérer l'IP du client"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def send_application_confirmation_email(self, application):
        """Envoyer un email de confirmation au candidat"""
        try:
            subject = f"Confirmation de candidature - {application.job_title}"
            message = f"""
Bonjour {application.first_name},

Nous avons bien reçu votre candidature pour le poste de "{application.job_title}".

Détails de votre candidature:
- Poste: {application.job_title}
- Date de candidature: {application.applied_at.strftime('%d/%m/%Y à %H:%M')}
- Statut: En cours d'examen

Notre équipe RH examinera votre profil et vous contactera dans les plus brefs délais si votre candidature correspond à nos besoins.

Cordialement,
L'équipe Segus Engineering
            """
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [application.email],
                fail_silently=True
            )
        except Exception as e:
            print(f"Erreur envoi email candidat: {e}")
    
    def notify_admins_new_application(self, application):
        """Notifier les admins d'une nouvelle candidature"""
        try:
            subject = f"Nouvelle candidature - {application.job_title}"
            message = f"""
Une nouvelle candidature a été reçue:

Candidat: {application.full_name}
Email: {application.email}
Téléphone: {application.phone}
Poste: {application.job_title}
Expérience: {application.experience_years} ans
Type: {'Candidature spontanée' if application.is_spontaneous else 'Candidature ciblée'}

Date de candidature: {application.applied_at.strftime('%d/%m/%Y à %H:%M')}

Connectez-vous à l'interface d'administration pour examiner cette candidature.
            """
            
            # Récupérer les emails des admins
            from django.contrib.auth.models import User
            admin_emails = User.objects.filter(is_staff=True).values_list('email', flat=True)
            admin_emails = [email for email in admin_emails if email]
            
            if admin_emails:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    admin_emails,
                    fail_silently=True
                )
        except Exception as e:
            print(f"Erreur notification admins: {e}")
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def update_status(self, request, pk=None):
        """Mettre à jour le statut d'une candidature"""
        application = self.get_object()
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')
        
        if new_status not in dict(JobApplication.APPLICATION_STATUS):
            return Response(
                {'error': 'Statut invalide'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = application.status
        application.status = new_status
        application.admin_notes = notes
        
        if not application.reviewed_by:
            application.reviewed_by = request.user
            application.reviewed_at = timezone.now()
        
        application.save()
        
        # Enregistrer l'historique
        ApplicationStatusHistory.objects.create(
            application=application,
            old_status=old_status,
            new_status=new_status,
            changed_by=request.user,
            notes=notes
        )
        
        # Envoyer un email au candidat si nécessaire
        if new_status in ['accepted', 'rejected', 'interview']:
            self.send_status_update_email(application, old_status, new_status)
        
        serializer = JobApplicationDetailSerializer(application, context={'request': request})
        return Response(serializer.data)
    
    def send_status_update_email(self, application, old_status, new_status):
        """Envoyer un email au candidat lors du changement de statut"""
        try:
            status_messages = {
                'interview': f"Félicitations ! Votre candidature pour le poste de {application.job_title} a retenu notre attention. Nous vous contacterons prochainement pour organiser un entretien.",
                'accepted': f"Excellente nouvelle ! Votre candidature pour le poste de {application.job_title} a été acceptée. Nous vous contacterons très bientôt pour finaliser les détails.",
                'rejected': f"Nous vous remercions pour votre candidature au poste de {application.job_title}. Malheureusement, nous ne pouvons pas donner suite à votre candidature pour le moment. Nous conservons votre profil pour de futures opportunités."
            }
            
            if new_status in status_messages:
                subject = f"Mise à jour de votre candidature - {application.job_title}"
                message = f"""
Bonjour {application.first_name},

{status_messages[new_status]}

Cordialement,
L'équipe Segus Engineering
                """
                
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [application.email],
                    fail_silently=True
                )
        except Exception as e:
            print(f"Erreur envoi email statut: {e}")
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def stats(self, request):
        """Statistiques des candidatures"""
        now = timezone.now()
        this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        this_week = now - timedelta(days=now.weekday())
        
        # Statistiques des offres
        total_offers = JobOffer.objects.count()
        active_offers = JobOffer.objects.filter(is_active=True).count()
        inactive_offers = total_offers - active_offers
        featured_offers = JobOffer.objects.filter(is_featured=True, is_active=True).count()
        
        # Statistiques des candidatures
        applications = JobApplication.objects.all()
        total_applications = applications.count()
        
        status_counts = applications.aggregate(
            new_applications=Count(Case(When(status='new', then=1), output_field=IntegerField())),
            reviewed_applications=Count(Case(When(status='reviewed', then=1), output_field=IntegerField())),
            interview_applications=Count(Case(When(status='interview', then=1), output_field=IntegerField())),
            accepted_applications=Count(Case(When(status='accepted', then=1), output_field=IntegerField())),
            rejected_applications=Count(Case(When(status='rejected', then=1), output_field=IntegerField())),
            spontaneous_applications=Count(Case(When(is_spontaneous=True, then=1), output_field=IntegerField())),
        )
        
        applications_this_month = applications.filter(applied_at__gte=this_month).count()
        applications_this_week = applications.filter(applied_at__gte=this_week).count()
        
        stats_data = {
            'total_offers': total_offers,
            'active_offers': active_offers,
            'inactive_offers': inactive_offers,
            'featured_offers': featured_offers,
            'total_applications': total_applications,
            'applications_this_month': applications_this_month,
            'applications_this_week': applications_this_week,
            **status_counts
        }
        
        serializer = JobStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def spontaneous(self, request):
        """Récupérer les candidatures spontanées"""
        spontaneous_applications = self.get_queryset().filter(is_spontaneous=True)
        
        # Filtrage par statut si spécifié
        status_filter = request.query_params.get('status')
        if status_filter:
            spontaneous_applications = spontaneous_applications.filter(status=status_filter)
        
        serializer = JobApplicationListSerializer(
            spontaneous_applications, 
            many=True, 
            context={'request': request}
        )
        return Response(serializer.data)

class JobAlertViewSet(viewsets.ModelViewSet):
    queryset = JobAlert.objects.all()
    serializer_class = JobAlertSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
