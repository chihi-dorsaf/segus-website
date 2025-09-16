from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum, Avg, Count
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal

from .models import (
    DailyObjective, SubTask, DailyPerformance, MonthlyPerformance,
    Badge, EmployeeBadge, EmployeeStats
)
from .serializers import (
    DailyObjectiveSerializer, SubTaskSerializer, DailyPerformanceSerializer,
    MonthlyPerformanceSerializer, BadgeSerializer, EmployeeBadgeSerializer,
    EmployeeStatsSerializer, EmployeeGamificationDashboardSerializer,
    LeaderboardSerializer, AdminGamificationStatsSerializer
)
from employees.models import Employee


class DailyObjectiveViewSet(viewsets.ModelViewSet):
    queryset = DailyObjective.objects.all()
    serializer_class = DailyObjectiveSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        employee_id = self.request.query_params.get('employee_id')
        date_filter = self.request.query_params.get('date')
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if date_filter:
            queryset = queryset.filter(date=date_filter)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Récupérer les objectifs d'aujourd'hui"""
        today = date.today()
        objectives = self.get_queryset().filter(date=today)
        serializer = self.get_serializer(objectives, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Créer des objectifs en masse pour plusieurs employés"""
        employees = request.data.get('employees', [])
        target_subtasks = request.data.get('target_subtasks', 0)
        target_hours = request.data.get('target_hours', 8.0)
        date_obj = request.data.get('date', date.today())

        created_objectives = []
        for employee_id in employees:
            try:
                employee = Employee.objects.get(id=employee_id)
                objective, created = DailyObjective.objects.get_or_create(
                    employee=employee,
                    date=date_obj,
                    defaults={
                        'target_subtasks': target_subtasks,
                        'target_hours': target_hours,
                        'created_by': request.user
                    }
                )
                if created:
                    created_objectives.append(objective)
            except Employee.DoesNotExist:
                continue

        serializer = self.get_serializer(created_objectives, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SubTaskViewSet(viewsets.ModelViewSet):
    queryset = SubTask.objects.all()
    serializer_class = SubTaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        employee_id = self.request.query_params.get('employee_id')
        status_filter = self.request.query_params.get('status')
        date_filter = self.request.query_params.get('date')
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if date_filter:
            queryset = queryset.filter(assigned_date=date_filter)
            
        return queryset

    def create(self, request, *args, **kwargs):
        print(f"[DEBUG] SubTask creation data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"[DEBUG] Validation errors: {serializer.errors}")
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Marquer une sous-tâche comme terminée"""
        subtask = self.get_object()
        subtask.mark_completed()
        
        # Mettre à jour la performance quotidienne
        self._update_daily_performance(subtask.employee, subtask.assigned_date)
        
        serializer = self.get_serializer(subtask)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """Récupérer les tâches de l'employé connecté"""
        try:
            employee = Employee.objects.get(user=request.user)
            tasks = self.get_queryset().filter(employee=employee)
            serializer = self.get_serializer(tasks, many=True)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response({'error': 'Employé non trouvé'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def sync_project_subtasks(self, request):
        """Synchroniser les sous-tâches du système de projets avec le système de gamification"""
        try:
            employee = Employee.objects.get(user=request.user)
            today = date.today()
            
            # Déclencher le calcul des performances pour aujourd'hui
            self._update_daily_performance(employee, today)
            
            return Response({
                'message': 'Synchronisation terminée',
                'employee': employee.user.get_full_name(),
                'date': today
            })
        except Employee.DoesNotExist:
            return Response({'error': 'Employé non trouvé'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def complete_project_subtask(self, request, pk=None):
        """Marquer une sous-tâche du système de projets comme terminée et déclencher le calcul des étoiles"""
        try:
            from projects.models import SubTask as ProjectSubTask
            employee = Employee.objects.get(user=request.user)
            
            # Récupérer la sous-tâche du système de projets
            project_subtask = get_object_or_404(ProjectSubTask, pk=pk)
            
            # Vérifier que l'employé est assigné à cette sous-tâche
            if employee.user not in project_subtask.assigned_employees.all():
                return Response({'error': 'Vous n\'êtes pas assigné à cette sous-tâche'}, 
                              status=status.HTTP_403_FORBIDDEN)
            
            # Marquer comme terminée
            project_subtask.is_completed = True
            project_subtask.save()
            
            # Déclencher le calcul des performances pour la date de création
            creation_date = project_subtask.created_at.date()
            self._update_daily_performance(employee, creation_date)
            
            return Response({
                'message': 'Sous-tâche marquée comme terminée',
                'subtask_id': pk,
                'employee': employee.user.get_full_name()
            })
            
        except Employee.DoesNotExist:
            return Response({'error': 'Employé non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _update_daily_performance(self, employee, date_obj):
        """Mettre à jour la performance quotidienne après completion d'une tâche"""
        # Compter les sous-tâches terminées dans le système de gamification
        gamification_completed = SubTask.objects.filter(
            employee=employee,
            assigned_date=date_obj,
            status='completed'
        ).count()
        
        # Compter aussi les sous-tâches terminées dans le système de projets
        from projects.models import SubTask as ProjectSubTask
        project_completed = ProjectSubTask.objects.filter(
            assigned_employees=employee.user,  # Utiliser employee.user au lieu de employee
            created_at__date=date_obj,
            is_completed=True
        ).count()
        
        # Total des sous-tâches terminées
        total_completed = gamification_completed + project_completed
        
        performance, created = DailyPerformance.objects.get_or_create(
            employee=employee,
            date=date_obj,
            defaults={'completed_subtasks': total_completed}
        )
        
        if not created:
            performance.completed_subtasks = total_completed
            performance.save()
        
        performance.calculate_performance()
        
        # Mettre à jour les statistiques globales de l'employé
        from .models import EmployeeStats
        employee_stats, created = EmployeeStats.objects.get_or_create(employee=employee)
        employee_stats.update_stats()
        employee_stats.check_and_award_badges()


class DailyPerformanceViewSet(viewsets.ModelViewSet):
    queryset = DailyPerformance.objects.all()
    serializer_class = DailyPerformanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        employee_id = self.request.query_params.get('employee_id')
        date_filter = self.request.query_params.get('date')
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if date_filter:
            queryset = queryset.filter(date=date_filter)
            
        return queryset

    @action(detail=False, methods=['post'])
    def update_hours(self, request):
        """Mettre à jour les heures travaillées pour un employé"""
        employee_id = request.data.get('employee_id')
        date_obj = request.data.get('date', date.today())
        worked_hours = request.data.get('worked_hours', 0)

        try:
            employee = Employee.objects.get(id=employee_id)
            performance, created = DailyPerformance.objects.get_or_create(
                employee=employee,
                date=date_obj,
                defaults={'worked_hours': worked_hours}
            )
            
            if not created:
                performance.worked_hours = worked_hours
                performance.save()
            
            performance.calculate_performance()
            serializer = self.get_serializer(performance)
            return Response(serializer.data)
            
        except Employee.DoesNotExist:
            return Response({'error': 'Employé non trouvé'}, status=status.HTTP_404_NOT_FOUND)


class MonthlyPerformanceViewSet(viewsets.ModelViewSet):
    queryset = MonthlyPerformance.objects.all()
    serializer_class = MonthlyPerformanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        employee_id = self.request.query_params.get('employee_id')
        year = self.request.query_params.get('year')
        month = self.request.query_params.get('month')
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if year:
            queryset = queryset.filter(year=year)
        if month:
            queryset = queryset.filter(month=month)
            
        return queryset

    @action(detail=False, methods=['post'])
    def calculate_current_month(self, request):
        """Calculer les performances du mois actuel pour tous les employés"""
        today = date.today()
        employees = Employee.objects.all()
        calculated_performances = []

        for employee in employees:
            performance, created = MonthlyPerformance.objects.get_or_create(
                employee=employee,
                year=today.year,
                month=today.month
            )
            performance.calculate_monthly_performance()
            calculated_performances.append(performance)

        serializer = self.get_serializer(calculated_performances, many=True)
        return Response(serializer.data)


class BadgeViewSet(viewsets.ModelViewSet):
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        badge_type = self.request.query_params.get('type')
        is_active = self.request.query_params.get('active')
        
        if badge_type:
            queryset = queryset.filter(badge_type=badge_type)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
            
        return queryset


class EmployeeStatsViewSet(viewsets.ModelViewSet):
    queryset = EmployeeStats.objects.all()
    serializer_class = EmployeeStatsSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def leaderboard(self, request):
        """Classement des employés"""
        stats = self.get_queryset().order_by('-total_stars', '-total_points')[:20]
        
        leaderboard_data = []
        for rank, stat in enumerate(stats, 1):
            # Récupérer les étoiles du mois actuel
            today = date.today()
            monthly_perf = MonthlyPerformance.objects.filter(
                employee=stat.employee,
                year=today.year,
                month=today.month
            ).first()
            monthly_stars = monthly_perf.total_monthly_stars if monthly_perf else 0
            
            leaderboard_data.append({
                'rank': rank,
                'employee_name': stat.employee.user.get_full_name(),
                'employee_email': stat.employee.user.email,
                'employee_matricule': stat.employee.matricule,
                'total_stars': stat.total_stars,
                'total_points': stat.total_points,
                'current_level': stat.current_level,
                'total_badges': stat.total_badges,
                'monthly_stars': monthly_stars
            })
        
        serializer = LeaderboardSerializer(leaderboard_data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_stats(self, request):
        """Statistiques de l'employé connecté"""
        try:
            employee = Employee.objects.get(user=request.user)
            stats, created = EmployeeStats.objects.get_or_create(employee=employee)
            
            if created:
                stats.update_stats()
            
            serializer = self.get_serializer(stats)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response({'error': 'Employé non trouvé'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def update_all_stats(self, request):
        """Mettre à jour toutes les statistiques des employés"""
        stats = self.get_queryset()
        updated_count = 0
        
        for stat in stats:
            stat.update_stats()
            stat.check_and_award_badges()
            updated_count += 1
        
        return Response({'message': f'{updated_count} statistiques mises à jour'})

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Tableau de bord de gamification pour l'employé connecté"""
        try:
            employee = Employee.objects.get(user=request.user)
            stats, created = EmployeeStats.objects.get_or_create(employee=employee)
            
            if created:
                stats.update_stats()
            
            today = date.today()
            
            # Performance du mois actuel
            current_month_performance = MonthlyPerformance.objects.filter(
                employee=employee,
                year=today.year,
                month=today.month
            ).first()
            
            # Performances quotidiennes récentes (7 derniers jours)
            week_ago = today - timedelta(days=7)
            recent_daily_performances = DailyPerformance.objects.filter(
                employee=employee,
                date__gte=week_ago
            ).order_by('-date')
            
            # Sous-tâches en attente
            pending_subtasks = employee.gamification_subtasks.filter(
                status__in=['pending', 'in_progress']
            )[:10]
            
            # Objectif d'aujourd'hui
            today_objective = DailyObjective.objects.filter(
                employee=employee,
                date=today
            ).first()
            
            # Position dans le classement
            better_stats = EmployeeStats.objects.filter(
                Q(total_stars__gt=stats.total_stars) |
                (Q(total_stars=stats.total_stars) & Q(total_points__gt=stats.total_points))
            ).count()
            leaderboard_position = better_stats + 1
            
            # Prochain badge à obtenir
            earned_badges = EmployeeBadge.objects.filter(employee=employee).values_list('badge_id', flat=True)
            next_badge = Badge.objects.filter(
                is_active=True,
                required_stars__gte=stats.total_stars,
                required_points__gte=stats.total_points
            ).exclude(id__in=earned_badges).order_by('required_stars', 'required_points').first()
            
            dashboard_data = {
                'employee_info': stats,
                'current_month_performance': current_month_performance,
                'recent_daily_performances': recent_daily_performances,
                'pending_subtasks': pending_subtasks,
                'today_objective': today_objective,
                'leaderboard_position': leaderboard_position,
                'next_badge': next_badge
            }
            
            serializer = EmployeeGamificationDashboardSerializer(dashboard_data)
            return Response(serializer.data)
            
        except Employee.DoesNotExist:
            return Response({'error': 'Employé non trouvé'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def admin_stats(self, request):
        """Statistiques administrateur pour la gamification"""
        today = date.today()
        
        # Statistiques générales
        total_employees = Employee.objects.count()
        active_employees_today = DailyPerformance.objects.filter(date=today).count()
        total_objectives_today = DailyObjective.objects.filter(date=today).count()
        completed_objectives_today = DailyPerformance.objects.filter(
            date=today,
            all_goals_achieved=True
        ).count()
        
        total_subtasks_today = SubTask.objects.filter(assigned_date=today).count()
        completed_subtasks_today = SubTask.objects.filter(
            assigned_date=today,
            status='completed'
        ).count()
        
        # Moyenne des étoiles quotidiennes
        avg_daily_stars = DailyPerformance.objects.filter(date=today).aggregate(
            avg_stars=Avg('daily_stars_earned')
        )['avg_stars'] or 0
        
        # Top performers (5 meilleurs)
        top_performers = EmployeeStats.objects.order_by('-total_stars', '-total_points')[:5]
        top_performers_data = []
        for rank, stat in enumerate(top_performers, 1):
            monthly_perf = MonthlyPerformance.objects.filter(
                employee=stat.employee,
                year=today.year,
                month=today.month
            ).first()
            monthly_stars = monthly_perf.total_monthly_stars if monthly_perf else 0
            
            top_performers_data.append({
                'rank': rank,
                'employee_name': stat.employee.user.get_full_name(),
                'employee_email': stat.employee.user.email,
                'employee_matricule': stat.employee.matricule,
                'total_stars': stat.total_stars,
                'total_points': stat.total_points,
                'current_level': stat.current_level,
                'total_badges': stat.total_badges,
                'monthly_stars': monthly_stars
            })
        
        # Badges récemment obtenus (10 derniers)
        recent_badge_awards = EmployeeBadge.objects.order_by('-earned_date')[:10]
        
        admin_stats_data = {
            'total_employees': total_employees,
            'active_employees_today': active_employees_today,
            'total_objectives_today': total_objectives_today,
            'completed_objectives_today': completed_objectives_today,
            'total_subtasks_today': total_subtasks_today,
            'completed_subtasks_today': completed_subtasks_today,
            'average_daily_stars': avg_daily_stars,
            'top_performers': top_performers_data,
            'recent_badge_awards': recent_badge_awards
        }
        
        serializer = AdminGamificationStatsSerializer(admin_stats_data)
        return Response(serializer.data)
