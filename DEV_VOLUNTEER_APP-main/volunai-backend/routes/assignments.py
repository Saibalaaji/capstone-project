"""
Assignment API — handles the lifecycle of a volunteer being assigned to a request.
"""
from flask import Blueprint, request, jsonify
from models import db, Volunteer, AssistanceRequest, Assignment
from datetime import datetime

bp = Blueprint("assignments", __name__, url_prefix="/api/assignments")

@bp.route("", methods=["GET"])
def get_all_assignments():
    assignments = Assignment.query.all()
    return jsonify([a.to_dict() for a in assignments])

@bp.route("/volunteer/<int:vid>", methods=["GET"])
def get_volunteer_assignments(vid):
    assignments = Assignment.query.filter_by(volunteer_id=vid).order_by(Assignment.timestamp.desc()).all()
    return jsonify([a.to_dict() for a in assignments])

@bp.route("/<int:aid>/accept", methods=["PATCH"])
def accept_assignment(aid):
    a = Assignment.query.get_or_404(aid)
    r = AssistanceRequest.query.get_or_404(a.request_id)
    v = Volunteer.query.get_or_404(a.volunteer_id)
    
    a.status = "ACCEPTED"
    r.status = "ASSIGNED"
    v.availability_status = "ASSIGNED"
    
    db.session.commit()
    return jsonify(a.to_dict())

@bp.route("/<int:aid>/decline", methods=["PATCH"])
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
    # Acceptance rate = (accepted + completed) / total
    v.acceptance_rate = (accepted + completed) / max(total_assignments, 1)
    
    db.session.commit()
    return jsonify(a.to_dict())

@bp.route("/<int:aid>/complete", methods=["PATCH"])
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
