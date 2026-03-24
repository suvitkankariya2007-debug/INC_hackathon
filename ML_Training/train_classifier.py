import pandas as pd
import pickle

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
df = pd.read_excel("LedgerAI_Training_Data_Enhanced.xlsx")

print("Dataset Loaded Successfully")
print(df.head())
X = df["description"]
y = df["category"]
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
vectorizer = TfidfVectorizer(stop_words="english")

X_train_vec = vectorizer.fit_transform(X_train)

X_test_vec = vectorizer.transform(X_test)
model = LogisticRegression(max_iter=1000)

model.fit(X_train_vec, y_train)
y_pred = model.predict(X_test_vec)

accuracy = accuracy_score(y_test, y_pred)

print("Model Accuracy:", accuracy)
test_transactions = [
    "AWS invoice payment",
    "Office rent February",
    "Salary to employee",
    "Google ads marketing payment"
]

test_vec = vectorizer.transform(test_transactions)

predictions = model.predict(test_vec)

for t, p in zip(test_transactions, predictions):

    print(t, "->", p)

pickle.dump(vectorizer, open("tfidf_vectorizer.pkl", "wb"))
pickle.dump(model, open("model.pkl", "wb"))

print("Model saved successfully")