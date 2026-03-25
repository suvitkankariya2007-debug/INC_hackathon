import sqlite3

conn = sqlite3.connect(r"C:\INC_hackathon\Database\ledger.db")
cur = conn.cursor()

print("=== reconcile_status distribution for entity 1 (Acme) ===")
cur.execute("""
    SELECT reconcile_status, COUNT(*) 
    FROM transactions 
    WHERE entity_id = 1 
    GROUP BY reconcile_status
""")
for row in cur.fetchall():
    print(row)

print("\n=== sample of matched transactions ===")
cur.execute("""
    SELECT id, description, reconcile_status 
    FROM transactions 
    WHERE entity_id = 1 AND reconcile_status = 'matched'
    LIMIT 10
""")
rows = cur.fetchall()
if rows:
    for row in rows:
        print(row)
else:
    print("NO matched transactions found in DB")

conn.close()