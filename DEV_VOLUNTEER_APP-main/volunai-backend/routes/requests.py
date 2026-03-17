"""
Assistance Request API — matches the Java AssistanceRequestController endpoints.
When a request is created, the ML matching engine automatically suggests volunteers.
"""
from flask import Blueprint, request as flask_request, jsonify
from sqlalchemy import func
from models import db, AssistanceRequest, Volunteer, Notification, User
from ml.matching_engine import matching_engine
from datetime import datetime

bp = Blueprint("requests", __name__, url_prefix="/api/requests")


@bp.route("", methods=["POST"])
def create_request():
    try:
        data = flask_request.get_json()
        req = AssistanceRequest(
            requester_name=data["requesterName"],
            requester_contact=data["requesterContact"],
            location=data["location"],
            service_type=data["serviceType"],
            description=data.get("description", ""),
            urgency_level=data.get("urgencyLevel", "MEDIUM"),
            status="PENDING",
        )
        db.session.add(req)
        db.session.commit()

        return jsonify({
            "request": req.to_dict(),
            "suggestedVolunteers": [],
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@bp.route("", methods=["GET"])
def get_all_requests():
    reqs = AssistanceRequest.query.all()
    result = []
    
    for r in reqs:
        # Get assigned volunteer name
        assigned_volunteer = None
        if r.assigned_volunteer_id:
            vol = Volunteer.query.get(r.assigned_volunteer_id)
            if vol:
                assigned_volunteer = vol.name
        
        request_data = r.to_dict()
        request_data['assigned_volunteer_name'] = assigned_volunteer
        result.append(request_data)
    
    return jsonify(result)


@bp.route("/<int:rid>", methods=["GET"])
def get_request(rid):
    r = AssistanceRequest.query.get_or_404(rid)
    return jsonify(r.to_dict())


@bp.route("/<int:rid>/status", methods=["PATCH"])
def update_status(rid):
    r = AssistanceRequest.query.get_or_404(rid)
    data = flask_request.get_json()
    r.status = data.get("status", r.status)
    db.session.commit()
    return jsonify(r.to_dict())


@bp.route("/<int:request_id>/assign/<int:volunteer_id>", methods=["POST"])
def assign_volunteer(request_id, volunteer_id):
    """Admin assigns a volunteer to a request"""
    from models import Assignment
    
    r = AssistanceRequest.query.get_or_404(request_id)
    v = Volunteer.query.get_or_404(volunteer_id)
    
    if r.status not in ['PENDING', 'OPEN']:
        return jsonify({"error": "Request is no longer available for assignment"}), 400
    
    if not v.active:
        return jsonify({"error": "Volunteer is not active"}), 400
    
    # Assign the volunteer
    r.assigned_volunteer_id = volunteer_id
    r.status = "ASSIGNED"
    v.availability_status = "BUSY"
    
    # Create or update assignment
    assignment = Assignment.query.filter_by(
        request_id=request_id,
        volunteer_id=volunteer_id
    ).first()
    
    if assignment:
        assignment.status = "ASSIGNED"
    else:
        assignment = Assignment(
            request_id=request_id,
            volunteer_id=volunteer_id,
            status="ASSIGNED",
            match_score=0.95
        )
        db.session.add(assignment)
    
    db.session.commit()
    
    return jsonify({
        "message": "Volunteer assigned successfully",
        "request": r.to_dict()
    }), 200


@bp.route("/<int:request_id>/accept/<int:volunteer_id>", methods=["POST"])
def accept_request(request_id, volunteer_id):
    """Volunteer accepts a request - auto assignment"""
    from models import Assignment
    
    r = AssistanceRequest.query.get_or_404(request_id)
    v = Volunteer.query.get_or_404(volunteer_id)
    
    if r.status != 'PENDING':
        return jsonify({"error": "Request is no longer available"}), 400
    
    if not v.active:
        return jsonify({"error": "Volunteer is not active"}), 400
    
    # Auto-assign the volunteer
    r.assigned_volunteer_id = volunteer_id
    r.status = "ASSIGNED"
    v.availability_status = "BUSY"
    
    # Update or create assignment
    assignment = Assignment.query.filter_by(
        request_id=request_id,
        volunteer_id=volunteer_id
    ).first()
    
    if assignment:
        assignment.status = "ACCEPTED"
    else:
        assignment = Assignment(
            request_id=request_id,
            volunteer_id=volunteer_id,
            status="ACCEPTED",
            match_score=0.95
        )
        db.session.add(assignment)
    
    db.session.commit()
    
    return jsonify({
        "message": "Request accepted and assigned",
        "request": r.to_dict()
    }), 200

@bp.route("/<int:request_id>/decline/<int:volunteer_id>", methods=["POST"])
def decline_request(request_id, volunteer_id):
    """Volunteer declines a request"""
    from models import Assignment
    
    assignment = Assignment.query.filter_by(
        request_id=request_id,
        volunteer_id=volunteer_id
    ).first()
    
    if assignment:
        assignment.status = "DECLINED"
        db.session.commit()
    
    return jsonify({"message": "Request declined"}), 200

@bp.route("/<int:request_id>/complete/<int:volunteer_id>", methods=["POST"])
def complete_request_by_volunteer(request_id, volunteer_id):
    """Volunteer marks request as completed"""
    r = AssistanceRequest.query.get_or_404(request_id)
    v = Volunteer.query.get_or_404(volunteer_id)
    
    if r.assigned_volunteer_id != volunteer_id:
        return jsonify({"error": "Not assigned to this volunteer"}), 403
    
    r.status = "COMPLETED"
    v.availability_status = "AVAILABLE"
    v.completed_tasks += 1
    v.reliability_score = min(v.reliability_score + 0.1, 5.0)
    
    # Update assignment
    from models import Assignment
    assignment = Assignment.query.filter_by(
        request_id=request_id,
        volunteer_id=volunteer_id
    ).first()
    
    if assignment:
        assignment.status = "COMPLETED"
        assignment.completed_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        "message": "Request completed",
        "request": r.to_dict()
    }), 200


