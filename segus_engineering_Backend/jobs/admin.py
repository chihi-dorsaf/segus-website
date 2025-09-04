from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import JobCategory, JobOffer, JobApplication, ApplicationStatusHistory, JobAlert

@admin.register(JobCategory)
class JobCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon', 'is_active', 'jobs_count', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at']
    
    def jobs_count(self, obj):
        count = obj.job_offers.count()
        if count > 0:
            url = reverse('admin:jobs_joboffer_changelist') + f'?category__id__exact={obj.id}'
            return format_html('<a href="{}">{} offres</a>', url, count)
        return '0 offres'
    jobs_count.short_description = 'Nombre d\'offres'

@admin.register(JobOffer)
class JobOfferAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'category', 'job_type', 'location', 
        'experience_level', 'is_active', 'is_featured',
        'applications_count', 'new_applications_count', 'created_at'
    ]
    list_filter = [
        'is_active', 'is_featured', 'job_type', 'category',
        'experience_level', 'created_at', 'application_deadline'
    ]
    search_fields = ['title', 'description', 'location']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['created_at', 'updated_at', 'applications_count', 'new_applications_count']
    filter_horizontal = []
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('title', 'slug', 'category', 'location', 'job_type', 'experience_level')
        }),
        ('Description', {
            'fields': ('description', 'requirements', 'skills')
        }),
        ('Salaire', {
            'fields': ('salary_min', 'salary_max', 'salary_currency'),
            'classes': ('collapse',)
        }),
        ('Paramètres', {
            'fields': ('is_active', 'is_featured', 'application_deadline', 'created_by')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at', 'applications_count', 'new_applications_count'),
            'classes': ('collapse',)
        }),
    )
    
    def applications_count(self, obj):
        count = obj.job_applications.count()
        if count > 0:
            url = reverse('admin:jobs_jobapplication_changelist') + f'?job_offer__id__exact={obj.id}'
            return format_html('<a href="{}">{} candidatures</a>', url, count)
        return '0 candidatures'
    applications_count.short_description = 'Candidatures'
    
    def new_applications_count(self, obj):
        count = obj.job_applications.filter(status='new').count()
        if count > 0:
            url = reverse('admin:jobs_jobapplication_changelist') + f'?job_offer__id__exact={obj.id}&status__exact=new'
            return format_html('<a href="{}" style="color: #e74c3c; font-weight: bold;">{} nouvelles</a>', url, count)
        return '0 nouvelles'
    new_applications_count.short_description = 'Nouvelles'
    
    def save_model(self, request, obj, form, change):
        if not change:  # Si c'est une création
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = [
        'full_name', 'email', 'job_title', 'status', 
        'experience_years', 'is_spontaneous', 'applied_at', 'reviewed_at'
    ]
    list_filter = [
        'status', 'is_spontaneous', 'applied_at', 'reviewed_at',
        'job_offer__category', 'experience_years'
    ]
    search_fields = [
        'first_name', 'last_name', 'email', 'phone',
        'job_offer__title', 'current_position'
    ]
    readonly_fields = [
        'applied_at', 'updated_at', 'ip_address', 'user_agent',
        'cv_file_link', 'status_history_display'
    ]
    
    fieldsets = (
        ('Candidat', {
            'fields': ('first_name', 'last_name', 'email', 'phone')
        }),
        ('Informations professionnelles', {
            'fields': ('current_position', 'experience_years', 'education')
        }),
        ('Candidature', {
            'fields': ('job_offer', 'is_spontaneous', 'motivation_letter', 'cv_file', 'cv_file_link')
        }),
        ('Liens', {
            'fields': ('portfolio_url', 'linkedin_url'),
            'classes': ('collapse',)
        }),
        ('Statut et suivi', {
            'fields': ('status', 'reviewed_by', 'reviewed_at', 'admin_notes')
        }),
        ('Entretien', {
            'fields': ('interview_date', 'interview_notes'),
            'classes': ('collapse',)
        }),
        ('Métadonnées', {
            'fields': ('applied_at', 'updated_at', 'ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
        ('Historique', {
            'fields': ('status_history_display',),
            'classes': ('collapse',)
        }),
    )
    
    def cv_file_link(self, obj):
        if obj.cv_file:
            return format_html(
                '<a href="{}" target="_blank">Télécharger CV</a>',
                obj.cv_file.url
            )
        return "Aucun CV"
    cv_file_link.short_description = 'CV'
    
    def status_history_display(self, obj):
        history = obj.status_history.all()[:10]  # Derniers 10 changements
        if not history:
            return "Aucun historique"
        
        html = "<ul>"
        for h in history:
            html += f"<li><strong>{h.changed_at.strftime('%d/%m/%Y %H:%M')}</strong> - "
            html += f"{h.old_status} → {h.new_status} "
            html += f"par {h.changed_by.username}"
            if h.notes:
                html += f"<br><em>{h.notes}</em>"
            html += "</li>"
        html += "</ul>"
        return mark_safe(html)
    status_history_display.short_description = 'Historique des statuts'
    
    def save_model(self, request, obj, form, change):
        # Enregistrer l'historique des changements de statut
        if change:
            old_obj = JobApplication.objects.get(pk=obj.pk)
            if old_obj.status != obj.status:
                ApplicationStatusHistory.objects.create(
                    application=obj,
                    old_status=old_obj.status,
                    new_status=obj.status,
                    changed_by=request.user,
                    notes=f"Changement via admin Django"
                )
                if not obj.reviewed_by:
                    obj.reviewed_by = request.user
        
        super().save_model(request, obj, form, change)

@admin.register(ApplicationStatusHistory)
class ApplicationStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['application', 'old_status', 'new_status', 'changed_by', 'changed_at']
    list_filter = ['old_status', 'new_status', 'changed_at', 'changed_by']
    search_fields = ['application__first_name', 'application__last_name', 'application__email']
    readonly_fields = ['changed_at']
    
    def has_add_permission(self, request):
        return False  # Empêcher la création manuelle

@admin.register(JobAlert)
class JobAlertAdmin(admin.ModelAdmin):
    list_display = ['email', 'keywords', 'is_active', 'created_at', 'last_sent']
    list_filter = ['is_active', 'created_at', 'last_sent']
    search_fields = ['email', 'keywords']
    filter_horizontal = ['categories']
    readonly_fields = ['created_at', 'last_sent']
