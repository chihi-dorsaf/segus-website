import sqlite3
from datetime import datetime


def mark_migration_as_applied():
    """Mark the problematic migration as applied without actually running it"""
    try:
        conn = sqlite3.connect("db.sqlite3")
        cursor = conn.cursor()

        # Mark the problematic migration as applied
        migration_name = "0004_alter_dailyachievement_unique_together_and_more"
        app_name = "gamification"
        applied_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")

        # Check if it already exists
        cursor.execute(
            "SELECT COUNT(*) FROM django_migrations WHERE app = ? AND name = ?",
            (app_name, migration_name),
        )

        if cursor.fetchone()[0] == 0:
            # Insert the migration record
            cursor.execute(
                "INSERT INTO django_migrations (app, name, applied) VALUES (?, ?, ?)",
                (app_name, migration_name, applied_time),
            )
            print(f"✅ Marked migration {migration_name} as applied")
        else:
            print(f"ℹ️ Migration {migration_name} already marked as applied")

        conn.commit()
        conn.close()

        print("🎉 Migration fix completed!")
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    success = mark_migration_as_applied()
    if success:
        print("🚀 Now try: python manage.py migrate")
    else:
        print("❌ Failed to fix migration")
