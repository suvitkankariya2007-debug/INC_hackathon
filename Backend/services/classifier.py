import pickle
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
ML_DIR = BASE_DIR / "ml"
MODEL_PATH = ML_DIR / "model.pkl"
TFIDF_PATH = ML_DIR / "tfidf_vectorizer.pkl"

model = None
vectorizer = None

def init_classifier():
    global model, vectorizer
    if MODEL_PATH.exists() and TFIDF_PATH.exists():
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
        with open(TFIDF_PATH, "rb") as f:
            vectorizer = pickle.load(f)

def classify(description: str):
    if not model or not vectorizer:
        return {"ai_category": "Uncategorized", "ai_confidence": 0.0}
    try:
        vector = vectorizer.transform([description])
        proba_list = model.predict_proba(vector)[0]
        max_idx = proba_list.argmax()
        confidence = float(proba_list[max_idx])
        category = str(model.classes_[max_idx])
        return {"ai_category": category, "ai_confidence": confidence}
    except Exception:
        return {"ai_category": "Uncategorized", "ai_confidence": 0.0}
