"""
Assignment API — handles the lifecycle of a volunteer being assigned to a request.

FIX BUG-01: Added @jwt_required() to ALL routes — previously every endpoint was
            completely unauthenticated, allowing anyone to accept/decline/complete.
FIX BUG-10: Changed volunteer status from "ASSIGNED" (invalid) to "BUSY" on accept.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required  # FIX BUG-01: import JWT
from models import db, Volunteer, AssistanceRequest, Assignment
from datetime import datetime

bp = Blueprint("assignments", __name__, url_prefix="/api/assignments")


@bp.route("", methods=["GET"])
@jwt_required()  # FIX BUG-01: require authentication
def get_all_assignments():
    assignments = Assignment.query.all()
    return jsonify([a.to_dict() for a in assignments])


@bp.route("/volunteer/<int:vid>", methods=["GET"])
@jwt_required()  # FIX BUG-01: require authentication
def get_volunteer_assignments(vid):
    assignments = Assignment.query.filter_by(volunteer_id=vid).order_by(Assignment.timestamp.desc()).all()
    return jsonify([a.to_dict() for a in assignments])


@bp.route("/<int:aid>/accept", methods=["PATCH"])
@jwt_required()  # FIX BUG-01: require authentication
def accept_assignment(aid):
    a = Assignment.query.get_or_404(aid)
    r = AssistanceRequest.query.get_or_404(a.request_id)
    v = Volunteer.query.get_or_404(a.volunteer_id)

    a.status = "ACCEPTED"
    r.status = "ASSIGNED"
    # FIX BUG-10: was "ASSIGNED" (not a valid status) — changed to "BUSY"
    v.availability_status = "BUSY"

    db.session.commit()
    return jsonify(a.to_dict())


@bp.route("/<int:aid>/decline", methods=["PATCH"])
@jwt_required()  # FIX BUG-01: require authentication
def decline_assignment(aid):
    a = Assignment.query.get_or_404(aid)
    r = AssistanceRequest.query.get_or_404(a.request_id)
    v = Volunteer.query.get_or_404(a.volunteer_id)

    a.status = "DECLINED"
    r.status = "PENDING"
    r.assigned_volunteer_id = None
    v.availability_status = "AVAILABLE"

    # Update volunteer acceptance rate
    total_assignments = Assignment.query.filter_by(volunteer_id=v.id).count()
    accepted = Assignment.query.filter_by(volunteer_id=v.id, status="ACCEPTED").count()
    completed = Assignment.query.filter_by(volunteer_id=v.id, status="COMPLETED").count()
    v.acceptance_rate = (accepted + completed) / max(total_assignments, 1)

    db.session.commit()
    return jsonify(a.to_dict())


@bp.route("/<int:aid>/complete", methods=["PATCH"])
@jwt_required()  # FIX BUG-01: require authentication
def complete_assignment(aid):
    a = Assignment.query.get_or_404(aid)
    r = AssistanceRequest.query.get_or_404(a.request_id)
    v = Volunteer.query.get_or_404(a.volunteer_id)

    a.status = "COMPLETED"
    a.completed_at = datetime.utcnow()
    r.status = "COMPLETED"
    v.availability_status = "AVAILABLE"
    v.completed_tasks += 1

    # Simple reliability score update logic
    v.reliability_score = min(5.0, v.reliability_score + 0.1)

    db.session.commit()
    return jsonify(a.to_dict())
