from django.db import models
from django.conf import settings
from employees.models import Employee
from decimal import Decimal
from django.utils import timezone
from datetime import date, timedelta


class DailyObjective(models.Model):
    """Objectifs quotidiens définis par l'admin pour chaque employé"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='daily_objectives')
    date = models.DateField(default=date.today)
    target_subtasks = models.IntegerField(default=0, help_text="Nombre de sous-tâches à accomplir")
    target_hours = models.DecimalField(max_digits=4, decimal_places=2, default=8.00, help_text="Nombre d'heures de travail prévues")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_gamification_objectives')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['employee', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.date} - {self.target_subtasks} tâches, {self.target_hours}h"


class SubTask(models.Model):
    """Sous-tâches assignées aux employés"""
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('in_progress', 'En cours'),
        ('completed', 'Terminée'),
        ('cancelled', 'Annulée'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='gamification_subtasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_date = models.DateField(default=date.today)
    completed_date = models.DateTimeField(null=True, blank=True)
    estimated_duration = models.DurationField(null=True, blank=True, help_text="Durée estimée")
    actual_duration = models.DurationField(null=True, blank=True, help_text="Durée réelle")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_gamification_subtasks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-assigned_date', '-created_at']

    def __str__(self):
        return f"{self.title} - {self.employee.user.get_full_name()} - {self.status}"

    def mark_completed(self):
        """Marquer la sous-tâche comme terminée"""
        self.status = 'completed'
        self.completed_date = timezone.now()
        self.save()


class DailyPerformance(models.Model):
    """Performance quotidienne d'un employé"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='daily_performances')
    date = models.DateField(default=date.today)
    objective = models.ForeignKey(DailyObjective, on_delete=models.CASCADE, null=True, blank=True)
    
    # Réalisations
    completed_subtasks = models.IntegerField(default=0)
    worked_hours = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    overtime_hours = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    
    # Objectifs atteints
    subtasks_goal_achieved = models.BooleanField(default=False)
    hours_goal_achieved = models.BooleanField(default=False)
    all_goals_achieved = models.BooleanField(default=False)
    
    # Récompenses
    daily_stars_earned = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    bonus_points = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['employee', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.date} - {self.daily_stars_earned} étoiles"

    def calculate_performance(self):
        """Calculer la performance quotidienne selon la méthode de badging améliorée"""
        if self.objective:
            # Vérifier si les objectifs sont atteints
            self.subtasks_goal_achieved = self.completed_subtasks >= self.objective.target_subtasks
            self.hours_goal_achieved = self.worked_hours >= self.objective.target_hours
            self.all_goals_achieved = self.subtasks_goal_achieved and self.hours_goal_achieved
            
            # Calculer les heures supplémentaires
            if self.worked_hours > self.objective.target_hours:
                self.overtime_hours = self.worked_hours - self.objective.target_hours
            else:
                self.overtime_hours = Decimal('0.00')
            
            # Attribution des étoiles selon la méthode améliorée
            if self.all_goals_achieved:
                # ¼ étoile par jour si tous les objectifs sont atteints
                self.daily_stars_earned = Decimal('0.25')
            else:
                self.daily_stars_earned = Decimal('0.00')
        else:
            # Si pas d'objectifs définis, utiliser des objectifs par défaut
            default_target_subtasks = 2  # 2 sous-tâches par défaut
            default_target_hours = Decimal('8.00')  # 8 heures par défaut
            
            self.subtasks_goal_achieved = self.completed_subtasks >= default_target_subtasks
            self.hours_goal_achieved = self.worked_hours >= default_target_hours
            self.all_goals_achieved = self.subtasks_goal_achieved and self.hours_goal_achieved
            
            # Calculer les heures supplémentaires
            if self.worked_hours > default_target_hours:
                self.overtime_hours = self.worked_hours - default_target_hours
            else:
                self.overtime_hours = Decimal('0.00')
            
            # Attribution des étoiles même sans objectifs formels
            if self.all_goals_achieved:
                self.daily_stars_earned = Decimal('0.25')
            else:
                self.daily_stars_earned = Decimal('0.00')
        
        # Calcul des points bonus selon la méthode améliorée
        # Points pour sous-tâches accomplies (1 point par sous-tâche)
        subtask_points = self.completed_subtasks
        
        # Points pour heures supplémentaires (10 points par heure)
        overtime_points = int(self.overtime_hours * 10)
        
        self.bonus_points = subtask_points + overtime_points
        
        self.save()


