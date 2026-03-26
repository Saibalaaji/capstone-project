"""
Acceptance Prediction Service
Uses a scikit-learn RandomForestClassifier to predict whether a volunteer
will accept a given task.  Falls back to heuristic scoring when there is
insufficient training data (< 10 samples).
"""
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import numpy as np
from datetime import datetime


class AcceptancePredictor:
    """ML-based acceptance probability prediction."""

    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=50, max_depth=5, random_state=42
        )
        self.scaler = StandardScaler()
        self._trained = False

        # Per-volunteer performance history  {volunteer_id: PerformanceHistory}
        self.history: dict[int, PerformanceHistory] = {}
        # Collected training samples
        self._X: list[list[float]] = []
        self._y: list[int] = []

    # ── public API ────────────────────────────────────────────────────
    def predict(self, volunteer: dict, request: dict) -> float:
        """Return acceptance probability in [0, 1]."""
        features = self._extract_features(volunteer, request)

        if self._trained:
            X = np.array([features])
            X_scaled = self.scaler.transform(X)
            proba = self.model.predict_proba(X_scaled)
            # probability of class 1 (accepted)
            accept_idx = list(self.model.classes_).index(1) if 1 in self.model.classes_ else 0
            return float(np.clip(proba[0][accept_idx], 0.05, 0.99))

        # ── heuristic fallback (matches Java behaviour) ──
        return self._heuristic_predict(volunteer, request)

    def update(self, volunteer_id: int, accepted: bool,
               response_time_minutes: float, request_type: str):
        """Record an observation and retrain when we have enough data."""
        hist = self.history.setdefault(volunteer_id, PerformanceHistory())
        hist.add(accepted, response_time_minutes, request_type)

        # Build a training sample from the updated history
        feature_vec = [
            hist.acceptance_rate(),
            hist.avg_response_time(),
            hist.total_tasks,
            1.0 if accepted else 0.0,  # urgency proxy
            hist.task_type_count(request_type) / max(hist.total_tasks, 1),
        ]
        self._X.append(feature_vec)
        self._y.append(1 if accepted else 0)

        if len(self._X) >= 10:
            self._retrain()

    def get_stats(self, volunteer_id: int) -> dict:
        """Return performance statistics for a volunteer."""
        hist = self.history.get(volunteer_id)
        if not hist:
            return {
                "totalTasks": 0, "acceptedTasks": 0,
                "acceptanceRate": 0.0, "averageResponseTime": 0.0,
                "modelTrained": self._trained,
            }
        return {
            "totalTasks": hist.total_tasks,
            "acceptedTasks": hist.accepted_tasks,
            "acceptanceRate": round(hist.acceptance_rate(), 3),
            "averageResponseTime": round(hist.avg_response_time(), 1),
            "modelTrained": self._trained,
        }

    # ── internal ──────────────────────────────────────────────────────
    def _extract_features(self, volunteer: dict, request: dict) -> list[float]:
        """Build a feature vector from volunteer + request data."""
        hist = self.history.get(volunteer.get("id", 0), PerformanceHistory())

        rating = volunteer.get("rating", 3.0)
        days = volunteer.get("availableDays", [])
        active = 1.0 if volunteer.get("active", True) else 0.0
        urgency_map = {"HIGH": 1.0, "MEDIUM": 0.5, "LOW": 0.2}
        urgency = urgency_map.get(request.get("urgencyLevel", "MEDIUM"), 0.5)

        # skill overlap
        vol_services = {s.lower() for s in volunteer.get("serviceType", [])}
        req_type = request.get("serviceType", "").lower()
        skill_match = 1.0 if req_type in vol_services else 0.0

        return [
            hist.acceptance_rate(),
            hist.avg_response_time(),
            len(days) / 7.0,
            rating / 5.0,
            active,
            urgency,
            skill_match,
        ]

    def _heuristic_predict(self, volunteer: dict, request: dict) -> float:
        """Simple heuristic matching the Java AcceptancePredictionService."""
        base = 0.65
        rating_bonus = (volunteer.get("rating", 3.0) / 5.0) * 0.20
        days = volunteer.get("availableDays", [])
        avail_bonus = 0.10 if len(days) > 3 else 0.0
        active_bonus = 0.05 if volunteer.get("active", True) else -0.30

        # deterministic jitter based on volunteer id
        vid = volunteer.get("id", 1)
        jitter = ((vid * 17 + 7) % 100 - 50) / 1000.0  # [-0.05, +0.05]

        return float(np.clip(base + rating_bonus + avail_bonus + active_bonus + jitter, 0.15, 0.98))

    def _retrain(self):
        """Retrain the model on all collected samples."""
        X = np.array(self._X)
        y = np.array(self._y)
        # Need at least two classes
        if len(set(y)) < 2:
            return
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self._trained = True


class PerformanceHistory:
    """Track per-volunteer performance."""

    def __init__(self):
        self.total_tasks = 0
        self.accepted_tasks = 0
        self.total_response_time = 0.0
        self.task_type_counts: dict[str, int] = {}
        self.last_task_time: datetime | None = None

    def add(self, accepted: bool, response_time: float, request_type: str):
        self.total_tasks += 1
        if accepted:
            self.accepted_tasks += 1
        self.total_response_time += response_time
        self.task_type_counts[request_type] = self.task_type_counts.get(request_type, 0) + 1
        self.last_task_time = datetime.utcnow()

    def acceptance_rate(self) -> float:
        return self.accepted_tasks / self.total_tasks if self.total_tasks else 0.7

    def avg_response_time(self) -> float:
        return self.total_response_time / self.total_tasks if self.total_tasks else 30.0

    def task_type_count(self, rtype: str) -> int:
        return self.task_type_counts.get(rtype, 0)


# ── module-level singleton ────────────────────────────────────────────
acceptance_predictor = AcceptancePredictor()
