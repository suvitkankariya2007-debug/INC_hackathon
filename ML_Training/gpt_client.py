import pickle
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv("../.env")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# -------------------------
# Load trained ML model
# -------------------------

vectorizer = pickle.load(open("tfidf_vectorizer.pkl", "rb"))
model = pickle.load(open("transaction_classifier.pkl", "rb"))




# -------------------------
# Classification Function
# -------------------------

def classify_transaction(description):

    # Convert text → TF-IDF vector
    vec = vectorizer.transform([description])

    # ML prediction
    prediction = model.predict(vec)[0]

    # Confidence score
    confidence = model.predict_proba(vec).max()

    print("ML Prediction:", prediction)
    print("Confidence:", confidence)


    # -------------------------
    # Fallback condition
    # -------------------------

    if confidence < 0.60:

        print("Low confidence → using OpenAI fallback")

        prompt = f"""
Classify the following accounting transaction.

Transaction: {description}

Possible categories:
Rent
Salary
IT Expense
Marketing
Utilities
Travel
Office Supplies

Return only the category name.
"""

        response = client.chat.completions.create( model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        prediction = response.choices[0].message.content.strip()

    return prediction


# -------------------------
# Test Example
# -------------------------


    if __name__ == "__main__":



        description = "Stripe payment processing fee"

    vec = vectorizer.transform([description])
    prediction = model.predict(vec)[0]
    confidence = model.predict_proba(vec).max()

    print("ML Prediction:", prediction)
    print("Confidence:", confidence)