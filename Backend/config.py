from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///" + str(BASE_DIR / "Database" / "ledger.db").replace("\\", "/")
    MODEL_PATH: str = str(BASE_DIR / "Backend" / "ml" / "model.pkl")
    VECTORIZER_PATH: str = str(BASE_DIR / "Backend" / "ml" / "tfidf_vectorizer.pkl")
    CONFIDENCE_THRESHOLD: float = 0.60

settings = Settings()