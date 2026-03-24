import pickle
from pathlib import Path
from openai import OpenAI
from config import settings

MODEL_PATH = Path(settings.MODEL_PATH)
TFIDF_PATH = Path(settings.VECTORIZER_PATH)

model = None
vectorizer = None
openai_client = None

if settings.OPENAI_API_KEY:
    openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

_cache = {}

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
    if not description:
        return {"category": "Uncategorized", "confidence": 0.0}
        
    if description in _cache:
        return _cache[description]

    result = {"category": "Uncategorized", "confidence": 0.0}
    
    # 1. Try Local ML Model
    if model and vectorizer:
        try:
            vector = vectorizer.transform([description])
            proba = model.predict_proba(vector)[0]
            idx = proba.argmax()
            result = {
                "category": str(model.classes_[idx]),
                "confidence": float(proba[idx])
            }
        except Exception:
            pass
            
    # 2. Fallback to OpenAI if confidence is low
    if result["confidence"] < settings.CONFIDENCE_THRESHOLD and openai_client:
        try:
            prompt = (
                "Classify this accounting transaction into one of: Salary, Rent, Utilities, IT Expense, "
                "Office Supplies, Travel, Meals, Marketing, Professional Services, Insurance, Taxes, "
                "Equipment, Subscriptions, Maintenance, Miscellaneous.\n\n"
                f"Description: {description}\n\n"
                "Return ONLY the category name."
            )
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=20,
                temperature=0
            )
            category = response.choices[0].message.content.strip().split('\n')[0].replace('.', '')
            
            # Simple validation list
            valid_cats = {
                'Salary', 'Rent', 'Utilities', 'IT Expense', 'Office Supplies', 'Travel', 'Meals', 
                'Marketing', 'Professional Services', 'Insurance', 'Taxes', 'Equipment', 
                'Subscriptions', 'Maintenance', 'Miscellaneous'
            }
            
            if category in valid_cats:
                result = {"category": category, "confidence": 0.99}
        except Exception:
            pass
            
    _cache[description] = result
    return result

