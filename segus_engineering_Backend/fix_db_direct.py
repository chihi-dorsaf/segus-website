#!/usr/bin/env python
import os
import sqlite3
from datetime import datetime

# Path to the SQLite database
db_path = "db.sqlite3"


def fix_database():
    """Fix the database directly using sqlite3"""
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("🔧 Starting database fix...")

        # Drop problematic tables if they exist
        tables_to_drop = [
            "gamification_dailyachievement",
            "gamification_star",
            "gamification_gamificationsetting",
        ]

        for table in tables_to_drop:
            try:
                cursor.execute(f"DROP TABLE IF EXISTS {table}")
                print(f"✅ Dropped table {table}")
            except Exception as e:
                print(f"⚠️ Could not drop table {table}: {e}")

        # Mark problematic migrations as applied
        migrations_to_mark = [
            "0004_alter_dailyachievement_unique_together_and_more",
            "0005_fix_constraint_issue",
        ]

        for migration in migrations_to_mark:
            # Check if migration already exists
            cursor.execute(
                "SELECT COUNT(*) FROM django_migrations WHERE app = 'gamification' AND name = ?",
                (migration,),
            )
            count = cursor.fetchone()[0]

            if count == 0:
                # Insert the migration record
                cursor.execute(
                    "INSERT INTO django_migrations (app, name, applied) VALUES (?, ?, ?)",
                    ("gamification", migration, datetime.now().isoformat()),
                )
                print(f"✅ Migration {migration} marked as applied")
            else:
                print(f"ℹ️ Migration {migration} already exists")

        # Commit changes
        conn.commit()
        conn.close()

        print("🎉 Database fix completed successfully!")
        print("🚀 You can now run 'python manage.py migrate' and then 'python manage.py runserver'")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    if os.path.exists(db_path):
        fix_database()
    else:
        print(f"❌ Database file {db_path} not found!")
