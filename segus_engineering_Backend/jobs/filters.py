import django_filters
from django.db.models import Q

from .models import JobApplication, JobCategory, JobOffer


class JobOfferFilter(django_filters.FilterSet):
    category = django_filters.ModelChoiceFilter(queryset=JobCategory.objects.all())
    job_type = django_filters.ChoiceFilter(choices=JobOffer.JOB_TYPES)
    location = django_filters.CharFilter(lookup_expr="icontains")
    is_active = django_filters.BooleanFilter()
    is_featured = django_filters.BooleanFilter()
    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = JobOffer
        fields = ["category", "job_type", "location", "is_active", "is_featured"]

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(title__icontains=value)
            | Q(description__icontains=value)
            | Q(location__icontains=value)
        )


class JobApplicationFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=JobApplication.APPLICATION_STATUS)
    is_spontaneous = django_filters.BooleanFilter()
    job_offer = django_filters.ModelChoiceFilter(queryset=JobOffer.objects.all())
    applied_date = django_filters.DateFromToRangeFilter(field_name="applied_at")

    class Meta:
        model = JobApplication
        fields = ["status", "is_spontaneous", "job_offer"]
