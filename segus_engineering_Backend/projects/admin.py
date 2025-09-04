from django.contrib import admin
from .models import Project, Task, SubTask

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'start_date', 'end_date', 'progress_percentage', 'created_by')
    list_filter = ('status', 'start_date', 'created_by')
    search_fields = ('title', 'description')
    filter_horizontal = ('assigned_employees',)
    readonly_fields = ('progress_percentage', 'total_tasks', 'completed_tasks', 'created_at', 'updated_at')
    
    def save_model(self, request, obj, form, change):
        if not change:  # Si c'est une création
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'status', 'priority', 'start_date', 'end_date', 'progress_percentage')
    list_filter = ('status', 'priority', 'project', 'start_date')
    search_fields = ('title', 'description', 'project__title')
    filter_horizontal = ('assigned_employees',)
    readonly_fields = ('progress_percentage', 'total_subtasks', 'completed_subtasks', 'created_at', 'updated_at')
    
    def save_model(self, request, obj, form, change):
        if not change:  # Si c'est une création
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(SubTask)
class SubTaskAdmin(admin.ModelAdmin):
    list_display = ('section_name', 'section_number', 'task', 'kilometrage', 'is_completed', 'completed_at')
    list_filter = ('is_completed', 'task__project', 'task')
    search_fields = ('section_name', 'section_number', 'section_id', 'task__title')
    filter_horizontal = ('assigned_employees',)
    readonly_fields = ('completed_at', 'created_at', 'updated_at')
    
    def save_model(self, request, obj, form, change):
        if not change:  # Si c'est une création
            obj.created_by = request.user
        super().save_model(request, obj, form, change)