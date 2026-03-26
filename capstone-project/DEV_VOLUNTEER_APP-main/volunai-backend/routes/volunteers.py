"""
Volunteer CRUD API.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Volunteer, User
from routes.rbac import require_role, verified_required, require_ownership_or_admin

bp = Blueprint("volunteers", __name__, url_prefix="/api/volunteers")


@bp.route("", methods=["POST"])
@jwt_required()
@require_role("admin")
def create_volunteer():
    data = request.get_json()
    v = Volunteer(
        name=data["name"],
        email=data["email"],
        phone=data.get("phone"),
        location=data.get("location"),
        rating=data.get("rating", 0.0),
        active=data.get("active", True),
    )
    v.set_available_days(data.get("availableDays", []))
    v.set_service_types(data.get("serviceType", []))
    db.session.add(v)
    db.session.commit()
    return jsonify(v.to_dict()), 201


@bp.route("", methods=["GET"])
@jwt_required()
@verified_required
def get_all_volunteers():
    # FIX BUG-12: filter out soft-deleted volunteers (deleted_at IS NULL)
    volunteers = Volunteer.query.filter(Volunteer.deleted_at.is_(None)).all()
    result = []

    for v in volunteers:
        # Get current assignments for this volunteer
        from models import Assignment
        current_assignments = Assignment.query.filter_by(
            volunteer_id=v.id,
            status='ACCEPTED'
        ).count()

        volunteer_data = v.to_dict()
        volunteer_data['current_assignments'] = current_assignments
        result.append(volunteer_data)

    return jsonify(result)

@bp.route("/<int:vid>/requests", methods=["GET"])
@jwt_required()
@verified_required
def get_volunteer_requests(vid):
    """Get all requests visible to this volunteer with assignment status"""
    from models import AssistanceRequest, Assignment, User
    
    # Get all requests
    all_requests = AssistanceRequest.query.all()
    volunteer_requests = []
    
    for req in all_requests:
        # Get assignment info for this volunteer
        assignment = Assignment.query.filter_by(
            request_id=req.id,
            volunteer_id=vid
        ).first()
        
        # Get assigned volunteer name if any
        assigned_volunteer = None
        if req.assigned_volunteer_id:
            assigned_vol = Volunteer.query.get(req.assigned_volunteer_id)
            if assigned_vol:
                assigned_volunteer = assigned_vol.name
        
        request_data = {
            'id': req.id,
            'requester_name': req.requester_name,
            'requester_contact': req.requester_contact,
            'service_type': req.service_type,
            'location': req.location,
            'urgency_level': req.urgency_level,
            'description': req.description,
            'status': req.status,
            'assigned_volunteer': assigned_volunteer,
            'assigned_volunteer_id': req.assigned_volunteer_id,
            'is_assigned_to_me': req.assigned_volunteer_id == vid,
            'assignment_status': assignment.status if assignment else None,
            'can_accept': req.status == 'PENDING' and not req.assigned_volunteer_id,
            'can_complete': req.assigned_volunteer_id == vid and req.status == 'ASSIGNED',
            'match_score': assignment.match_score if assignment else 0.0
        }
        
        volunteer_requests.append(request_data)
    
    return jsonify(volunteer_requests)


@bp.route("/<int:vid>", methods=["GET"])
@jwt_required()
def get_volunteer(vid):
    v = Volunteer.query.get_or_404(vid)
    return jsonify(v.to_dict())


@bp.route("/<int:vid>", methods=["PUT"])
@jwt_required()
@require_role("admin", "volunteer")
@require_ownership_or_admin(id_param_name="vid")
def update_volunteer(vid):
    v = Volunteer.query.get_or_404(vid)
    data = request.get_json()
    v.name = data.get("name", v.name)
    v.email = data.get("email", v.email)
    v.phone = data.get("phone", v.phone)
    v.location = data.get("location", v.location)
    v.rating = data.get("rating", v.rating)
    v.active = data.get("active", v.active)
    if "availableDays" in data:
        v.set_available_days(data["availableDays"])
    if "serviceType" in data:
        v.set_service_types(data["serviceType"])
    db.session.commit()
    return jsonify(v.to_dict())


@bp.route("/<int:vid>", methods=["DELETE"])
@jwt_required()
@require_role("admin")
def delete_volunteer(vid):
    v = Volunteer.query.get_or_404(vid)
    db.session.delete(v)
    db.session.commit()
    return "", 204


# FIX BUG-07: added @jwt_required() — previously unauthenticated, exposing all volunteer PII.
@bp.route("/active", methods=["GET"])
@jwt_required()
def get_active_volunteers():
    # Also apply soft-delete filter (BUG-12)
    volunteers = Volunteer.query.filter_by(active=True).filter(Volunteer.deleted_at.is_(None)).all()
    return jsonify([v.to_dict() for v in volunteers])


# FIX BUG-07: added @jwt_required() — previously unauthenticated, exposing volunteer profiles by email.
@bp.route("/by-email/<string:email>", methods=["GET"])
@jwt_required()
def get_volunteer_by_email(email):
    """Find volunteer profile linked to a registered user's email."""
    v = Volunteer.query.filter_by(email=email).filter(Volunteer.deleted_at.is_(None)).first()
    if not v:
        return jsonify({"error": "Volunteer profile not found"}), 404
    return jsonify(v.to_dict()), 200


