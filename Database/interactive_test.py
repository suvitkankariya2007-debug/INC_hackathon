#!/usr/bin/env python3
"""
Interactive Anomaly Detection Test Tool
Allows you to test the anomaly detection model with your own inputs
"""

from anomaly import AnomalyDetector, run_anomaly_detection
import sqlite3

def show_menu():
    """Display main menu"""
    print("""
╔════════════════════════════════════════════════════════╗
║     ANOMALY DETECTION - INTERACTIVE TEST TOOL          ║
╚════════════════════════════════════════════════════════╝

Choose an option:
  1. List all entities
  2. Run anomaly detection on specific entity
  3. Show top anomalies
  4. Query transaction details
  5. Change detection sensitivity
  6. Exit

""")

def list_entities():
    """Show all entities in database"""
    conn = sqlite3.connect('ledger.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, name FROM entities')
    entities = cursor.fetchall()
    conn.close()
    
    print("\n📊 ENTITIES IN DATABASE:")
    print("-" * 50)
    if entities:
        for eid, name in entities:
            cursor = sqlite3.connect('ledger.db').cursor()
            cursor.execute('SELECT COUNT(*) FROM transactions WHERE entity_id = ?', (eid,))
            count = cursor.fetchone()[0]
            cursor.close()
            print(f"  ID: {eid} | Name: {name} | Transactions: {count}")
    else:
        print("  No entities found")
    print()

def run_detection():
    """Run detection on user-selected entity"""
    print("\n🔍 RUN ANOMALY DETECTION")
    print("-" * 50)
    
    # Get entity ID
    try:
        entity_id = int(input("Enter Entity ID: "))
    except ValueError:
        print("❌ Invalid input. Please enter a number.")
        return
    
    # Check if entity exists
    conn = sqlite3.connect('ledger.db')
    cursor = conn.cursor()
    cursor.execute('SELECT name FROM entities WHERE id = ?', (entity_id,))
    result = cursor.fetchone()
    conn.close()
    
    if not result:
        print(f"❌ Entity #{entity_id} not found!\n")
        return
    
    entity_name = result[0]
    
    print(f"\n⏳ Running detection for {entity_name}...")
    print("-" * 50)
    
    # Run detection
    result = run_anomaly_detection(entity_id=entity_id, apply=False)
    
    # Display results
    summary = result['summary']
    print(f"\n📈 RESULTS FOR {entity_name}:")
    print(f"  Total Transactions:   {summary['total_transactions']}")
    print(f"  Anomalies Found:      {result['count']}")
    print(f"  Anomaly Percentage:   {summary['anomaly_percentage']:.2f}%")
    print(f"  Total Anomaly Amount: Rs {summary['anomaly_total_amount']:,.2f}")
    print(f"  Categories:           {summary['categories']}")
    
    if result['by_type']:
        print(f"\n📋 BREAKDOWN BY TYPE:")
        for atype, items in result['by_type'].items():
            severity_count = {}
            for anom in items:
                sev = anom.get('severity', 'unknown')
                severity_count[sev] = severity_count.get(sev, 0) + 1
            
            sev_str = ", ".join([f"{sev}: {cnt}" for sev, cnt in severity_count.items()])
            print(f"  • {atype:<15} : {len(items):>3} items ({sev_str})")
    
    print()

def show_top_anomalies():
    """Show top anomalies by sigma value"""
    print("\n⭐ SHOW TOP ANOMALIES")
    print("-" * 50)
    
    try:
        entity_id = int(input("Enter Entity ID: "))
        limit = int(input("How many top anomalies to show? (default 5): ") or "5")
    except ValueError:
        print("❌ Invalid input.")
        return
    
    # Check if entity exists
    conn = sqlite3.connect('ledger.db')
    cursor = conn.cursor()
    cursor.execute('SELECT name FROM entities WHERE id = ?', (entity_id,))
    result = cursor.fetchone()
    conn.close()
    
    if not result:
        print(f"❌ Entity #{entity_id} not found!\n")
        return
    
    entity_name = result[0]
    
    # Get anomalies
    detector = AnomalyDetector('ledger.db')
    anomalies = detector.detect_all_anomalies(entity_id)
    
    if not anomalies:
        print(f"✅ No anomalies found for {entity_name}\n")
        return
    
    # Sort by sigma (highest first)
    sorted_anom = sorted(
        anomalies,
        key=lambda x: x.get('sigma', 0) if x.get('sigma') else -100,
        reverse=True
    )
    
    print(f"\n🔴 TOP {min(limit, len(sorted_anom))} ANOMALIES FOR {entity_name}:\n")
    
    for i, anom in enumerate(sorted_anom[:limit], 1):
        print(f"  {i}. Transaction #{anom['transaction_id']}")
        print(f"     Type:     {anom['anomaly_type']}")
        print(f"     Severity: {anom['severity']}")
        if anom.get('sigma'):
            print(f"     Sigma:    {anom['sigma']:.2f}")
        print(f"     Reason:   {anom['reason']}")
        print()

def query_transaction():
    """Query specific transaction details"""
    print("\n🔎 QUERY TRANSACTION")
    print("-" * 50)
    
    try:
        tx_id = int(input("Enter Transaction ID: "))
    except ValueError:
        print("❌ Invalid input.")
        return
    
    conn = sqlite3.connect('ledger.db')
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            t.id, t.description, t.amount, t.category, t.account_type,
            t.transaction_type, t.date, t.is_anomaly, t.anomaly_reason, e.name
        FROM transactions t
        JOIN entities e ON t.entity_id = e.id
        WHERE t.id = ?
    """, (tx_id,))
    
    result = cursor.fetchone()
    conn.close()
    
    if not result:
        print(f"❌ Transaction #{tx_id} not found!\n")
        return
    
    tid, desc, amount, cat, acc_type, tx_type, date, is_anom, reason, entity = result
    
    print(f"\n📄 TRANSACTION DETAILS (ID: {tid}):")
    print("-" * 50)
    print(f"  Entity:           {entity}")
    print(f"  Date:             {date}")
    print(f"  Description:      {desc}")
    print(f"  Amount:           Rs {amount:,.2f}")
    print(f"  Category:         {cat}")
    print(f"  Account Type:     {acc_type}")
    print(f"  Transaction Type: {tx_type}")
    print(f"  Is Anomaly:       {'🔴 YES' if is_anom else '✅ NO'}")
    if is_anom:
        print(f"  Reason:           {reason}")
    print()

def change_sensitivity():
    """Allow user to adjust detection sensitivity"""
    print("\n⚙️  CHANGE DETECTION SENSITIVITY")
    print("-" * 50)
    print("""
Current thresholds:
  • SIGMA_THRESHOLD = 3.0 (higher = less sensitive)
  • DUPLICATE_WINDOW_DAYS = 2 (days to find duplicates)

This is a READ-ONLY testing tool.
To change thresholds, edit anomaly.py:
  • Line 32: SIGMA_THRESHOLD = 3.0
  • Line 33: DUPLICATE_WINDOW_DAYS = 2
  
Then re-run test_anomaly_detection.py
""")
    print()

def main():
    """Main interactive loop"""
    while True:
        show_menu()
        choice = input("Enter choice (1-6): ").strip()
        
        if choice == '1':
            list_entities()
        elif choice == '2':
            run_detection()
        elif choice == '3':
            show_top_anomalies()
        elif choice == '4':
            query_transaction()
        elif choice == '5':
            change_sensitivity()
        elif choice == '6':
            print("\n👋 Goodbye!\n")
            break
        else:
            print("❌ Invalid choice. Please try again.\n")

if __name__ == "__main__":
    main()
