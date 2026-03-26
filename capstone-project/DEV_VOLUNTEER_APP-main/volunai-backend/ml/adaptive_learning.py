"""
Adaptive Learning Engine
Monitors assignment outcomes and adjusts matching weights using
gradient-descent-style optimisation so the system improves over time.
"""
import time
from ml.matching_engine import matching_engine
from ml.acceptance_predictor import acceptance_predictor


class AdaptiveLearningEngine:
    """Self-improving learning engine for the volunteer matching system."""

    LEARNING_RATE = 0.02

    def __init__(self):
        # Per-volunteer learning metrics  {volunteer_id: LearningMetrics}
        self.metrics: dict[int, LearningMetrics] = {}

        # Global outcome tracking
        self.total_assignments = 0
        self.successful_assignments = 0
        self.failed_assignments = 0
        self.weight_adjustment_count = 0
        self._started = time.time()

    # ── Volunteer reliability ────────────────────────────────────────
    def update_volunteer_reliability(self, volunteer_id: int,
                                     task_completed: bool,
                                     performance_rating: float) -> dict:
        """Adjust volunteer reliability score after a task outcome."""
        m = self.metrics.setdefault(volunteer_id, LearningMetrics())
        m.add(task_completed, performance_rating)

        # Compute updated score
        base_change = 0.1 if task_completed else -0.15
        rating_factor = (performance_rating - 3.0) / 5.0  # [-0.6, +0.4]
        consistency_bonus = self._consistency_bonus(m)
        delta = base_change + rating_factor + consistency_bonus

        return {
            "volunteerId": volunteer_id,
            "reliabilityDelta": round(delta, 4),
            "consistencyBonus": round(consistency_bonus, 4),
            "totalTasks": m.total_tasks,
            "completedTasks": m.completed_tasks,
            "avgPerformance": round(m.avg_performance(), 3),
        }

    # ── Weight adjustment (gradient-descent style) ───────────────────
    def adjust_weights(self, assignment_successful: bool,
                       predicted_acceptance: float,
                       actual_match_score: float):
        """Shift weights toward factors that correlate with success."""
        self.total_assignments += 1
        self.weight_adjustment_count += 1

        if assignment_successful:
            self.successful_assignments += 1
            self._reinforce_weights()
        else:
            self.failed_assignments += 1
            self._penalise_weights(predicted_acceptance, actual_match_score)

    # ── Recommendation improvement trigger ───────────────────────────
    def improve_recommendations(self):
        """Re-optimise weights using collected outcome data."""
        if self.total_assignments < 3:
            return  # not enough data

        success_rate = self.successful_assignments / max(self.total_assignments, 1)

        w = matching_engine.get_weights()

        if success_rate < 0.5:
            # Boost skill and performance weights
            w["skill"]        = min(w["skill"]        + self.LEARNING_RATE, 0.50)
            w["performance"]  = min(w["performance"]  + self.LEARNING_RATE, 0.35)
            w["acceptance"]   = max(w["acceptance"]   - self.LEARNING_RATE * 0.5, 0.05)
        elif success_rate > 0.8:
            # Fine-tune: slightly boost acceptance prediction importance
            w["acceptance"]   = min(w["acceptance"]   + self.LEARNING_RATE * 0.5, 0.25)

        # Normalise to sum = 1.0
        total = sum(w.values())
        for k in w:
            w[k] /= total

        matching_engine.update_weights(**w)

    # ── Analytics dashboard data ─────────────────────────────────────
    def get_analytics(self) -> dict:
        success_rate = (self.successful_assignments / self.total_assignments
                        if self.total_assignments else 0.0)

        avg_reliability_improvement = self._avg_reliability_improvement()
        uptime_hours = (time.time() - self._started) / 3600.0

        return {
            "totalAssignments":      self.total_assignments,
            "successfulAssignments": self.successful_assignments,
            "failedAssignments":     self.failed_assignments,
            "successRate":           round(success_rate, 4),
            "weightAdjustments":     self.weight_adjustment_count,
            "currentWeights":        matching_engine.get_weights(),
            "averageReliabilityImprovement": round(avg_reliability_improvement, 4),
            "modelUptimeHours":      round(uptime_hours, 2),
            "learningRate":          self.LEARNING_RATE,
            "totalVolunteersTracked": len(self.metrics),
            "mlModels": {
                "nlp":                "TF-IDF + Cosine Similarity (scikit-learn)",
                "matching":           "Multi-Factor Weighted Scoring with StandardScaler",
                "acceptancePrediction": "RandomForestClassifier (scikit-learn)",
                "adaptiveLearning":   "Gradient-Descent Weight Optimisation",
            },
        }

    # ── internal helpers ─────────────────────────────────────────────
    @staticmethod
    def _consistency_bonus(m) -> float:
        if m.total_tasks < 3:
            return 0.0
        rate = m.completed_tasks / m.total_tasks
        if rate >= 0.9:
            return 0.05
        if rate >= 0.7:
            return 0.02
        return -0.03

    def _reinforce_weights(self):
        """Slight nudge toward current weight distribution (it worked)."""
        w = matching_engine.get_weights()
        lr = self.LEARNING_RATE * 0.3   # gentle reinforcement
        w["skill"]       += lr
        w["performance"] += lr * 0.5
        total = sum(w.values())
        for k in w:
            w[k] /= total
        matching_engine.update_weights(**w)

    def _penalise_weights(self, predicted_acceptance, actual_score):
        """Shift weight away from the factor that over-predicted."""
        w = matching_engine.get_weights()
        lr = self.LEARNING_RATE

        if predicted_acceptance > 0.7 and actual_score < 0.4:
            # Acceptance prediction was over-confident
            w["acceptance"]  = max(w["acceptance"]  - lr, 0.05)
            w["skill"]       = min(w["skill"]       + lr * 0.5, 0.50)
        else:
            w["performance"] = min(w["performance"] + lr * 0.5, 0.35)
            w["location"]    = max(w["location"]    - lr * 0.3, 0.05)

        total = sum(w.values())
        for k in w:
            w[k] /= total
        matching_engine.update_weights(**w)

    def _avg_reliability_improvement(self) -> float:
        if not self.metrics:
            return 0.0
        improvements = []
        for m in self.metrics.values():
            if m.total_tasks >= 2:
                improvements.append(m.avg_performance() - 3.0)
        return sum(improvements) / len(improvements) if improvements else 0.0


class LearningMetrics:
    """Per-volunteer learning metrics."""

    def __init__(self):
        self.total_tasks = 0
        self.completed_tasks = 0
        self.total_performance = 0.0
        self.first_task_time = time.time()

    def add(self, completed: bool, rating: float):
        self.total_tasks += 1
        if completed:
            self.completed_tasks += 1
        self.total_performance += rating

    def avg_performance(self) -> float:
        return self.total_performance / self.total_tasks if self.total_tasks else 3.0


# ── module-level singleton ────────────────────────────────────────────
adaptive_engine = AdaptiveLearningEngine()