class MonthlyPerformance(models.Model):
    """Performance mensuelle d'un employé"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='monthly_performances')
    year = models.IntegerField()
    month = models.IntegerField()
    
    # Statistiques mensuelles
    total_worked_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    total_overtime_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    total_completed_subtasks = models.IntegerField(default=0)
    days_with_all_goals = models.IntegerField(default=0)
    
    # Récompenses mensuelles
    regularity_stars = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    overtime_bonus_stars = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_monthly_stars = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    total_monthly_points = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['employee', 'year', 'month']
        ordering = ['-year', '-month']

    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.month}/{self.year} - {self.total_monthly_stars} étoiles"

    def calculate_monthly_performance(self):
        """Calculer la performance mensuelle selon la méthode de badging améliorée"""
        # Récupérer toutes les performances quotidiennes du mois
        daily_performances = DailyPerformance.objects.filter(
            employee=self.employee,
            date__year=self.year,
            date__month=self.month
        )
        
        # Calculer les totaux
        self.total_worked_hours = sum(dp.worked_hours for dp in daily_performances)
        self.total_overtime_hours = sum(dp.overtime_hours for dp in daily_performances)
        self.total_completed_subtasks = sum(dp.completed_subtasks for dp in daily_performances)
        self.days_with_all_goals = daily_performances.filter(all_goals_achieved=True).count()
        
        # Calculer les étoiles de régularité (¼ étoile par jour avec tous les objectifs atteints)
        # Ceci correspond aux étoiles quotidiennes déjà gagnées
        self.regularity_stars = Decimal(self.days_with_all_goals) * Decimal('0.25')
        
        # Bonus mensuel pour heures supplémentaires selon la méthode améliorée
        # ½ étoile si l'employé accumule plus de 32 heures supplémentaires dans le mois
        if self.total_overtime_hours > 32:
            self.overtime_bonus_stars = Decimal('0.50')
        else:
            self.overtime_bonus_stars = Decimal('0.00')
        
        # Total des étoiles mensuelles
        self.total_monthly_stars = self.regularity_stars + self.overtime_bonus_stars
        
        # Total des points mensuels (sous-tâches + heures supplémentaires)
        self.total_monthly_points = sum(dp.bonus_points for dp in daily_performances)
        
        self.save()


class Badge(models.Model):
    """Badges disponibles dans le système"""
    BADGE_TYPES = [
        ('performance', 'Performance'),
        ('regularity', 'Régularité'),
        ('overtime', 'Heures supplémentaires'),
        ('prestige', 'Prestige'),
        ('special', 'Spécial'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField()
    badge_type = models.CharField(max_length=20, choices=BADGE_TYPES)
    icon = models.CharField(max_length=50, help_text="Nom de l'icône (ex: star, trophy, medal)")
    color = models.CharField(max_length=7, default="#FFD700", help_text="Couleur hexadécimale")
    
    # Critères d'obtention
    required_stars = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    required_points = models.IntegerField(default=0)
    required_months = models.IntegerField(default=0, help_text="Nombre de mois de performance requis")
    
    # Récompenses
    salary_increase_percentage = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['required_stars', 'required_points']

    def __str__(self):
        return f"{self.name} - {self.required_stars} étoiles - {self.required_points} points"


class EmployeeBadge(models.Model):
    """Badges obtenus par les employés"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    earned_date = models.DateTimeField(auto_now_add=True)
    stars_at_earning = models.DecimalField(max_digits=5, decimal_places=2)
    points_at_earning = models.IntegerField()
    
    class Meta:
        unique_together = ['employee', 'badge']
        ordering = ['-earned_date']

    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.badge.name}"


class EmployeeStats(models.Model):
    """Statistiques globales d'un employé"""
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='gamification_stats')
    
    # Totaux généraux
    total_stars = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    total_points = models.IntegerField(default=0)
    total_badges = models.IntegerField(default=0)
    
    # Statistiques de performance
    total_completed_subtasks = models.IntegerField(default=0)
    total_worked_hours = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    total_overtime_hours = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    
    # Classement
    current_rank = models.IntegerField(default=0)
    current_level = models.CharField(max_length=50, default="Débutant")
    
    # Augmentations de salaire
    total_salary_increase = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.total_stars} étoiles - {self.total_points} points"

    def update_stats(self):
        """Mettre à jour les statistiques globales"""
        # Calculer les totaux à partir des performances quotidiennes directement
        daily_perfs = DailyPerformance.objects.filter(employee=self.employee)
        
        self.total_stars = sum(dp.daily_stars_earned for dp in daily_perfs)
        self.total_points = sum(dp.bonus_points for dp in daily_perfs)
        self.total_completed_subtasks = sum(dp.completed_subtasks for dp in daily_perfs)
        self.total_worked_hours = sum(dp.worked_hours for dp in daily_perfs)
        self.total_overtime_hours = sum(dp.overtime_hours for dp in daily_perfs)
        
        # Compter les badges
        self.total_badges = EmployeeBadge.objects.filter(employee=self.employee).count()
        
        # Calculer l'augmentation de salaire totale
        employee_badges = EmployeeBadge.objects.filter(employee=self.employee)
        self.total_salary_increase = sum(eb.badge.salary_increase_percentage for eb in employee_badges)
        
        # Déterminer le niveau
        if self.total_stars >= 50:
            self.current_level = "Expert"
        elif self.total_stars >= 20:
            self.current_level = "Avancé"
        elif self.total_stars >= 10:
            self.current_level = "Intermédiaire"
        else:
            self.current_level = "Débutant"
        
        self.save()

    def check_and_award_badges(self):
        """Vérifier et attribuer les nouveaux badges"""
        available_badges = Badge.objects.filter(is_active=True)
        
        for badge in available_badges:
            # Vérifier si l'employé a déjà ce badge
            if not EmployeeBadge.objects.filter(employee=self.employee, badge=badge).exists():
                # Vérifier les critères
                if (self.total_stars >= badge.required_stars and 
                    self.total_points >= badge.required_points):
                    
                    # Attribuer le badge
                    EmployeeBadge.objects.create(
                        employee=self.employee,
                        badge=badge,
                        stars_at_earning=self.total_stars,
                        points_at_earning=self.total_points
                    )
                    
                    self.total_badges += 1
                    self.save()
