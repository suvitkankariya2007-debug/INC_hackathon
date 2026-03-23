# ==============================================================
# seed_with_anomaly_detection.py
# Owner: M2/M6 (Data Processing & Integration)
# Seeds transactions and automatically detects anomalies
# Run from: Database/ folder
# Command: python seeds/seed_with_anomaly_detection.py
# ==============================================================

import sqlite3
import sys
import os

# Add parent directory to path to import anomaly module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from anomaly import AnomalyDetector, run_anomaly_detection


def run_full_seeding_with_anomalies(db_path: str = "ledger.db"):
    """
    Complete seeding workflow:
    1. Initialize database
    2. Seed entities and transactions
    3. Run anomaly detection
    4. Generate report
    """
    print("""
╔════════════════════════════════════════════════════════════╗
║        LedgerAI - Full Seeding with Anomaly Detection     ║
╚════════════════════════════════════════════════════════════╝
    """)
    
    # Step 1: Check database exists
    if not os.path.exists(db_path):
        print(f"❌ Database {db_path} not found.")
        print("   Please run: sqlite3 ledger.db < schema.sql")
        return
    
    print("✅ Database found")
    
    # Step 2: Run entity and transaction seeds
    print("\n📝 Step 1: Seeding entities and baseline transactions...")
    import importlib.util
    
    # Import seed_acme
    spec = importlib.util.spec_from_file_location("seed_acme", "seeds/seed_acme.py")
    seed_acme = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(seed_acme)
    
    try:
        seed_acme.seed()
        print("✅ Acme Corp seeded (500 transactions)")
    except Exception as e:
        print(f"⚠️  Acme Corp seeding: {e}")
    
    # Import seed_smith
    spec = importlib.util.spec_from_file_location("seed_smith", "seeds/seed_smith.py")
    seed_smith = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(seed_smith)
    
    try:
        seed_smith.seed()
        print("✅ Smith and Sons seeded (400 transactions)")
    except Exception as e:
        print(f"⚠️  Smith and Sons seeding: {e}")
    
    # Step 3: Run anomaly detection for Acme
    print("\n🔍 Step 2: Running anomaly detection for Acme Corp...")
    result_acme = run_anomaly_detection(entity_id=1, db_path=db_path, apply=True)
    
    print_anomaly_report("Acme Corp", result_acme)
    
    # Step 4: Run anomaly detection for Smith
    print("\n🔍 Step 3: Running anomaly detection for Smith and Sons...")
    result_smith = run_anomaly_detection(entity_id=2, db_path=db_path, apply=True)
    
    print_anomaly_report("Smith and Sons", result_smith)
    
    # Step 5: Seed manual anomalies (for demo dashboard)
    print("\n📌 Step 4: Injecting manual anomalies for demo...")
    import importlib.util
    spec = importlib.util.spec_from_file_location("seed_anomalies", "seeds/seed_anomalies.py")
    seed_anomalies = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(seed_anomalies)
    
    try:
        seed_anomalies.seed()
        print("✅ Demo anomalies injected")
    except Exception as e:
        print(f"⚠️  Demo anomaly seeding: {e}")
    
    # Final summary
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE is_anomaly = 1")
    total_anomalies = cursor.fetchone()[0]
    
    cursor.execute("SELECT SUM(amount) FROM transactions WHERE is_anomaly = 1")
    total_amount = cursor.fetchone()[0] or 0
    
    conn.close()
    
    print(f"""
╔════════════════════════════════════════════════════════════╗
║                  SEEDING COMPLETE ✅                       ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Total Anomalies Flagged:  {total_anomalies:<34} ║
║  Total Anomaly Amount:     Rs {total_amount:>24,.0f} ║
║                                                            ║
║  Database is ready for:                                   ║
║    • Frontend dashboard                                   ║
║    • Anomaly detail panel                                 ║
║    • Transaction reconciliation workflows                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    """)


def print_anomaly_report(entity_name: str, result: dict):
    """Print formatted anomaly detection report."""
    summary = result['summary']
    
    print(f"\n  📊 {entity_name}:")
    print(f"     Total Transactions: {summary['total_transactions']}")
    print(f"     Anomalies Found:    {summary['anomaly_count']}")
    print(f"     Anomaly %:          {summary['anomaly_percentage']:.1f}%")
    print(f"     Anomaly Amount:     Rs {summary['anomaly_total_amount']:>12,.0f}")
    
    if result['by_type']:
        print(f"\n     By Type:")
        for atype, items in result['by_type'].items():
            print(f"       • {atype:<15}: {len(items):>3} items")
    
    # Show top 3 anomalies
    if result['anomalies']:
        print(f"\n     Top Anomalies:")
        sorted_anomalies = sorted(
            result['anomalies'],
            key=lambda x: x.get('sigma', 0) or 0,
            reverse=True
        )
        for i, anom in enumerate(sorted_anomalies[:3], 1):
            reason = anom['reason'][:50] + "..." if len(anom['reason']) > 50 else anom['reason']
            print(f"       {i}. {reason}")


if __name__ == "__main__":
    run_full_seeding_with_anomalies()
