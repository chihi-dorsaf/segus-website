from rest_framework import serializers
from datetime import datetime, date
from .models import (
    DailyObjective, SubTask, DailyPerformance, MonthlyPerformance,
    Badge, EmployeeBadge, EmployeeStats
)
from employees.models import Employee


class SafeDateField(serializers.DateField):
    """Custom DateField that handles datetime objects by converting to date"""
    def to_representation(self, value):
        if isinstance(value, datetime):
            value = value.date()
        return super().to_representation(value)


class DailyObjectiveSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    date = SafeDateField()
    
    class Meta:
        model = DailyObjective
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class SubTaskSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    is_completed = serializers.SerializerMethodField()
    assigned_date = SafeDateField()
    
    class Meta:
        model = SubTask
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'completed_date']
    
    def get_is_completed(self, obj):
        return obj.status == 'completed'


class DailyPerformanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    objective_details = DailyObjectiveSerializer(source='objective', read_only=True)
    date = SafeDateField()
    
    class Meta:
        model = DailyPerformance
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'subtasks_goal_achieved', 
                           'hours_goal_achieved', 'all_goals_achieved', 'daily_stars_earned']


class MonthlyPerformanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    
    class Meta:
        model = MonthlyPerformance
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'regularity_stars', 
                           'overtime_bonus_stars', 'total_monthly_stars', 'total_monthly_points']


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = '__all__'


class EmployeeBadgeSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    badge_details = BadgeSerializer(source='badge', read_only=True)
    
    class Meta:
        model = EmployeeBadge
        fields = '__all__'
        read_only_fields = ['earned_date']


class EmployeeStatsSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    employee_email = serializers.CharField(source='employee.user.email', read_only=True)
    employee_matricule = serializers.CharField(source='employee.matricule', read_only=True)
    badges = EmployeeBadgeSerializer(source='employee.badges', many=True, read_only=True)
    
    class Meta:
        model = EmployeeStats
        fields = '__all__'
        read_only_fields = ['last_updated', 'total_stars', 'total_points', 'total_badges',
                           'total_completed_subtasks', 'total_worked_hours', 'total_overtime_hours',
                           'current_level', 'total_salary_increase']


class EmployeeGamificationDashboardSerializer(serializers.Serializer):
    """Serializer pour le tableau de bord de gamification d'un employé"""
    employee_info = EmployeeStatsSerializer(read_only=True)
    current_month_performance = MonthlyPerformanceSerializer(read_only=True)
    recent_daily_performances = DailyPerformanceSerializer(many=True, read_only=True)
    pending_subtasks = SubTaskSerializer(many=True, read_only=True)
    today_objective = DailyObjectiveSerializer(read_only=True)
    leaderboard_position = serializers.IntegerField(read_only=True)
    next_badge = BadgeSerializer(read_only=True)


class LeaderboardSerializer(serializers.Serializer):
    """Serializer pour le classement des employés"""
    rank = serializers.IntegerField()
    employee_name = serializers.CharField()
    employee_email = serializers.CharField()
    employee_matricule = serializers.CharField()
    total_stars = serializers.DecimalField(max_digits=6, decimal_places=2)
    total_points = serializers.IntegerField()
    current_level = serializers.CharField()
    total_badges = serializers.IntegerField()
    monthly_stars = serializers.DecimalField(max_digits=4, decimal_places=2)


class AdminGamificationStatsSerializer(serializers.Serializer):
    """Serializer pour les statistiques admin de gamification"""
    total_employees = serializers.IntegerField()
    active_employees_today = serializers.IntegerField()
    total_objectives_today = serializers.IntegerField()
    completed_objectives_today = serializers.IntegerField()
    total_subtasks_today = serializers.IntegerField()
    completed_subtasks_today = serializers.IntegerField()
    average_daily_stars = serializers.DecimalField(max_digits=4, decimal_places=2)
    top_performers = LeaderboardSerializer(many=True)
    recent_badge_awards = EmployeeBadgeSerializer(many=True)
