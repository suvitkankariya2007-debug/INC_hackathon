from datetime import datetime

def parse_date_flexible(date_str: str) -> datetime:
    """Try multiple date formats so CSV and DB dates always parse correctly."""
    if not date_str:
        raise ValueError("Empty date string")
        
    date_str = date_str.strip()
    # Try ISO first, then common CSV formats
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    raise ValueError(f"Cannot parse date: {date_str}")

def normalize_date_to_iso(date_str: str) -> str:
    """Converts any supported date string to YYYY-MM-DD."""
    return parse_date_flexible(date_str).strftime("%Y-%m-%d")
