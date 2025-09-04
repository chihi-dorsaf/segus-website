#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'segus_engineering_Backend.settings')
django.setup()

from django.db import connection

def create_gamification_tables():
    cursor = connection.cursor()
    
    # Create EmployeeStats table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS gamification_employeestats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            total_stars DECIMAL(6,2) DEFAULT 0.00,
            total_points INTEGER DEFAULT 0,
            total_badges INTEGER DEFAULT 0,
            total_completed_subtasks INTEGER DEFAULT 0,
            total_worked_hours DECIMAL(8,2) DEFAULT 0.00,
            total_overtime_hours DECIMAL(8,2) DEFAULT 0.00,
            current_rank INTEGER DEFAULT 0,
            current_level VARCHAR(50) DEFAULT 'Débutant',
            total_salary_increase DECIMAL(5,2) DEFAULT 0.00,
            last_updated DATETIME,
            employee_id INTEGER UNIQUE REFERENCES employees_employee(id)
        )
    ''')
    
    # Create DailyObjective table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS gamification_dailyobjective (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date DATE DEFAULT CURRENT_DATE,
            target_subtasks INTEGER DEFAULT 0,
            target_hours DECIMAL(4,2) DEFAULT 8.00,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by_id INTEGER REFERENCES auth_user(id),
            employee_id INTEGER REFERENCES employees_employee(id),
            UNIQUE(employee_id, date)
        )
    ''')
    
    # Create SubTask table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS gamification_subtask (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR(200),
            description TEXT,
            status VARCHAR(20) DEFAULT 'pending',
            assigned_date DATE DEFAULT CURRENT_DATE,
            completed_date DATETIME,
            estimated_duration TEXT,
            actual_duration TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by_id INTEGER REFERENCES auth_user(id),
            employee_id INTEGER REFERENCES employees_employee(id)
        )
    ''')
    
    # Create DailyPerformance table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS gamification_dailyperformance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date DATE DEFAULT CURRENT_DATE,
            completed_subtasks INTEGER DEFAULT 0,
            worked_hours DECIMAL(4,2) DEFAULT 0.00,
            overtime_hours DECIMAL(4,2) DEFAULT 0.00,
            subtasks_goal_achieved BOOLEAN DEFAULT FALSE,
            hours_goal_achieved BOOLEAN DEFAULT FALSE,
            all_goals_achieved BOOLEAN DEFAULT FALSE,
            daily_stars_earned DECIMAL(3,2) DEFAULT 0.00,
            bonus_points INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            employee_id INTEGER REFERENCES employees_employee(id),
            objective_id INTEGER REFERENCES gamification_dailyobjective(id),
            UNIQUE(employee_id, date)
        )
    ''')
    
    # Create MonthlyPerformance table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS gamification_monthlyperformance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER,
            month INTEGER,
            total_worked_hours DECIMAL(6,2) DEFAULT 0.00,
            total_overtime_hours DECIMAL(6,2) DEFAULT 0.00,
            total_completed_subtasks INTEGER DEFAULT 0,
            days_with_all_goals INTEGER DEFAULT 0,
            regularity_stars DECIMAL(4,2) DEFAULT 0.00,
            overtime_bonus_stars DECIMAL(3,2) DEFAULT 0.00,
            total_monthly_stars DECIMAL(4,2) DEFAULT 0.00,
            total_monthly_points INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            employee_id INTEGER REFERENCES employees_employee(id),
            UNIQUE(employee_id, year, month)
        )
    ''')
    
    # Create EmployeeBadge table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS gamification_employeebadge (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            earned_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            stars_at_earning DECIMAL(5,2),
            points_at_earning INTEGER,
            badge_id INTEGER REFERENCES gamification_badge(id),
            employee_id INTEGER REFERENCES employees_employee(id),
            UNIQUE(employee_id, badge_id)
        )
    ''')
    
    print("All gamification tables created successfully!")
    
if __name__ == '__main__':
    create_gamification_tables()
