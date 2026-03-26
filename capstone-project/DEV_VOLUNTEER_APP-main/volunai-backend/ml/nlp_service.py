"""
NLP Request Understanding Service
Uses TF-IDF vectorization + cosine similarity from scikit-learn to
classify service requests and extract structured data.
"""
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# ── Corpus of service-type descriptions for TF-IDF matching ──
SERVICE_CORPUS = {
    "Food Delivery": "food grocery meal deliver hunger nutrition eat cooking breakfast lunch dinner",
    "Medical Assistance": "medical health doctor hospital medicine dialysis therapy clinic nurse prescription pharmacy",
    "Transportation": "transport ride drive pick up drop off commute travel vehicle car airport taxi",
    "Companionship": "companion visit talk lonely elderly senior friend social emotional support",
    "Shopping Assistance": "shopping errand store buy purchase goods market supplies",
    "Home Repair": "repair fix plumbing roof leak broken maintenance electrical paint handyman house",
    "Cleaning Services": "clean housekeeping sweep mop tidy sanitation wash organize household chores",
    "Childcare": "child babysit kids tutor homework daycare parenting toddler infant",
    "Pet Care": "pet dog cat animal vet walk grooming feeding shelter",
    "Technical Support": "technology computer phone internet tech software hardware troubleshoot setup digital",
}

URGENCY_KEYWORDS = {
    "HIGH":   ["urgent", "emergency", "immediate", "asap", "critical", "right now", "life-threatening", "severe"],
    "MEDIUM": ["soon", "today", "quickly", "prompt", "this week", "needed", "moderate", "important", "regular"],
    "LOW":    ["sometime", "when possible", "no rush", "flexible", "optional", "casual", "whenever", "light"],
}

SKILL_MAP = {
    r"medical|medicine|doctor|nurse|healthcare|pharmacy":    ["Medical Knowledge", "First Aid"],
    r"drive|car|vehicle|transport":                          ["Driving", "Valid License"],
    r"heavy|lift|carry|move|strength":                       ["Physical Strength", "Heavy Lifting"],
    r"computer|tech|software|internet":                      ["Technical Skills", "Computer Literacy"],
    r"child|kid|babysit|tutor":                              ["Childcare", "Teaching"],
    r"pet|animal|dog|cat":                                   ["Animal Care", "Pet Handling"],
    r"elderly|senior|care|compassion":                       ["Elder Care", "Patience", "Compassion"],
    r"language|speak|translate":                             ["Communication", "Language Skills"],
}

KNOWN_CITIES = [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
    "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose",
    "Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island",
    "San Francisco", "Seattle", "Boston", "Miami",
]


class NLPService:
    """scikit-learn TF-IDF based NLP service for request interpretation."""

    def __init__(self):
        # Build a TF-IDF model over our service corpus
        self.service_names = list(SERVICE_CORPUS.keys())
        self.corpus_texts  = list(SERVICE_CORPUS.values())
        self.vectorizer    = TfidfVectorizer(stop_words="english")
        self.corpus_matrix = self.vectorizer.fit_transform(self.corpus_texts)

    # ── public API ────────────────────────────────────────────────────
    def interpret_request(self, description: str) -> dict:
        """Return structured interpretation of a free-text request."""
        text = description.lower().strip()

        service_type, service_confidence = self._classify_service(text)
        urgency_level  = self._extract_urgency(text)
        required_skills = self._extract_skills(text)
        location       = self._extract_location(text)
        confidence     = self._calculate_confidence(
            service_type, service_confidence, urgency_level, required_skills, location
        )

        return {
            "serviceType":    service_type,
            "urgencyLevel":   urgency_level,
            "requiredSkills": required_skills,
            "location":       location,
            "confidence":     confidence,
            "originalText":   description,
            "nlpModel":       "TF-IDF + Cosine Similarity (scikit-learn)",
        }

    # ── TF-IDF classification ────────────────────────────────────────
    def _classify_service(self, text: str):
        """Use cosine similarity against the service corpus."""
        query_vec = self.vectorizer.transform([text])
        similarities = cosine_similarity(query_vec, self.corpus_matrix).flatten()
        best_idx = int(np.argmax(similarities))
        best_score = float(similarities[best_idx])

        if best_score < 0.05:
            return "General Assistance", 0.0
        return self.service_names[best_idx], best_score

    # ── keyword-based urgency ─────────────────────────────────────────
    @staticmethod
    def _extract_urgency(text: str) -> str:
        for level, keywords in URGENCY_KEYWORDS.items():
            if any(kw in text for kw in keywords):
                return level
        return "MEDIUM"

    # ── regex skill extraction ────────────────────────────────────────
    @staticmethod
    def _extract_skills(text: str) -> list:
        skills = set()
        for pattern, skill_list in SKILL_MAP.items():
            if re.search(pattern, text, re.IGNORECASE):
                skills.update(skill_list)
        return sorted(skills)

    # ── city name extraction ──────────────────────────────────────────
    @staticmethod
    def _extract_location(text: str) -> str | None:
        for city in KNOWN_CITIES:
            if city.lower() in text:
                return city
        # Try simple regex for "in <Place>" / "at <Place>"
        m = re.search(
            r"\b(?:in|at|near|around)\s+([A-Za-z][A-Za-z\s]{2,30}?)(?:\s+(?:street|st|avenue|ave|road|rd|boulevard|blvd)|\b)",
            text, re.IGNORECASE,
        )
        return m.group(1).strip().title() if m else None

    # ── confidence aggregation ────────────────────────────────────────
    @staticmethod
    def _calculate_confidence(service_type, service_conf, urgency, skills, location) -> str:
        score = 0
        total = 4
        if service_type != "General Assistance":
            score += 1
        if urgency != "MEDIUM":
            score += 1
        if skills:
            score += 1
        if location:
            score += 1

        # Boost with ML confidence
        ml_boost = min(service_conf, 1.0)
        ratio = (score / total) * 0.6 + ml_boost * 0.4

        if ratio >= 0.65:
            return "HIGH"
        if ratio >= 0.40:
            return "MEDIUM"
        return "LOW"


# ── module-level singleton ────────────────────────────────────────────
nlp_service = NLPService()
