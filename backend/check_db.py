# Direct PostgreSQL connection to check data
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    database="language_learning",
    user="postgres",
    password="tiger"
)

cursor = conn.cursor()

print("=== Users in Database ===")
cursor.execute("SELECT * FROM users")
users = cursor.fetchall()

# Get column names
cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")
columns = [col[0] for col in cursor.fetchall()]
print(f"Columns: {columns}\n")

for u in users:
    print(f"Data: {u}")
    print("-" * 30)

print(f"\nTotal users: {len(users)}")

cursor.close()
conn.close()
