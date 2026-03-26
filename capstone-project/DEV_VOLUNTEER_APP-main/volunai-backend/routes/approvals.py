from flask import Blueprint, request, jsonify
from models import db, Assignment, AssistanceRequest, Volunteer, Notification, User
from datetime import datetime

bp = Blueprint("approvals", __name__, url_prefix="/api/approvals")

@bp.route("/volunteer/<int:volunteer_id>/approve/<int:request_id>", methods=["POST"])
def volunteer_approve(volunteer_id, request_id):
    req = AssistanceRequest.query.get_or_404(request_id)
    volunteer = Volunteer.query.get_or_404(volunteer_id)
    
    req.assigned_volunteer_id = volunteer_id
    req.status = "APPROVED"
    volunteer.availability_status = "ASSIGNED"
    
    # Create or update assignment
    assignment = Assignment.query.filter_by(request_id=request_id, volunteer_id=volunteer_id).first()
    if not assignment:
        assignment = Assignment(
            request_id=request_id,
            volunteer_id=volunteer_id,
            match_score=0.9
        )
        db.session.add(assignment)
    
    assignment.status = "ACCEPTED"
    
    # Notify admins
    admins = User.query.filter_by(role="admin").all()
    for admin in admins:
        notification = Notification(
            user_id=admin.id,
            message=f"{volunteer.name} approved task: {req.service_type}",
            notification_type="APPROVAL",
            related_id=request_id
        )
        db.session.add(notification)
    
    db.session.commit()
    return jsonify({"message": "Task approved", "request": req.to_dict()}), 200

@bp.route("/volunteer/<int:volunteer_id>/decline/<int:request_id>", methods=["POST"])
def volunteer_decline(volunteer_id, request_id):
    assignment = Assignment.query.filter_by(request_id=request_id, volunteer_id=volunteer_id).first()
    if assignment:
        assignment.status = "DECLINED"
        db.session.commit()
    
    return jsonify({"message": "Task declined"}), 200

@bp.route("/task/<int:request_id>/complete", methods=["POST"])
def complete_task(request_id):
    req = AssistanceRequest.query.get_or_404(request_id)
    req.status = "COMPLETED"
    
    if req.assigned_volunteer_id:
        volunteer = Volunteer.query.get(req.assigned_volunteer_id)
        volunteer.completed_tasks += 1
        volunteer.availability_status = "AVAILABLE"
        
        assignment = Assignment.query.filter_by(request_id=request_id, volunteer_id=req.assigned_volunteer_id).first()
        if assignment:
            assignment.status = "COMPLETED"
            assignment.completed_at = datetime.utcnow()
        
        # Notify admins
        admins = User.query.filter_by(role="admin").all()
        for admin in admins:
            notification = Notification(
                user_id=admin.id,
                message=f"Task completed: {req.service_type}",
                notification_type="COMPLETION",
                related_id=request_id
            )
            db.session.add(notification)
    
    db.session.commit()
    return jsonify({"message": "Task completed", "request": req.to_dict()}), 200
