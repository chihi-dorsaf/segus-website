from django.contrib import admin
from .models import (
    DailyObjective, SubTask, DailyPerformance, MonthlyPerformance,
    Badge, EmployeeBadge, EmployeeStats
)


@admin.register(DailyObjective)
class DailyObjectiveAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'target_subtasks', 'target_hours', 'created_by']
    list_filter = ['date', 'created_by']
    search_fields = ['employee__user__first_name', 'employee__user__last_name']
    date_hierarchy = 'date'
    ordering = ['-date']


@admin.register(SubTask)
class SubTaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'employee', 'status', 'assigned_date', 'completed_date']
    list_filter = ['status', 'assigned_date', 'created_by']
    search_fields = ['title', 'employee__user__first_name', 'employee__user__last_name']
    date_hierarchy = 'assigned_date'
    ordering = ['-assigned_date']


@admin.register(DailyPerformance)
class DailyPerformanceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'completed_subtasks', 'worked_hours', 'overtime_hours', 'daily_stars_earned', 'all_goals_achieved']
    list_filter = ['date', 'all_goals_achieved', 'subtasks_goal_achieved', 'hours_goal_achieved']
    search_fields = ['employee__user__first_name', 'employee__user__last_name']
    date_hierarchy = 'date'
    ordering = ['-date']
    readonly_fields = ['subtasks_goal_achieved', 'hours_goal_achieved', 'all_goals_achieved', 'daily_stars_earned']


@admin.register(MonthlyPerformance)
class MonthlyPerformanceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'month', 'year', 'total_worked_hours', 'total_overtime_hours', 'days_with_all_goals', 'total_monthly_stars']
    list_filter = ['year', 'month']
    search_fields = ['employee__user__first_name', 'employee__user__last_name']
    ordering = ['-year', '-month']
    readonly_fields = ['regularity_stars', 'overtime_bonus_stars', 'total_monthly_stars', 'total_monthly_points']


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ['name', 'badge_type', 'required_stars', 'required_points', 'salary_increase_percentage', 'is_active']
    list_filter = ['badge_type', 'is_active']
    search_fields = ['name', 'description']
    ordering = ['required_stars', 'required_points']


@admin.register(EmployeeBadge)
class EmployeeBadgeAdmin(admin.ModelAdmin):
    list_display = ['employee', 'badge', 'earned_date', 'stars_at_earning', 'points_at_earning']
    list_filter = ['badge', 'earned_date']
    search_fields = ['employee__user__first_name', 'employee__user__last_name', 'badge__name']
    date_hierarchy = 'earned_date'
    ordering = ['-earned_date']


@admin.register(EmployeeStats)
class EmployeeStatsAdmin(admin.ModelAdmin):
    list_display = ['employee', 'total_stars', 'total_points', 'total_badges', 'current_level', 'current_rank', 'total_salary_increase']
    list_filter = ['current_level']
    search_fields = ['employee__user__first_name', 'employee__user__last_name']
    ordering = ['-total_stars', '-total_points']
    readonly_fields = ['total_stars', 'total_points', 'total_badges', 'total_completed_subtasks', 
                      'total_worked_hours', 'total_overtime_hours', 'current_level', 'total_salary_increase']
