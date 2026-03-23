#!/usr/bin/env python3
"""Quick test of anomaly detection module"""

from anomaly import run_anomaly_detection
import sqlite3

# Get database stats
conn = sqlite3.connect('ledger.db')
cursor = conn.cursor()

cursor.execute('SELECT COUNT(*) FROM entities')
entity_count = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM transactions')
tx_count = cursor.fetchone()[0]

cursor.execute('SELECT name FROM entities')
entities = [row[0] for row in cursor.fetchall()]

conn.close()

print("=" * 60)
print("LedgerAI Anomaly Detection - Quick Test")
print("=" * 60)
print(f"\nDatabase Stats:")
print(f"  Entities Found: {entity_count}")
print(f"  Total Transactions: {tx_count}")

if entities:
    print(f"  Entity Names: {', '.join(entities)}")
    print()
    
    # Run detection on each entity
    for i, entity_name in enumerate(entities, 1):
        print(f"\n🔍 Running detection for Entity #{i}: {entity_name}")
        print("-" * 60)
        
        result = run_anomaly_detection(entity_id=i, apply=False)
        
        summary = result['summary']
        print(f"  Total Transactions: {summary['total_transactions']}")
        print(f"  Anomalies Found:    {result['count']}")
        print(f"  Anomaly %:          {summary['anomaly_percentage']:.1f}%")
        
        if result['by_type']:
            print(f"\n  Breakdown by Type:")
            for atype, items in result['by_type'].items():
                severity_breakdown = {}
                for anom in items:
                    sev = anom.get('severity', 'unknown')
                    severity_breakdown[sev] = severity_breakdown.get(sev, 0) + 1
                
                print(f"    • {atype:<15}: {len(items)} anomalies", end="")
                if severity_breakdown:
                    print(f" ({', '.join(f'{sev}: {cnt}' for sev, cnt in severity_breakdown.items())})", end="")
                print()
        
        # Show top 3 anomalies
        if result['anomalies']:
            print(f"\n  Top Anomalies:")
            sorted_anomalies = sorted(
                result['anomalies'],
                key=lambda x: x.get('sigma', float('-inf')) if x.get('sigma') else -100,
                reverse=True
            )
            for i, anom in enumerate(sorted_anomalies[:3], 1):
                reason_short = anom['reason'][:55] + "..." if len(anom['reason']) > 55 else anom['reason']
                print(f"    {i}. [TXN #{anom['transaction_id']}] {reason_short}")
else:
    print("\n⚠️  No entities found in database")
    print("Run seed scripts first: python seeds/seed_acme.py")

print("\n" + "=" * 60)
print("✅ Test Complete")
print("=" * 60)
