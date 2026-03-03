"""
AI / ML API — combines the Java AIController and EnhancedAIController endpoints.
"""
from flask import Blueprint, request as flask_request, jsonify
from models import db, AssistanceRequest, Volunteer
from ml.nlp_service import nlp_service
from ml.matching_engine import matching_engine
from ml.acceptance_predictor import acceptance_predictor
from ml.adaptive_learning import adaptive_engine

bp = Blueprint("ai", __name__, url_prefix="/api/ai")


# ── NLP: request interpretation ──────────────────────────────────────
@bp.route("/interpret_request", methods=["POST"])
def interpret_request():
    data = flask_request.get_json()
    description = data.get("description", "")
    if not description.strip():
        return jsonify({"error": "Description cannot be empty"}), 400

    interpretation = nlp_service.interpret_request(description)
    return jsonify(interpretation)


# ── Enhanced matching ────────────────────────────────────────────────
@bp.route("/enhanced/match_volunteers/<int:request_id>", methods=["GET"])
def enhanced_match(request_id):
    req = AssistanceRequest.query.get(request_id)
    if req:
        req_dict = req.to_dict()
    else:
        # Fallback sample request (matches Java behaviour)
        req_dict = {
            "id": request_id,
            "requesterName": "Sample Requester",
            "requesterContact": "555-0123",
            "location": "New York",
            "serviceType": "Food Delivery",
            "description": "Need food delivery for elderly person",
            "urgencyLevel": "MEDIUM",
            "status": "PENDING",
        }

    volunteers = Volunteer.query.filter_by(active=True).all()
    vol_dicts = [v.to_dict() for v in volunteers]
    matches = matching_engine.rank_volunteers(req_dict, vol_dicts, limit=5)
    return jsonify(matches)


# ── Performance update ───────────────────────────────────────────────
@bp.route("/enhanced/update_performance/<int:volunteer_id>", methods=["POST"])
def update_performance(volunteer_id):
    data = flask_request.get_json()
    task_completed = data.get("taskCompleted", False)
    performance_rating = float(data.get("performanceRating", 3.0))

    result = adaptive_engine.update_volunteer_reliability(
        volunteer_id, task_completed, performance_rating
    )

    # Also update acceptance predictor history
    acceptance_predictor.update(
        volunteer_id,
        accepted=task_completed,
        response_time_minutes=float(data.get("responseTimeMinutes", 30)),
        request_type=data.get("requestType", "General"),
    )

    return jsonify("Volunteer performance updated successfully")


# ── Weight adjustment ────────────────────────────────────────────────
@bp.route("/enhanced/adjust_weights", methods=["POST"])
def adjust_weights():
    data = flask_request.get_json()
    adaptive_engine.adjust_weights(
        assignment_successful=data.get("assignmentSuccessful", False),
        predicted_acceptance=float(data.get("predictedAcceptanceProbability", 0.5)),
        actual_match_score=float(data.get("actualMatchScore", 0.5)),
    )
    return jsonify("Matching weights adjusted successfully")


# ── Analytics ────────────────────────────────────────────────────────
@bp.route("/enhanced/analytics", methods=["GET"])
def analytics():
    return jsonify(adaptive_engine.get_analytics())


# ── Improve recommendations ─────────────────────────────────────────
@bp.route("/enhanced/improve_recommendations", methods=["POST"])
def improve_recommendations():
    adaptive_engine.improve_recommendations()
    return jsonify("Recommendation accuracy improvement initiated")
