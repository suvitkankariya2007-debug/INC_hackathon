import pickle
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parent.parent / "ml" / "model.pkl"
TFIDF_PATH = Path(__file__).resolve().parent.parent / "ml" / "tfidf_vectorizer.pkl"

model = None
vectorizer = None

def init_classifier():
    global model, vectorizer
    try:
        if MODEL_PATH.exists() and TFIDF_PATH.exists():
            with open(MODEL_PATH, "rb") as f:
                model = pickle.load(f)
            with open(TFIDF_PATH, "rb") as f:
                vectorizer = pickle.load(f)
    except Exception:
        pass

def classify(description: str):
    if not model or not vectorizer:
        return {"category": "Uncategorized", "confidence": 0.0}
    try:
        vector = vectorizer.transform([description])
        proba = model.predict_proba(vector)[0]
        idx = proba.argmax()
        category = str(model.classes_[idx])
        confidence = float(proba[idx])
        return {"category": category, "confidence": confidence}
    except Exception:
        return {"category": "Uncategorized", "confidence": 0.0}
