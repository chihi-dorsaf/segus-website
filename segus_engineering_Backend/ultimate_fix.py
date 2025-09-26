import os
import shutil
import sqlite3


def ultimate_migration_fix():
    """Ultimate fix for the migration issue"""
    db_path = "db.sqlite3"

    try:
        # Backup the database first
        if os.path.exists(db_path):
            shutil.copy2(db_path, f"{db_path}.backup")
            print("✅ Database backed up")

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Get all gamification tables
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'gamification_%'"
        )
        tables = [row[0] for row in cursor.fetchall()]

        # Drop all gamification tables
        for table in tables:
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
            print(f"✅ Dropped table: {table}")

        # Clear all gamification migration records
        cursor.execute("DELETE FROM django_migrations WHERE app = 'gamification'")
        print("✅ Cleared all gamification migration records")

        conn.commit()
        conn.close()

        print("🎉 Ultimate fix completed!")
        print("🚀 Now run: python manage.py makemigrations gamification")
        print("🚀 Then run: python manage.py migrate gamification")

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    ultimate_migration_fix()
