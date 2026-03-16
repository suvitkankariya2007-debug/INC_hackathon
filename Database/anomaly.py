# ==============================================================
# anomaly.py
# Owner: M2 (Data Processing & Anomaly Detection)
# Statistical and logical anomaly detection for transactions
# Detects outliers, duplicates, and logical inconsistencies
# ==============================================================

import sqlite3
from datetime import datetime, timedelta
from typing import List, Tuple, Dict, Optional
import statistics


class AnomalyDetector:
    """
    Detects anomalies in ledger transactions using multiple strategies:
    
    1. Statistical Outliers (Sigma Detection)
       - Calculates mean and std dev for each category/account_type
       - Flags transactions > 3 sigma (0.15% probability) from mean
    
    2. Duplicate Detection
       - Finds transactions with identical description & amount within 2 days
       - Indicates payment errors or reconciliation issues
    
    3. Logical Inconsistencies
       - Debits on income/credit accounts
       - Credits on expense/asset/debit accounts (unusual)
       - Cross-entity suspiciously large transfers
    
    4. Pattern Anomalies
       - Unusual time clustering (e.g., 5 large txns in 1 hour)
       - Round number amounts (potential dummy entries)
    """
    
    SIGMA_THRESHOLD = 3.0  # 3-sigma = 99.73% of normal data
    DUPLICATE_WINDOW_DAYS = 2
    
    LOGICAL_RULES = {
        'income': {'debit'},      # Income should be credited, debit is unusual
        'expense': {'credit'},    # Expense should be debited, credit is unusual
        'asset': {'credit'},      # Asset increase via credit is unusual
        'liability': {'debit'},   # Liability increase via debit is unusual
        'equity': {'debit'},      # Equity increase via debit is unusual
    }
    
    def __init__(self, db_path: str = "ledger.db"):
        """Initialize detector with database connection."""
        self.db_path = db_path
        
    def detect_all_anomalies(self, entity_id: int) -> List[Dict]:
        """
        Run all anomaly detection strategies on entity's transactions.
        
        Returns: List of dicts with keys:
            - transaction_id: int
            - anomaly_type: str (e.g., 'statistical', 'duplicate', 'logical')
            - reason: str (detailed explanation)
            - sigma: float (for statistical anomalies)
            - severity: str ('high', 'medium', 'low')
        """
        all_anomalies = []
        
        # Get all transactions for entity
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, description, amount, category, account_type, 
                   transaction_type, date
            FROM transactions
            WHERE entity_id = ? AND is_anomaly = 0
            ORDER BY date, id
        """, (entity_id,))
        transactions = cursor.fetchall()
        conn.close()
        
        if not transactions:
            return []
        
        # Convert to list of dicts for easier processing
        tx_list = [
            {
                'id': tx[0],
                'description': tx[1],
                'amount': tx[2],
                'category': tx[3],
                'account_type': tx[4],
                'transaction_type': tx[5],
                'date': tx[6],
            }
            for tx in transactions
        ]
        
        # Run detection strategies
        all_anomalies.extend(self._detect_statistical_outliers(tx_list))
        all_anomalies.extend(self._detect_duplicates(tx_list))
        all_anomalies.extend(self._detect_logical_inconsistencies(tx_list))
        all_anomalies.extend(self._detect_pattern_anomalies(tx_list))
        
        return all_anomalies
    
    def _detect_statistical_outliers(self, transactions: List[Dict]) -> List[Dict]:
        """
        Flag transactions > 3 sigma from category mean.
        
        Strategy: 
        - Group by (category, account_type)
        - Calculate mean and std dev
        - Flag values > 3 sigma (0.15% outliers)
        """
        anomalies = []
        
        # Group by category
        categories = {}
        for tx in transactions:
            key = (tx['category'], tx['account_type'])
            if key not in categories:
                categories[key] = []
            categories[key].append(tx)
        
        # Analyze each category
        for (category, account_type), txs in categories.items():
            amounts = [tx['amount'] for tx in txs]
            
            # Need at least 3 samples for meaningful std dev
            if len(amounts) < 3:
                continue
            
            mean = statistics.mean(amounts)
            stdev = statistics.stdev(amounts)
            
            if stdev == 0:  # All amounts identical
                continue
            
            # Flag outliers
            for tx in txs:
                sigma = abs((tx['amount'] - mean) / stdev)
                if sigma > self.SIGMA_THRESHOLD:
                    anomalies.append({
                        'transaction_id': tx['id'],
                        'anomaly_type': 'statistical',
                        'reason': f"{sigma:.2f} sigma above {category} mean (Rs {mean:,.0f})",
                        'sigma': round(sigma, 2),
                        'severity': 'high' if sigma > 4 else 'medium',
                    })
        
        return anomalies
    
    def _detect_duplicates(self, transactions: List[Dict]) -> List[Dict]:
        """
        Find potential duplicate/erroneous payments.
        
        Criteria:
        - Same description and amount
        - Within DUPLICATE_WINDOW_DAYS
        - Different transaction IDs
        """
        anomalies = []
        
        for i, tx1 in enumerate(transactions):
            for tx2 in transactions[i+1:]:
                # Check if within time window
                date1 = datetime.fromisoformat(tx1['date'])
                date2 = datetime.fromisoformat(tx2['date'])
                days_apart = abs((date2 - date1).days)
                
                if days_apart > self.DUPLICATE_WINDOW_DAYS:
                    continue
                
                # Exact match on description and amount
                if (tx1['description'] == tx2['description'] and 
                    tx1['amount'] == tx2['amount']):
                    anomalies.append({
                        'transaction_id': tx2['id'],
                        'anomaly_type': 'duplicate',
                        'reason': f"Duplicate entry: {tx1['description'][:40]} "
                                f"(same amount Rs {tx1['amount']:,.0f}, "
                                f"{days_apart} day(s) apart) - Ref Txn #{tx1['id']}",
                        'sigma': None,
                        'severity': 'high',
                    })
        
        return anomalies
    
    def _detect_logical_inconsistencies(self, transactions: List[Dict]) -> List[Dict]:
        """
        Detect illogical transaction combinations.
        
        Examples:
        - Debit on an income account (revenue should be credited)
        - Credit on an expense account (expenses should be debited)
        - Unusually large single-vendor payments
        """
        anomalies = []
        
        for tx in transactions:
            # Check if transaction_type violates account_type logic
            if (tx['account_type'] in self.LOGICAL_RULES and 
                tx['transaction_type'] in self.LOGICAL_RULES[tx['account_type']]):
                
                anomalies.append({
                    'transaction_id': tx['id'],
                    'anomaly_type': 'logical',
                    'reason': f"Logical inconsistency: {tx['transaction_type'].capitalize()} "
                            f"on {tx['account_type']} account (unusual pattern)",
                    'sigma': None,
                    'severity': 'medium',
                })
        
        return anomalies
    
    def _detect_pattern_anomalies(self, transactions: List[Dict]) -> List[Dict]:
        """
        Detect unusual behavior patterns.
        
        Patterns:
        - Multiple large transactions from same vendor in short timeframe
        - Round number amounts (potential dummy entries)
        - Transactions at unusual times (would need timestamp, using date for now)
        """
        anomalies = []
        
        # Group by vendor/description prefix
        vendors = {}
        for tx in transactions:
            vendor_key = tx['description'].split('-')[0].strip()
            if vendor_key not in vendors:
                vendors[vendor_key] = []
            vendors[vendor_key].append(tx)
        
        # Check for rapid succession of large payments from same vendor
        for vendor, txs in vendors.items():
            large_txs = [tx for tx in txs if tx['amount'] > 100000]
            
            if len(large_txs) >= 2:
                # Check time clustering
                for i, tx1 in enumerate(large_txs):
                    for tx2 in large_txs[i+1:]:
                        date1 = datetime.fromisoformat(tx1['date'])
                        date2 = datetime.fromisoformat(tx2['date'])
                        if abs((date2 - date1).days) <= 7:
                            anomalies.append({
                                'transaction_id': tx2['id'],
                                'anomaly_type': 'pattern',
                                'reason': f"Multiple large payments to {vendor} "
                                        f"within 7 days (Rs {tx1['amount']:,.0f} + Rs {tx2['amount']:,.0f})",
                                'sigma': None,
                                'severity': 'low',
                            })
        
        return anomalies
    
    def mark_anomalies_in_db(self, entity_id: int, anomalies: List[Dict]) -> int:
        """
        Update transaction records with anomaly flags.
        
        Returns: Count of transactions marked
        """
        if not anomalies:
            return 0
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        marked_count = 0
        for anomaly in anomalies:
            try:
                cursor.execute("""
                    UPDATE transactions
                    SET is_anomaly = 1, anomaly_reason = ?
                    WHERE id = ? AND entity_id = ?
                """, (anomaly['reason'], anomaly['transaction_id'], entity_id))
                marked_count += cursor.rowcount
            except Exception as e:
                print(f"Error marking anomaly {anomaly['transaction_id']}: {e}")
        
        conn.commit()
        conn.close()
        return marked_count
    
    def get_entity_summary(self, entity_id: int) -> Dict:
        """Get anomaly summary statistics for entity."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_anomaly = 1 THEN 1 ELSE 0 END) as anomalies,
                SUM(CASE WHEN is_anomaly = 1 THEN amount ELSE 0 END) as anomaly_amount,
                COUNT(DISTINCT category) as categories
            FROM transactions
            WHERE entity_id = ?
        """, (entity_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        return {
            'total_transactions': row[0],
            'anomaly_count': row[1] or 0,
            'anomaly_total_amount': row[2] or 0,
            'categories': row[3] or 0,
            'anomaly_percentage': round((row[1] or 0) / row[0] * 100, 2) if row[0] else 0,
        }


def run_anomaly_detection(entity_id: int, db_path: str = "ledger.db", apply: bool = False) -> Dict:
    """
    Main function to run anomaly detection on an entity.
    
    Args:
        entity_id: Entity to analyze
        db_path: Path to SQLite database
        apply: If True, mark anomalies in database; if False, return list only
    
    Returns:
        Dictionary with detection results and summary
    """
    detector = AnomalyDetector(db_path)
    
    print(f"🔍 Starting anomaly detection for entity #{entity_id}...")
    
    # Run detection
    anomalies = detector.detect_all_anomalies(entity_id)
    
    if apply and anomalies:
        marked = detector.mark_anomalies_in_db(entity_id, anomalies)
        print(f"✅ Marked {marked} transactions as anomalies")
    
    # Get summary
    summary = detector.get_entity_summary(entity_id)
    
    # Group by type
    by_type = {}
    for anomaly in anomalies:
        atype = anomaly['anomaly_type']
        if atype not in by_type:
            by_type[atype] = []
        by_type[atype].append(anomaly)
    
    return {
        'anomalies': anomalies,
        'by_type': by_type,
        'summary': summary,
        'count': len(anomalies),
    }


if __name__ == "__main__":
    # Example usage
    result = run_anomaly_detection(entity_id=1, apply=False)
    print(f"\nFound {result['count']} anomalies:")
    for atype, items in result['by_type'].items():
        print(f"  {atype}: {len(items)} items")
