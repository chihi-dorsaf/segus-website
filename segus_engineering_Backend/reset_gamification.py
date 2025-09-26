#!/usr/bin/env python
import os
import sqlite3


def reset_gamification_migrations():
    """Reset gamification migrations completely"""
    db_path = "db.sqlite3"

    if not os.path.exists(db_path):
        print("❌ Database file not found!")
        return False

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("🔧 Resetting gamification migrations...")

        # 1. Drop all gamification tables
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'gamification_%'"
        )
        tables = cursor.fetchall()

        for table in tables:
            table_name = table[0]
            cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
            print(f"✅ Dropped table: {table_name}")

        # 2. Remove all gamification migration records
        cursor.execute("DELETE FROM django_migrations WHERE app = 'gamification'")
        print("🗑️ Removed all gamification migration records")

        # 3. Commit changes
        conn.commit()
        conn.close()

        print("🎉 Gamification reset completed successfully!")
        return True

    except Exception as e:
        print(f"❌ Error during reset: {e}")
        return False


if __name__ == "__main__":
    success = reset_gamification_migrations()
    if success:
        print("\n🚀 Now run: python manage.py makemigrations gamification")
        print("🚀 Then run: python manage.py migrate gamification")
    else:
        print("\n❌ Reset failed. Please check the error messages above.")
