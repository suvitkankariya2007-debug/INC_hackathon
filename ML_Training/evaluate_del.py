import pandas as pd
import pickle

from sklearn.metrics import classification_report, confusion_matrix
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
model = pickle.load(open("model.pkl", "rb"))


# -----------------------------
# Convert Text to Vectors
# -----------------------------

X_test_vec = vectorizer.transform(X_test)


# -----------------------------
# Predict Categories
# -----------------------------

y_pred = model.predict(X_test_vec)


# -----------------------------
# Evaluation Metrics
# -----------------------------

print("\nClassification Report\n")

print(classification_report(y_test, y_pred))


print("\nConfusion Matrix\n")

print(confusion_matrix(y_test, y_pred))