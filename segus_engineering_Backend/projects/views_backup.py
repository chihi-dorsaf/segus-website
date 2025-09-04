from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime, timedelta
import csv
import io
import logging
from rest_framework.views import APIView
from django.contrib.auth import get_user_model

from .models import Project, Task, SubTask
from .serializers import (
    ProjectSerializer, ProjectDetailSerializer,
    TaskSerializer, SubTaskSerializer
)

User = get_user_model()
logger = logging.getLogger(__name__)

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        return ProjectSerializer
    
    def get_queryset(self):
        queryset = Project.objects.select_related('created_by').prefetch_related(
            'assigned_employees', 'tasks__assigned_employees'
        )
        
        # Filtrage par statut
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filtrage par employé assigné
        employee_id = self.request.query_params.get('employee', None)
        if employee_id:
            queryset = queryset.filter(assigned_employees__id=employee_id)
        
        # Recherche
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        print(f"DEBUG VIEWS: perform_create called with user: {self.request.user}")
        print(f"DEBUG VIEWS: User ID: {self.request.user.id}")
        print(f"DEBUG VIEWS: User role: {self.request.user.role}")
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def all(self, request):
        """Récupérer tous les projets sans pagination"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Récupérer les statistiques d'un projet"""
        project = self.get_object()
        stats = {
            'totalTasks': project.total_tasks,
            'completedTasks': project.completed_tasks,
            'progressPercentage': project.progress_percentage,
            'totalEmployees': project.assigned_employees.count(),
            'tasksInProgress': project.tasks.filter(status='IN_PROGRESS').count(),
            'tasksTodo': project.tasks.filter(status='TODO').count(),
            'tasksBlocked': project.tasks.filter(status='BLOCKED').count(),
        }
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assigner un employé à un projet"""
        project = self.get_object()
        employee_id = request.data.get('employee_id')
        
        try:
            employee = User.objects.get(id=employee_id)
            project.assigned_employees.add(employee)
            return Response({'message': 'Employé assigné avec succès'})
        except User.DoesNotExist:
            return Response(
                {'error': 'Employé non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def unassign(self, request, pk=None):
        """Désassigner un employé d'un projet"""
        project = self.get_object()
        employee_id = request.data.get('employee_id')
        
        try:
            employee = User.objects.get(id=employee_id)
            project.assigned_employees.remove(employee)
            return Response({'message': 'Employé désassigné avec succès'})
        except User.DoesNotExist:
            return Response(
                {'error': 'Employé non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Task.objects.select_related('project', 'created_by').prefetch_related(
            'assigned_employees', 'subtasks'
        )
        
        # Filtrage par projet
        project_id = self.request.query_params.get('project', None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Filtrage par statut
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filtrage par employé assigné
        employee_id = self.request.query_params.get('employee', None)
        if employee_id:
            queryset = queryset.filter(assigned_employees__id=employee_id)
        
        # Filtrage par priorité
        priority_filter = self.request.query_params.get('priority', None)
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class SubTaskViewSet(viewsets.ModelViewSet):
    queryset = SubTask.objects.all()
    serializer_class = SubTaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = SubTask.objects.select_related('task', 'created_by').prefetch_related(
            'assigned_employees'
        )
        
        # Filtrage par tâche
        task_id = self.request.query_params.get('task', None)
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        
        # Filtrage par statut de completion
        is_completed = self.request.query_params.get('completed', None)
        if is_completed is not None:
            completed = is_completed.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_completed=completed)
        
        # Filtrage par employé assigné
        employee_id = self.request.query_params.get('employee', None)
        if employee_id:
            queryset = queryset.filter(assigned_employees__id=employee_id)
        
        return queryset.order_by('section_number')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
