#!/usr/bin/env python
import os
import sys
import django
from django.conf import settings
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'segus_engineering_Backend.settings')
django.setup()

from django.db import connection

def fix_migration():
    """Fix the problematic migration by marking it as applied and cleaning up database"""
    with connection.cursor() as cursor:
        try:
            print("🔧 Starting migration fix...")
            
            # First, drop problematic tables if they exist
            tables_to_drop = [
                'gamification_dailyachievement',
                'gamification_star', 
                'gamification_gamificationsetting'
            ]
            
            for table in tables_to_drop:
                try:
                    cursor.execute(f"DROP TABLE IF EXISTS {table}")
                    print(f"✅ Dropped table {table}")
                except Exception as e:
                    print(f"⚠️ Could not drop table {table}: {e}")
            
            # Check if the migration record exists
            cursor.execute(
                "SELECT COUNT(*) FROM django_migrations WHERE app = 'gamification' AND name = '0004_alter_dailyachievement_unique_together_and_more'"
            )
            count = cursor.fetchone()[0]
            
            if count == 0:
                # Insert the migration record to mark it as applied
                cursor.execute(
                    "INSERT INTO django_migrations (app, name, applied) VALUES (?, ?, ?)",
                    ('gamification', '0004_alter_dailyachievement_unique_together_and_more', datetime.now())
                )
                print("✅ Migration 0004 marked as applied")
            else:
                print("ℹ️ Migration 0004 already exists in database")
            
            # Also mark our fix migration as applied
            cursor.execute(
                "SELECT COUNT(*) FROM django_migrations WHERE app = 'gamification' AND name = '0005_fix_constraint_issue'"
            )
            count = cursor.fetchone()[0]
            
            if count == 0:
                cursor.execute(
                    "INSERT INTO django_migrations (app, name, applied) VALUES (?, ?, ?)",
                    ('gamification', '0005_fix_constraint_issue', datetime.now())
                )
                print("✅ Migration 0005 marked as applied")
            else:
                print("ℹ️ Migration 0005 already exists in database")
            
            print("🎉 Migration fix completed successfully!")
            print("🚀 You can now run 'python manage.py runserver' to start the server")
                
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    fix_migration()