@bp.route("/<int:rid>", methods=["DELETE"])
def delete_request(rid):
    r = AssistanceRequest.query.get_or_404(rid)
    db.session.delete(r)
    db.session.commit()
    return "", 204


@bp.route("/status/<status>", methods=["GET"])
def get_by_status(status):
    reqs = AssistanceRequest.query.filter_by(status=status.upper()).all()
    return jsonify([r.to_dict() for r in reqs])


@bp.route("/stats", methods=["GET"])
def get_request_stats():
    """Aggregate request statistics for admin analytics."""
    total = AssistanceRequest.query.count()
    pending = AssistanceRequest.query.filter_by(status="PENDING").count()
    assigned = AssistanceRequest.query.filter_by(status="ASSIGNED").count()
    completed = AssistanceRequest.query.filter_by(status="COMPLETED").count()
    high = AssistanceRequest.query.filter_by(urgency_level="HIGH").count()
    medium = AssistanceRequest.query.filter_by(urgency_level="MEDIUM").count()
    low = AssistanceRequest.query.filter_by(urgency_level="LOW").count()
    # Service type breakdown
    service_rows = db.session.query(
        AssistanceRequest.service_type,
        func.count(AssistanceRequest.id).label('cnt')
    ).group_by(AssistanceRequest.service_type).all()
    service_breakdown = {row[0]: row[1] for row in service_rows}
    return jsonify({
        "total": total, "pending": pending,
        "assigned": assigned, "completed": completed,
        "urgent": {"high": high, "medium": medium, "low": low},
        "byServiceType": service_breakdown
    }), 200


@bp.route("/by-contact/<string:contact>", methods=["GET"])
def get_by_contact(contact):
    """Get all requests submitted by a specific contact (phone or email)."""
    reqs = AssistanceRequest.query.filter(
        AssistanceRequest.requester_contact == contact
    ).order_by(AssistanceRequest.id.desc()).all()
    result = []
    for r in reqs:
        assigned_volunteer = None
        if r.assigned_volunteer_id:
            vol = Volunteer.query.get(r.assigned_volunteer_id)
            if vol:
                assigned_volunteer = vol.name
        d = r.to_dict()
        d['assigned_volunteer_name'] = assigned_volunteer
        result.append(d)
    return jsonify(result), 200