@bp.route("/stats", methods=["GET"])
@jwt_required()
@require_role("admin")
def get_volunteer_stats():
    """Overall volunteer statistics for the admin panel."""
    from models import Assignment
    total = Volunteer.query.count()
    active = Volunteer.query.filter_by(active=True).count()
    available = Volunteer.query.filter_by(availability_status="AVAILABLE").count()
    busy = Volunteer.query.filter_by(availability_status="BUSY").count()
    completed = db.session.query(db.func.sum(Volunteer.completed_tasks)).scalar() or 0
    avg_rating = db.session.query(db.func.avg(Volunteer.rating)).scalar() or 0
    return jsonify({
        "total": total,
        "active": active,
        "available": available,
        "busy": busy,
        "completedTasks": int(completed),
        "avgRating": round(float(avg_rating), 2)
    }), 200


@bp.route("/<int:vid>/availability", methods=["PATCH"])
@jwt_required()
@require_ownership_or_admin(id_param_name="vid")
def toggle_availability(vid):
    v = Volunteer.query.get_or_404(vid)
    data = request.get_json()
    if "status" in data:
        v.availability_status = data["status"]
        db.session.commit()
    return jsonify(v.to_dict())


@bp.route("/<int:vid>/activate", methods=["PATCH"])
@jwt_required()
@require_role("admin", "volunteer")
@require_ownership_or_admin(id_param_name="vid")
def toggle_activation(vid):
    v = Volunteer.query.get_or_404(vid)
    data = request.get_json()
    if "active" in data:
        v.active = data["active"]
        db.session.commit()
    return jsonify(v.to_dict())


# FIX BUG-07: added @jwt_required() — previously completely public.
# FIX BUG-24: use case-insensitive LIKE for skill matching to avoid false negatives.
@bp.route("/filter", methods=["GET"])
@jwt_required()
def filter_volunteers():
    from sqlalchemy import func
    skill = request.args.get("skill")
    location = request.args.get("location")
    status = request.args.get("status")

    # Always exclude soft-deleted volunteers
    query = Volunteer.query.filter(Volunteer.deleted_at.is_(None))
    if skill:
        # FIX BUG-24: was Volunteer.service_type.contains(skill) — case-sensitive partial match.
        # Now uses lowercase comparison for accurate, case-insensitive filtering.
        query = query.filter(func.lower(Volunteer.service_type).contains(skill.lower()))
    if location:
        query = query.filter(Volunteer.location == location)
    if status:
        query = query.filter(Volunteer.availability_status == status)

    volunteers = query.all()
    return jsonify([v.to_dict() for v in volunteers])
