#!/usr/bin/env python
"""
Manual database fix for gamification app
Adds missing target_subtasks column to dailyobjective table
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'segus_engineering_Backend.settings')
django.setup()

from django.db import connection

def fix_gamification_database():
    """Fix the gamification database schema"""
    cursor = connection.cursor()
    
    try:
        # Check if target_subtasks column exists
        cursor.execute("PRAGMA table_info(gamification_dailyobjective)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'target_subtasks' not in columns:
            print("Adding missing target_subtasks column...")
            cursor.execute("""
                ALTER TABLE gamification_dailyobjective 
                ADD COLUMN target_subtasks INTEGER DEFAULT 0
            """)
            print("✓ Added target_subtasks column")
        else:
            print("✓ target_subtasks column already exists")
            
        # Check if target_hours column exists
        if 'target_hours' not in columns:
            print("Adding missing target_hours column...")
            cursor.execute("""
                ALTER TABLE gamification_dailyobjective 
                ADD COLUMN target_hours DECIMAL(4,2) DEFAULT 8.00
            """)
            print("✓ Added target_hours column")
        else:
            print("✓ target_hours column already exists")
            
        print("Database schema fixed successfully!")
        
    except Exception as e:
        print(f"Error fixing database: {e}")
        return False
        
    return True

if __name__ == "__main__":
    fix_gamification_database()
