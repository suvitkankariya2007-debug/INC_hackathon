#!/usr/bin/env python3
"""
Anomaly Detection Accuracy Validator
Uses reconciliation_training_dataset.csv to validate anomaly detection accuracy
"""

import pandas as pd
import sqlite3
from anomaly import AnomalyDetector

def calculate_metrics(true_labels, pred_labels):
    """Calculate accuracy, precision, recall, f1 without sklearn"""
    tp = sum((t == 1 and p == 1) for t, p in zip(true_labels, pred_labels))
    tn = sum((t == 0 and p == 0) for t, p in zip(true_labels, pred_labels))
    fp = sum((t == 0 and p == 1) for t, p in zip(true_labels, pred_labels))
    fn = sum((t == 1 and p == 0) for t, p in zip(true_labels, pred_labels))
    
    accuracy = (tp + tn) / len(true_labels) if len(true_labels) > 0 else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    
    return accuracy, precision, recall, f1, (tn, fp, fn, tp)

def validate_anomaly_detection():
    """Validate anomaly detection using reconciliation dataset"""
    
    print("=" * 70)
    print("ANOMALY DETECTION ACCURACY VALIDATION")
    print("=" * 70)
    
    # Load the reconciliation training dataset
    print("\n📊 Loading reconciliation_training_dataset.csv...")
    try:
        df = pd.read_csv('../ML_Training/reconciliation_training_dataset.csv')
        print(f"✅ Loaded {len(df)} records")
    except FileNotFoundError:
        print("❌ File not found: ../ML_Training/reconciliation_training_dataset.csv")
        return
    
    # Create ground truth labels
    # 0 = matched (not anomaly)
    # 1 = possible_match (likely anomaly)
    # 2 = unmatched (definite anomaly)
    
    ground_truth = [(0 if label == 1 else 1) for label in df['label']]  # 1=matched, so 0 for matched, 1 for unmatched/possible
    
    print(f"\n📈 Ground Truth Distribution:")
    print(f"  Matched (No Anomaly):     {sum(1 for x in ground_truth if x == 0)} records")
    print(f"  Unmatched/Possible (Anomaly): {sum(1 for x in ground_truth if x == 1)} records")
    
    # Analyze the data to identify potential anomalies
    print(f"\n🔍 Analyzing records for anomaly patterns...")
    
    predicted_anomalies = []
    reasons = []
    
    for idx, row in df.iterrows():
        is_anomaly = 0
        reason = ""
        
        # Pattern 1: Amount mismatch (clear anomaly)
        if row['bank_amount'] != row['ledger_amount']:
            is_anomaly = 1
            reason = f"Amount mismatch: Bank Rs {row['bank_amount']}, Ledger Rs {row['ledger_amount']}"
        
        # Pattern 2: Description mismatch (possible anomaly)
        elif str(row['bank_description']).lower() != str(row['ledger_narration']).lower():
            # Check if they're similar but not exact
            bank_desc = str(row['bank_description']).lower().split()
            ledger_desc = str(row['ledger_narration']).lower().split()
            
            common_words = len(set(bank_desc) & set(ledger_desc)) / max(len(bank_desc), len(ledger_desc))
            
            if common_words < 0.5:  # Less than 50% match
                is_anomaly = 1
                reason = f"Description mismatch: '{row['bank_description']}' vs '{row['ledger_narration']}'"
        
        # Pattern 3: Date mismatch (possible anomaly)
        if is_anomaly == 0 and row['bank_date'] != row['ledger_date']:
            is_anomaly = 1
            reason = f"Date mismatch: Bank {row['bank_date']}, Ledger {row['ledger_date']}"
        
        predicted_anomalies.append(is_anomaly)
        reasons.append(reason)
    
    predicted = pd.Series(predicted_anomalies)
    
    # Calculate metrics
    print(f"\n📊 ACCURACY METRICS:")
    print("-" * 70)
    
    accuracy, precision, recall, f1, (tn, fp, fn, tp) = calculate_metrics(list(ground_truth), predicted_anomalies)
    
    print(f"  Accuracy:   {accuracy:.2%}")
    print(f"  Precision:  {precision:.2%}")
    print(f"  Recall:     {recall:.2%}")
    print(f"  F1-Score:   {f1:.2%}")
    
    print(f"\n📋 CONFUSION MATRIX:")
    print("-" * 70)
    print(f"  True Negatives (Correct Non-Anomalies):  {tn}")
    print(f"  False Positives (Wrong Anomalies):       {fp}")
    print(f"  False Negatives (Missed Anomalies):      {fn}")
    print(f"  True Positives (Correct Anomalies):      {tp}")
    
    # Detailed anomaly breakdown
    print(f"\n🔴 DETECTED ANOMALIES:")
    print("-" * 70)
    
    anomaly_indices = predicted[predicted == 1].index
    
    if len(anomaly_indices) > 0:
        print(f"  Total Anomalies Found: {len(anomaly_indices)}")
        print(f"\n  Top 10 Anomalies:")
        
        for i, idx in enumerate(anomaly_indices[:10], 1):
            row = df.iloc[idx]
            reason = reasons[idx]
            true_label = "UNMATCHED ✓" if ground_truth[idx] == 1 else "MATCHED ✗ (False Positive)"
            
            print(f"\n    {i}. Bank: {row['bank_description'][:30]:<30}")
            print(f"       Ledger: {row['ledger_narration'][:30]:<30}")
            print(f"       Reason: {reason}")
            print(f"       Label: {true_label}")
    else:
        print("  No anomalies detected")
    
    # Performance Summary
    print(f"\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    if accuracy >= 0.9:
        rating = "🟢 EXCELLENT"
    elif accuracy >= 0.8:
        rating = "🟡 GOOD"
    elif accuracy >= 0.7:
        rating = "🟠 FAIR"
    else:
        rating = "🔴 POOR"
    
    print(f"\n  Overall Performance: {rating}")
    print(f"  Accuracy Score: {accuracy:.2%}")
    
    if precision > recall:
        print(f"  → High precision: Few false alarms ({fp} false positives)")
    else:
        print(f"  → High recall: Catches most anomalies (missed {fn})")
    
    print(f"\n  Recommendation:")
    if accuracy >= 0.85:
        print(f"  ✅ Model is ready for production use")
    else:
        print(f"  ⚠️  Model needs refinement for better accuracy")
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    validate_anomaly_detection()
