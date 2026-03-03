"""
Volunteer CRUD API — matches the Java VolunteerController endpoints.
"""
from flask import Blueprint, request, jsonify
from models import db, Volunteer

bp = Blueprint("volunteers", __name__, url_prefix="/api/volunteers")


@bp.route("", methods=["POST"])
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
def get_all_volunteers():
    volunteers = Volunteer.query.all()
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
def get_volunteer(vid):
    v = Volunteer.query.get_or_404(vid)
    return jsonify(v.to_dict())


@bp.route("/<int:vid>", methods=["PUT"])
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
def delete_volunteer(vid):
    v = Volunteer.query.get_or_404(vid)
    db.session.delete(v)
    db.session.commit()
    return "", 204


@bp.route("/active", methods=["GET"])
def get_active_volunteers():
    volunteers = Volunteer.query.filter_by(active=True).all()
    return jsonify([v.to_dict() for v in volunteers])


@bp.route("/<int:vid>/availability", methods=["PATCH"])
def toggle_availability(vid):
    v = Volunteer.query.get_or_404(vid)
    data = request.get_json()
    if "status" in data:
        v.availability_status = data["status"]
        db.session.commit()
    return jsonify(v.to_dict())


@bp.route("/<int:vid>/activate", methods=["PATCH"])
def toggle_activation(vid):
    v = Volunteer.query.get_or_404(vid)
    data = request.get_json()
    if "active" in data:
        v.active = data["active"]
        db.session.commit()
    return jsonify(v.to_dict())


@bp.route("/filter", methods=["GET"])
def filter_volunteers():
    skill = request.args.get("skill")
    location = request.args.get("location")
    status = request.args.get("status")
    
    query = Volunteer.query
    if skill:
        # Simple JSON search for skill
        query = query.filter(Volunteer.service_type.contains(skill))
    if location:
        query = query.filter(Volunteer.location == location)
    if status:
        query = query.filter(Volunteer.availability_status == status)
        
    volunteers = query.all()
    return jsonify([v.to_dict() for v in volunteers])
