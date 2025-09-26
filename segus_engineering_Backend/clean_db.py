import os
import sqlite3


def clean_database():
    """Clean database migration state completely"""
    db_path = "db.sqlite3"

    if not os.path.exists(db_path):
        print("Database not found")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Remove ALL gamification migration records
        cursor.execute("DELETE FROM django_migrations WHERE app = 'gamification'")
        print("Removed gamification migration records")

        # Drop ALL gamification tables
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'gamification_%'"
        )
        tables = cursor.fetchall()

        for table in tables:
            cursor.execute(f"DROP TABLE IF EXISTS {table[0]}")
            print(f"Dropped table: {table[0]}")

        conn.commit()
        conn.close()

        print("Database cleaned successfully")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    clean_database()
