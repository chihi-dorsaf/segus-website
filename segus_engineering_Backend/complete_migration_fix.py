#!/usr/bin/env python
import sqlite3
import os
from datetime import datetime

def fix_migration_completely():
    """Complete fix for the migration issue"""
    db_path = 'db.sqlite3'
    
    if not os.path.exists(db_path):
        print("❌ Database file not found!")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔧 Starting complete migration fix...")
        
        # 1. Drop all problematic tables
        problematic_tables = [
            'gamification_dailyachievement',
            'gamification_star',
            'gamification_gamificationsetting'
        ]
        
        for table in problematic_tables:
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
            print(f"✅ Dropped table: {table}")
        
        # 2. Remove existing migration records for problematic migrations
        problematic_migrations = [
            '0004_alter_dailyachievement_unique_together_and_more',
            '0005_auto_20250901_2127',
            '0005_fix_constraint_issue'
        ]
        
        for migration in problematic_migrations:
            cursor.execute(
                "DELETE FROM django_migrations WHERE app = 'gamification' AND name = ?",
                (migration,)
            )
            print(f"🗑️ Removed migration record: {migration}")
        
        # 3. Mark the problematic migrations as applied
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')
        
        migrations_to_add = [
            '0004_alter_dailyachievement_unique_together_and_more',
            '0005_fix_constraint_issue'
        ]
        
        for migration in migrations_to_add:
            cursor.execute(
                "INSERT INTO django_migrations (app, name, applied) VALUES (?, ?, ?)",
                ('gamification', migration, now)
            )
            print(f"✅ Added migration record: {migration}")
        
        # 4. Commit all changes
        conn.commit()
        conn.close()
        
        print("🎉 Migration fix completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error during migration fix: {e}")
        return False

if __name__ == "__main__":
    success = fix_migration_completely()
    if success:
        print("\n🚀 Now try running: python manage.py migrate")
    else:
        print("\n❌ Migration fix failed. Please check the error messages above.")
