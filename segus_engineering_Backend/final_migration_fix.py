import sqlite3
import os

# Direct database manipulation to fix migration issue
db_path = 'db.sqlite3'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Drop all gamification tables
    cursor.execute("DROP TABLE IF EXISTS gamification_dailyachievement")
    cursor.execute("DROP TABLE IF EXISTS gamification_star")
    cursor.execute("DROP TABLE IF EXISTS gamification_gamificationsetting")
    cursor.execute("DROP TABLE IF EXISTS gamification_dailyobjective")
    cursor.execute("DROP TABLE IF EXISTS gamification_dailyperformance")
    cursor.execute("DROP TABLE IF EXISTS gamification_monthlyperformance")
    cursor.execute("DROP TABLE IF EXISTS gamification_badge")
    cursor.execute("DROP TABLE IF EXISTS gamification_employeebadge")
    cursor.execute("DROP TABLE IF EXISTS gamification_employeestats")
    cursor.execute("DROP TABLE IF EXISTS gamification_subtask")
    
    # Remove all gamification migration records
    cursor.execute("DELETE FROM django_migrations WHERE app = 'gamification'")
    
    conn.commit()
    conn.close()
    
    print("Database cleaned successfully")
    
except Exception as e:
    print(f"Error: {e}")
