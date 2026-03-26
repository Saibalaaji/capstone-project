"""
Assistance Request API — matches the Java AssistanceRequestController endpoints.
When a request is created, the ML matching engine automatically suggests volunteers.
"""
from flask import Blueprint, request as flask_request, jsonify
from sqlalchemy import func
from models import db, AssistanceRequest, Volunteer, Notification, User
from ml.matching_engine import matching_engine
from datetime import datetime
from routes.rbac import verified_required, require_role, require_ownership_or_admin
from flask_jwt_extended import jwt_required

bp = Blueprint("requests", __name__, url_prefix="/api/requests")


@bp.route("", methods=["POST"])
@jwt_required()
@verified_required
def create_request():
    # FIX BUG-16: Added explicit required-field validation.
    # Previously, missing fields caused a KeyError caught by the bare except, returning a confusing 500.
    try:
        data = flask_request.get_json()
        required_fields = ["requesterName", "requesterContact", "location", "serviceType"]
        for field in required_fields:
            if not data or not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400

        req = AssistanceRequest(
            requester_name=data["requesterName"],
            requester_contact=data["requesterContact"],
            location=data["location"],
            latitude=data.get("lat"),
            longitude=data.get("lng"),
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
@jwt_required()
def get_all_requests():
    page = flask_request.args.get('page', 1, type=int)
    per_page = flask_request.args.get('per_page', 10, type=int)
    
    pagination = AssistanceRequest.query.order_by(AssistanceRequest.id.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    result = []
    for r in pagination.items:
        # Get assigned volunteer name
        assigned_volunteer = None
        if r.assigned_volunteer_id:
            vol = Volunteer.query.get(r.assigned_volunteer_id)
            if vol:
                assigned_volunteer = vol.name
        
        request_data = r.to_dict()
        request_data['assigned_volunteer_name'] = assigned_volunteer
        result.append(request_data)
    
    return jsonify({
        "status": "success",
        "data": result,
        "meta": {
            "total_items": pagination.total,
            "total_pages": pagination.pages,
            "current_page": pagination.page,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev
        }
    }), 200


@bp.route("/<int:rid>", methods=["GET"])
@jwt_required()
def get_request(rid):
    r = AssistanceRequest.query.get_or_404(rid)
    return jsonify(r.to_dict())


@bp.route("/<int:rid>/status", methods=["PATCH"])
@jwt_required()
@require_role("admin")
def update_status(rid):
    r = AssistanceRequest.query.get_or_404(rid)
    data = flask_request.get_json()
    r.status = data.get("status", r.status)
    db.session.commit()
    return jsonify(r.to_dict())


@bp.route("/<int:request_id>/assign/<int:volunteer_id>", methods=["POST"])
@jwt_required()
@require_role("admin")
def assign_volunteer(request_id, volunteer_id):
    """Admin assigns a volunteer to a request"""
    from models import Assignment
    
    r = AssistanceRequest.query.get_or_404(request_id)
    v = Volunteer.query.get_or_404(volunteer_id)
    
    if r.status not in ['PENDING', 'OPEN']:
        return jsonify({"error": "Request is no longer available for assignment"}), 400
    
    if not v.active:
        return jsonify({"error": "Volunteer is not active"}), 400
    
    if v.availability_status == "BUSY":
        return jsonify({"error": "Volunteer is currently BUSY with another task"}), 400
    
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
        assignment.assigned_by = "ADMIN"
    else:
        assignment = Assignment(
            request_id=request_id,
            volunteer_id=volunteer_id,
            status="ASSIGNED",
            assigned_by="ADMIN",
            match_score=0.95
        )
        db.session.add(assignment)
    
    db.session.commit()
    
    return jsonify({
        "message": "Volunteer assigned successfully",
        "request": r.to_dict()
    }), 200


@bp.route("/<int:request_id>/unassign", methods=["DELETE"])
@jwt_required()
@require_role("admin")
def unassign_volunteer(request_id):
    """Admin removes the volunteer assignment from a request"""
    from models import Assignment
    
    r = AssistanceRequest.query.get_or_404(request_id)
    
    if not r.assigned_volunteer_id:
        return jsonify({"error": "No volunteer assigned to this request"}), 400
    
    # Free the previously assigned volunteer
    old_vol = Volunteer.query.get(r.assigned_volunteer_id)
    if old_vol:
        old_vol.availability_status = "AVAILABLE"
    
    # Clear assignment records
    Assignment.query.filter_by(
        request_id=request_id,
        volunteer_id=r.assigned_volunteer_id
    ).delete()
    
    r.assigned_volunteer_id = None
    r.status = "PENDING"
    
    db.session.commit()
    
    return jsonify({
        "message": "Volunteer unassigned. Request is now PENDING.",
        "request": r.to_dict()
    }), 200


@bp.route("/<int:request_id>/reassign/<int:volunteer_id>", methods=["POST"])
@jwt_required()
@require_role("admin")
def reassign_volunteer(request_id, volunteer_id):
    """Admin reassigns a request to a different volunteer"""
    from models import Assignment
    
    r = AssistanceRequest.query.get_or_404(request_id)
    new_vol = Volunteer.query.get_or_404(volunteer_id)
    
    if new_vol.availability_status == "BUSY":
        return jsonify({"error": "Selected volunteer is currently BUSY"}), 400
    
    if not new_vol.active:
        return jsonify({"error": "Selected volunteer is not active"}), 400
    
    # Free previously assigned volunteer
    if r.assigned_volunteer_id and r.assigned_volunteer_id != volunteer_id:
        old_vol = Volunteer.query.get(r.assigned_volunteer_id)
        if old_vol:
            old_vol.availability_status = "AVAILABLE"
        # Remove old assignment
        Assignment.query.filter_by(
            request_id=request_id,
            volunteer_id=r.assigned_volunteer_id
        ).delete()
    
    # Assign new volunteer
    r.assigned_volunteer_id = volunteer_id
    r.status = "ASSIGNED"
    new_vol.availability_status = "BUSY"
    
    assignment = Assignment(
        request_id=request_id,
        volunteer_id=volunteer_id,
        status="ASSIGNED",
        assigned_by="ADMIN",
        match_score=0.90
    )
    db.session.add(assignment)
    db.session.commit()
    
    return jsonify({
        "message": f"Request reassigned to {new_vol.name}",
        "request": r.to_dict()
    }), 200


@bp.route("/<int:request_id>/accept", methods=["POST"])
@jwt_required()
@verified_required
def accept_request(request_id):
    """Volunteer accepts a request - auto assignment"""
    from models import Assignment, User
    from flask_jwt_extended import get_jwt_identity
    
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    v = Volunteer.query.filter_by(email=user.email).first()
    
    if not v:
        return jsonify({"error": "Volunteer profile not found"}), 404
        
    volunteer_id = v.id
    r = AssistanceRequest.query.get_or_404(request_id)
    
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
        assignment.assigned_by = "VOLUNTEER"
    else:
        assignment = Assignment(
            request_id=request_id,
            volunteer_id=volunteer_id,
            status="ACCEPTED",
            assigned_by="VOLUNTEER",
            match_score=0.95
        )
        db.session.add(assignment)
    
    db.session.commit()
    
    return jsonify({
        "message": "Request accepted and assigned",
        "request": r.to_dict()
    }), 200

@bp.route("/<int:request_id>/decline", methods=["POST"])
@jwt_required()
@verified_required
def decline_request(request_id):
    """Volunteer declines a request"""
    from models import Assignment, User
    from flask_jwt_extended import get_jwt_identity
    
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    v = Volunteer.query.filter_by(email=user.email).first()
    
    if not v:
        return jsonify({"error": "Volunteer profile not found"}), 404
        
    volunteer_id = v.id
    
    assignment = Assignment.query.filter_by(
        request_id=request_id,
        volunteer_id=volunteer_id
    ).first()
    
    if assignment:
        assignment.status = "DECLINED"

        # Fix Status Drift: Revert parent AssistanceRequest back to PENDING
        r = AssistanceRequest.query.get(request_id)
        if r and r.assigned_volunteer_id == volunteer_id:
            r.status = "PENDING"
            r.assigned_volunteer_id = None

        # Free the volunteer status
        if v.availability_status == "BUSY":
            v.availability_status = "AVAILABLE"

        db.session.commit()
    
    return jsonify({"message": "Request declined"}), 200

@bp.route("/<int:request_id>/complete", methods=["POST"])
@jwt_required()
@verified_required
def complete_request_by_volunteer(request_id):
    """Volunteer marks request as completed"""
    from models import Assignment, User
    from flask_jwt_extended import get_jwt_identity
    
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    v = Volunteer.query.filter_by(email=user.email).first()
    
    if not v:
        return jsonify({"error": "Volunteer profile not found"}), 404
        
    volunteer_id = v.id
    
    r = AssistanceRequest.query.get_or_404(request_id)
    
    if r.assigned_volunteer_id != volunteer_id:
        return jsonify({"error": "Not assigned to this volunteer"}), 403
    
    r.status = "COMPLETED"
    v.availability_status = "AVAILABLE"
    v.completed_tasks += 1
    v.reliability_score = min(v.reliability_score + 0.1, 5.0)
    
    # Update assignment
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
@jwt_required()
def delete_request(rid):
    from flask_jwt_extended import get_jwt_identity

    current_user_id = get_jwt_identity()
    # FIX BUG-06: was using get_jwt() claims 'role' which is never populated in the token.
    # Token only contains identity=str(user.id), so role check must come from the DB.
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404
    is_admin = (user.role == "admin")

    r = AssistanceRequest.query.get_or_404(rid)

    # Ownership or Admin check
    if not is_admin:
        if r.requester_contact not in [user.email, user.contact_number]:
            return jsonify({"error": "Forbidden. You can only delete your own requests."}), 403

        if r.status != 'PENDING':
            return jsonify({"error": "You can only cancel PENDING requests."}), 400

    from models import Assignment
    if r.assigned_volunteer_id:
        v = Volunteer.query.get(r.assigned_volunteer_id)
        if v:
            v.availability_status = "AVAILABLE"
        Assignment.query.filter_by(request_id=rid).delete()

    db.session.delete(r)
    db.session.commit()
    return jsonify({"status": "success", "message": "Request cancelled successfully."}), 200


@bp.route("/status/<status>", methods=["GET"])
@jwt_required()
def get_by_status(status):
    reqs = AssistanceRequest.query.filter_by(status=status.upper()).all()
    return jsonify([r.to_dict() for r in reqs])


@bp.route("/stats", methods=["GET"])
@jwt_required()
@require_role("admin")
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
@jwt_required()
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

