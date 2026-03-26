"""
Volunteer Matching Engine
Uses scikit-learn StandardScaler for feature normalisation and a weighted
multi-factor scoring model to rank volunteers for a given request.
"""
from sklearn.preprocessing import StandardScaler
import numpy as np
import math
from ml.acceptance_predictor import acceptance_predictor


class MatchingEngine:
    """Multi-factor volunteer matching with ML-powered scoring."""

    def __init__(self):
        self.scaler = StandardScaler()
        # Default weights
        self.weights = {
            "availability":   0.30,
            "location":       0.20,
            "skill":          0.25,
            "performance":    0.25,
            "acceptance":     0.00, # Handled indirectly now
        }

    def update_weights(self, availability, location, skill, performance, acceptance):
        """Called by the adaptive learning engine to adjust weights."""
        self.weights = {
            "availability": availability,
            "location":     location,
            "skill":        skill,
            "performance":  performance,
            "acceptance":   acceptance,
        }

    def get_weights(self) -> dict:
        return dict(self.weights)

    # ── public entry point ────────────────────────────────────────────
    def rank_volunteers(self, request: dict, volunteers: list[dict], limit: int = 5) -> list[dict]:
        """Return top-*limit* volunteer matches with scoring breakdown."""
        if not volunteers:
            return []

        scored = []
        for vol in volunteers:
            if not vol.get("active", True):
                scored.append(self._zero_match(vol, "Volunteer is inactive"))
                continue
            if vol.get("availabilityStatus", "AVAILABLE") == "BUSY":
                scored.append(self._zero_match(vol, "Volunteer is currently BUSY"))
                continue
            match = self._compute_match(request, vol)
            scored.append(match)

        # Sort descending by total score
        scored.sort(key=lambda m: m["matchScore"], reverse=True)
        return scored[:limit]


    # ── individual match computation ──────────────────────────────────
    def _compute_match(self, request: dict, volunteer: dict) -> dict:
        # CRITICAL FIX: The Short-Circuit
        # If the volunteer is busy, bypass all heavy ML calculations and return 0 instantly.
        if volunteer.get("availabilityStatus", "AVAILABLE") == "BUSY":
            return self._zero_match(volunteer, "Volunteer is currently BUSY")
            
        avail_score  = self._availability_score(request, volunteer)
        prox_score   = self._proximity_score(request, volunteer)
        skill_score  = self._skill_match_score(request, volunteer)
        rel_score    = self._reliability_score(volunteer)
        accept_prob  = acceptance_predictor.predict(volunteer, request)

        # Weighted sum
        total = (
            self.weights["availability"] * avail_score +
            self.weights["location"]     * prox_score +
            self.weights["skill"]        * skill_score +
            self.weights["performance"]  * rel_score
        )

        explanation = self._build_explanation(
            avail_score, prox_score, skill_score, rel_score, accept_prob
        )

        return {
            "volunteerId":           volunteer["id"],
            "volunteerName":         volunteer.get("name", ""),
            "volunteerLocation":     volunteer.get("location", ""),
            "volunteerServiceTypes": volunteer.get("serviceType", []),
            "volunteerRating":       volunteer.get("rating", 0.0),
            "matchScore":            round(total, 4),
            "acceptanceProbability": round(accept_prob, 4),
            "scoreBreakdown": {
                "availabilityScore":  round(avail_score, 4),
                "proximityScore":     round(prox_score, 4),
                "skillMatchScore":    round(skill_score, 4),
                "reliabilityScore":   round(rel_score, 4),
                "acceptanceProbability": round(accept_prob, 4),
                "weights": {k: round(v, 4) for k, v in self.weights.items()},
            },
            "explanation": explanation,
        }

    # ── factor calculations ───────────────────────────────────────────
    @staticmethod
    def _availability_score(request: dict, volunteer: dict) -> float:
        days = volunteer.get("availableDays", [])
        if not days:
            return 0.0
        if "Flexible" in days:
            return 1.0
        # Higher score for more available days
        day_score = min(len(days) / 5.0, 1.0)
        # Bonus if urgency is high and volunteer has weekend/evening
        if request.get("urgencyLevel") == "HIGH":
            if any(d in days for d in ["Weekend", "Evening", "Saturday", "Sunday"]):
                day_score = min(day_score + 0.15, 1.0)
        return day_score

    @staticmethod
    def _proximity_score(request: dict, volunteer: dict) -> float:
        # 1. Coordinate-based exact calculation (Haversine)
        if "latitude" in request and "longitude" in request and \
           volunteer.get("latitude") and volunteer.get("longitude"):
            
            lat1, lon1 = request["latitude"], request["longitude"]
            lat2, lon2 = volunteer["latitude"], volunteer["longitude"]
            
            # Haversine formula
            R = 3958.8 # Earth radius in miles
            dlat = math.radians(lat2 - lat1)
            dlon = math.radians(lon2 - lon1)
            a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
            c = 2 * math.asin(math.sqrt(a))
            dist_miles = R * c
            
            # Score: 1.0 for < 1 mile, drops linearly to 0.0 at 20 miles
            if dist_miles <= 1.0: return 1.0
            if dist_miles >= 20.0: return 0.0
            return 1.0 - (dist_miles - 1.0) / 19.0

        # 2. Fallback: string-based matching
        req_loc = (request.get("location") or "").lower().strip()
        vol_loc = (volunteer.get("location") or "").lower().strip()
        if not req_loc or not vol_loc:
            return 0.0
        if req_loc == vol_loc:
            return 1.0
        # Partial match — borough / city overlap
        nyc_areas = {"new york", "manhattan", "brooklyn", "queens", "bronx", "staten island"}
        if req_loc in nyc_areas and vol_loc in nyc_areas:
            return 0.6
        if req_loc in vol_loc or vol_loc in req_loc:
            return 0.5
        return 0.0

    @staticmethod
    def _skill_match_score(request: dict, volunteer: dict) -> float:
        req_type = (request.get("serviceType") or "").lower()
        vol_types = [s.lower() for s in volunteer.get("serviceType", [])]
        if not vol_types or not req_type:
            return 0.0
        if req_type in vol_types:
            return 1.0
        # Partial match
        for vt in vol_types:
            if req_type in vt or vt in req_type:
                return 0.6
        return 0.0

    @staticmethod
    def _reliability_score(volunteer: dict) -> float:
        return min(volunteer.get("rating", 0.0) / 5.0, 1.0)

    # ── explanation builder ───────────────────────────────────────────
    def _build_explanation(self, avail, prox, skill, rel, accept) -> str:
        parts = []
        if skill >= 0.8:
            parts.append("Strong skill match with required service type")
        elif skill >= 0.4:
            parts.append("Partial skill match with service type")
        else:
            parts.append("Limited skill alignment")

        if prox >= 0.8:
            parts.append("excellent location proximity")
        elif prox >= 0.4:
            parts.append("moderate location proximity")
        else:
            parts.append("distant location")

        if avail >= 0.7:
            parts.append("high availability")
        elif avail >= 0.4:
            parts.append("moderate availability")
        else:
            parts.append("limited availability")

        if rel >= 0.8:
            parts.append("excellent reliability track record")
        elif rel >= 0.6:
            parts.append("good reliability")
        else:
            parts.append("developing reliability")

        if accept >= 0.7:
            parts.append(f"high predicted acceptance ({accept:.0%})")
        else:
            parts.append(f"moderate predicted acceptance ({accept:.0%})")

        return ". ".join(parts) + "."

    @staticmethod
    def _zero_match(volunteer: dict, reason: str) -> dict:
        return {
            "volunteerId":           volunteer["id"],
            "volunteerName":         volunteer.get("name", ""),
            "volunteerLocation":     volunteer.get("location", ""),
            "volunteerServiceTypes": volunteer.get("serviceType", []),
            "volunteerRating":       volunteer.get("rating", 0.0),
            "matchScore":            0.0,
            "acceptanceProbability": 0.0,
            "scoreBreakdown":        {},
            "explanation":           reason,
        }


# ── module-level singleton ────────────────────────────────────────────
matching_engine = MatchingEngine()
