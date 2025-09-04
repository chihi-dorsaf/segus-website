from rest_framework import serializers
from django.contrib.auth.models import User
from .models import JobCategory, JobOffer, JobApplication, ApplicationStatusHistory, JobAlert

class JobCategorySerializer(serializers.ModelSerializer):
    jobs_count = serializers.SerializerMethodField()
    
    class Meta:
        model = JobCategory
        fields = ['id', 'name', 'slug', 'icon', 'description', 'is_active', 'jobs_count', 'created_at']
        read_only_fields = ['created_at']
    
    def get_jobs_count(self, obj):
        return obj.job_offers.filter(is_active=True).count()

class JobOfferListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    salary_range = serializers.ReadOnlyField()
    applications_count = serializers.ReadOnlyField()
    new_applications_count = serializers.ReadOnlyField()
    
    class Meta:
        model = JobOffer
        fields = [
            'id', 'title', 'slug', 'category', 'category_name', 'category_icon',
            'location', 'job_type', 'experience_level', 'salary_range',
            'is_active', 'is_featured', 'applications_count', 'new_applications_count',
            'created_at', 'updated_at', 'application_deadline'
        ]

class JobOfferDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    salary_range = serializers.ReadOnlyField()
    applications_count = serializers.ReadOnlyField()
    new_applications_count = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = JobOffer
        fields = [
            'id', 'title', 'slug', 'category', 'category_name', 'category_icon',
            'location', 'job_type', 'description', 'requirements', 'skills',
            'salary_min', 'salary_max', 'salary_currency', 'salary_range',
            'experience_level', 'is_active', 'is_featured', 'application_deadline',
            'applications_count', 'new_applications_count', 'created_by_name',
            'created_at', 'updated_at'
        ]

class JobOfferCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobOffer
        fields = [
            'title', 'category', 'location', 'job_type', 'description',
            'requirements', 'skills', 'salary_min', 'salary_max', 'salary_currency',
            'experience_level', 'is_active', 'is_featured', 'application_deadline'
        ]
    
    def validate_requirements(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Les exigences doivent être une liste.")
        if len(value) == 0:
            raise serializers.ValidationError("Au moins une exigence est requise.")
        return value
    
    def validate_skills(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Les compétences doivent être une liste.")
        if len(value) == 0:
            raise serializers.ValidationError("Au moins une compétence est requise.")
        return value
    
    def validate(self, data):
        if data.get('salary_min') and data.get('salary_max'):
            if data['salary_min'] > data['salary_max']:
                raise serializers.ValidationError("Le salaire minimum ne peut pas être supérieur au salaire maximum.")
        return data

class JobApplicationListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    job_title = serializers.ReadOnlyField()
    job_offer_title = serializers.CharField(source='job_offer.title', read_only=True)
    cv_file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = JobApplication
        fields = [
            'id', 'job_offer', 'job_offer_title', 'job_title', 'full_name',
            'first_name', 'last_name', 'email', 'phone', 'current_position',
            'experience_years', 'status', 'is_spontaneous', 'cv_file_url',
            'applied_at', 'reviewed_at'
        ]
    
    def get_cv_file_url(self, obj):
        if obj.cv_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cv_file.url)
        return None

class JobApplicationDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    job_title = serializers.ReadOnlyField()
    job_offer_details = JobOfferListSerializer(source='job_offer', read_only=True)
    cv_file_url = serializers.SerializerMethodField()
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    status_history = serializers.SerializerMethodField()
    
    class Meta:
        model = JobApplication
        fields = [
            'id', 'job_offer', 'job_offer_details', 'job_title', 'full_name',
            'first_name', 'last_name', 'email', 'phone', 'current_position',
            'experience_years', 'education', 'motivation_letter', 'cv_file',
            'cv_file_url', 'portfolio_url', 'linkedin_url', 'status',
            'is_spontaneous', 'admin_notes', 'interview_date', 'interview_notes',
            'applied_at', 'reviewed_at', 'reviewed_by_name', 'updated_at',
            'status_history'
        ]
    
    def get_cv_file_url(self, obj):
        if obj.cv_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cv_file.url)
        return None
    
    def get_status_history(self, obj):
        history = obj.status_history.all()[:5]  # Derniers 5 changements
        return ApplicationStatusHistorySerializer(history, many=True).data

class JobApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = [
            'job_offer', 'first_name', 'last_name', 'email', 'phone',
            'current_position', 'experience_years', 'education',
            'motivation_letter', 'cv_file', 'portfolio_url', 'linkedin_url',
            'is_spontaneous'
        ]
    
    def validate_email(self, value):
        # Vérifier si une candidature existe déjà pour cette offre et cet email
        job_offer = self.initial_data.get('job_offer')
        if job_offer:
            existing = JobApplication.objects.filter(
                job_offer_id=job_offer,
                email=value
            ).exists()
            if existing:
                raise serializers.ValidationError(
                    "Une candidature existe déjà pour cette offre avec cet email."
                )
        return value
    
    def validate_cv_file(self, value):
        if value:
            # Vérifier la taille du fichier (max 5MB)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Le fichier CV ne peut pas dépasser 5MB.")
            
            # Vérifier l'extension
            allowed_extensions = ['.pdf', '.doc', '.docx']
            if not any(value.name.lower().endswith(ext) for ext in allowed_extensions):
                raise serializers.ValidationError(
                    "Seuls les fichiers PDF, DOC et DOCX sont autorisés."
                )
        return value

class JobApplicationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = [
            'status', 'admin_notes', 'interview_date', 'interview_notes'
        ]
    
    def update(self, instance, validated_data):
        # Enregistrer l'historique des changements de statut
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        
        if old_status != new_status:
            user = self.context['request'].user
            ApplicationStatusHistory.objects.create(
                application=instance,
                old_status=old_status,
                new_status=new_status,
                changed_by=user,
                notes=validated_data.get('admin_notes', '')
            )
            
            # Marquer comme examinée
            if not instance.reviewed_by:
                instance.reviewed_by = user
        
        return super().update(instance, validated_data)

class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    
    class Meta:
        model = ApplicationStatusHistory
        fields = [
            'id', 'old_status', 'new_status', 'changed_by', 'changed_by_name',
            'changed_at', 'notes'
        ]

class JobAlertSerializer(serializers.ModelSerializer):
    categories_details = JobCategorySerializer(source='categories', many=True, read_only=True)
    
    class Meta:
        model = JobAlert
        fields = [
            'id', 'email', 'keywords', 'categories', 'categories_details',
            'job_types', 'locations', 'is_active', 'created_at', 'last_sent'
        ]
        read_only_fields = ['created_at', 'last_sent']

class JobStatsSerializer(serializers.Serializer):
    total_offers = serializers.IntegerField()
    active_offers = serializers.IntegerField()
    inactive_offers = serializers.IntegerField()
    featured_offers = serializers.IntegerField()
    total_applications = serializers.IntegerField()
    new_applications = serializers.IntegerField()
    reviewed_applications = serializers.IntegerField()
    interview_applications = serializers.IntegerField()
    accepted_applications = serializers.IntegerField()
    rejected_applications = serializers.IntegerField()
    spontaneous_applications = serializers.IntegerField()
    applications_this_month = serializers.IntegerField()
    applications_this_week = serializers.IntegerField()

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name']
