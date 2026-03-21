import pandas as pd
import pickle

from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
)
from sklearn.model_selection import train_test_split


# -----------------------------
# Load Dataset
# -----------------------------

df = pd.read_excel("LedgerAI_Training_Data_Enhanced.xlsx")

print("Dataset Loaded")
print(df.head())


# -----------------------------
# Define Input and Output
# -----------------------------

X = df["description"]
y = df["category"]


# -----------------------------
# Split Dataset
# -----------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)


# -----------------------------
# Load Trained Model
# -----------------------------

vectorizer = pickle.load(open("tfidf_vectorizer.pkl", "rb"))
model = pickle.load(open("transaction_classifier.pkl", "rb"))


# -----------------------------
# Convert Text to Vectors
# -----------------------------

X_test_vec = vectorizer.transform(X_test)


# -----------------------------
# Predict Categories
# -----------------------------

y_pred = model.predict(X_test_vec)


# -----------------------------
# Confusion Matrix (printed first so it scrolls up)
# -----------------------------

labels = sorted(y_test.unique())
cm = confusion_matrix(y_test, y_pred, labels=labels)

print("\n" + "=" * 50)
print("           CONFUSION MATRIX")
print("=" * 50 + "\n")

# Print header
print(f"{'Actual \\ Predicted':<25}", end="")
for label in labels:
    print(f"{label[:8]:>10}", end="")
print()
print("-" * (25 + 10 * len(labels)))

# Print rows
for i, label in enumerate(labels):
    print(f"{label:<25}", end="")
    for j in range(len(labels)):
        print(f"{cm[i][j]:>10}", end="")
    print()


# -----------------------------
# Per-Class Classification Report
# -----------------------------

print("\n\n" + "=" * 50)
print("     PER-CLASS CLASSIFICATION REPORT")
print("=" * 50 + "\n")
print(classification_report(y_test, y_pred, zero_division=0))


# -----------------------------
# Overall Metrics (printed last so always visible)
# -----------------------------

accuracy = accuracy_score(y_test, y_pred)
precision_macro = precision_score(y_test, y_pred, average="macro", zero_division=0)
recall_macro = recall_score(y_test, y_pred, average="macro", zero_division=0)
f1_macro = f1_score(y_test, y_pred, average="macro", zero_division=0)

precision_weighted = precision_score(y_test, y_pred, average="weighted", zero_division=0)
recall_weighted = recall_score(y_test, y_pred, average="weighted", zero_division=0)
f1_weighted = f1_score(y_test, y_pred, average="weighted", zero_division=0)

print("=" * 50)
print("         OVERALL MODEL PERFORMANCE")
print("=" * 50)
print(f"  Accuracy          : {accuracy:.4f}")
print(f"  Precision (macro) : {precision_macro:.4f}")
print(f"  Recall    (macro) : {recall_macro:.4f}")
print(f"  F1 Score  (macro) : {f1_macro:.4f}")
print("-" * 50)
print(f"  Precision (weighted) : {precision_weighted:.4f}")
print(f"  Recall    (weighted) : {recall_weighted:.4f}")
print(f"  F1 Score  (weighted) : {f1_weighted:.4f}")
print("=" * 50)