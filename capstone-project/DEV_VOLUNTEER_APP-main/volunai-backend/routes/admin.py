from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, User, Volunteer, Notification, AssistanceRequest, Assignment
from routes.rbac import require_role

bp = Blueprint("admin", __name__, url_prefix="/api/admin")

@bp.route("/verify/<int:user_id>", methods=["PUT"])
@jwt_required()
@require_role("admin")
def admin_verify_user(user_id):
    data = request.json or {}
    status = data.get("status")
    reason = data.get("reason", "No specific reason provided.")
    
    if status not in ["VERIFIED", "REJECTED"]:
        return jsonify({"error": "Invalid status"}), 400
        
    user = User.query.get_or_404(user_id)
    user.verification_status = status
    user.is_verified = (status == "VERIFIED")
    user.rejection_reason = reason if status == "REJECTED" else None
    
    # Notify user
    msg = "Your account verification has been approved! You can now access all CVAS features." if status == "VERIFIED" else f"Your account verification was rejected. Reason: {reason}"
    notif = Notification(
        user_id=user.id,
        message=msg,
        notification_type="SYSTEM",
        status="unread"
    )
    db.session.add(notif)
    
    # Update volunteer if applicable
    if user.role == "volunteer":
        vol = Volunteer.query.filter_by(email=user.email).first()
        if vol:
            vol.verification_status = status
            vol.is_verified = (status == "VERIFIED")
            vol.rejection_reason = reason if status == "REJECTED" else None
            # Activate if verified
            if status == "VERIFIED":
                vol.active = True
                vol.availability_status = "AVAILABLE"
                
    db.session.commit()
    return jsonify({"message": f"User {status.lower()} successfully", "user": user.to_dict()}), 200

@bp.route("/db/<string:table_name>", methods=["GET"])
@jwt_required()
@require_role("admin")
def db_get_all(table_name):
    model_map = {
        "users": User,
        "volunteers": Volunteer,
        "requests": AssistanceRequest,
        "assignments": Assignment
    }
    model = model_map.get(table_name)
    if not model:
        return jsonify({"error": "Unknown table"}), 400
    
    records = model.query.all()
    return jsonify([r.to_dict() for r in records]), 200

@bp.route("/db/<string:table_name>/<int:record_id>", methods=["PUT"])
@jwt_required()
@require_role("admin")
def db_update(table_name, record_id):
    model_map = {
        "users": User,
        "volunteers": Volunteer,
        "requests": AssistanceRequest,
        "assignments": Assignment
    }
    model = model_map.get(table_name)
    if not model:
        return jsonify({"error": "Unknown table"}), 400

    record = model.query.get_or_404(record_id)
    data = request.json

    # FIX BUG-17: Explicitly skip sensitive and system-managed columns.
    # Previously password_hash could be overwritten with a plain-text string, breaking auth.
    SKIP_COLS = {'id', 'password_hash', 'deleted_at', 'created_at'}

    for column in model.__table__.columns:
        col_name = column.name  # snake_case 'requester_name'
        if col_name in SKIP_COLS:  # never allow overwriting these fields via this endpoint
            continue
        components = col_name.split('_')
        camel_name = components[0] + ''.join(x.title() for x in components[1:])  # camelCase

        if camel_name in data:
            setattr(record, col_name, data[camel_name])
        elif col_name in data:
            setattr(record, col_name, data[col_name])

    try:
        db.session.commit()
        return jsonify({"message": "Record updated successfully", "record": record.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@bp.route("/db/<string:table_name>", methods=["POST"])
@jwt_required()
@require_role("admin")
def db_create(table_name):
    model_map = {
        "users": User,
        "volunteers": Volunteer,
        "requests": AssistanceRequest,
        "assignments": Assignment
    }
    model = model_map.get(table_name)
    if not model:
        return jsonify({"error": "Unknown table"}), 400
    
    data = request.json
    record = model()
    
    for column in model.__table__.columns:
        col_name = column.name
        components = col_name.split('_')
        camel_name = components[0] + ''.join(x.title() for x in components[1:])
        
        if col_name == 'id': continue
            
        if camel_name in data:
            setattr(record, col_name, data[camel_name])
        elif col_name in data:
            setattr(record, col_name, data[col_name])
            
    try:
        db.session.add(record)
        db.session.commit()
        return jsonify({"message": "Record created successfully", "record": record.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@bp.route("/db/<string:table_name>/<int:record_id>", methods=["DELETE"])
@jwt_required()
@require_role("admin")
def db_delete(table_name, record_id):
    model_map = {
        "users": User,
        "volunteers": Volunteer,
        "requests": AssistanceRequest,
        "assignments": Assignment
    }
    model = model_map.get(table_name)
    if not model:
        return jsonify({"error": "Unknown table"}), 400
    
    record = model.query.get_or_404(record_id)
    try:
        db.session.delete(record)
        db.session.commit()
        return jsonify({"message": "Record deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
