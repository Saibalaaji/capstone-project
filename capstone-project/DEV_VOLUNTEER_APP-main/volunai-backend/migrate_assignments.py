import sqlite3
import os

db_path = os.path.join("instance", "volunai.db")
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Check what columns exist in assignments
c.execute("PRAGMA table_info(assignments)")
columns = [col[1] for col in c.fetchall()]
print(f"Existing columns in assignments: {columns}")

missing_columns = {
    "match_score": "FLOAT DEFAULT 0.0",
    "acceptance_probability": "FLOAT DEFAULT 0.0",
    "status": "VARCHAR(20) DEFAULT 'SUGGESTED'",
    "assigned_by": "VARCHAR(20) DEFAULT 'SYSTEM'",
    "assigned_at": "DATETIME DEFAULT CURRENT_TIMESTAMP",
    "completed_at": "DATETIME"
}

for col, dtype in missing_columns.items():
    if col not in columns:
        try:
            print(f"Adding '{col}' to assignments...")
            c.execute(f"ALTER TABLE assignments ADD COLUMN {col} {dtype}")
        except Exception as e:
            print(f"Error adding {col}: {e}")

conn.commit()
conn.close()
