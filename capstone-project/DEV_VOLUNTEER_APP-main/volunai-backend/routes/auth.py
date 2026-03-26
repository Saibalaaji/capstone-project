from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, Volunteer, Notification
from datetime import datetime
import os
from werkzeug.utils import secure_filename
import json
from routes.rbac import require_role
from app import limiter

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.route("/register", methods=["POST"])
@limiter.limit("3 per minute")
def register():
    # Handle both JSON and Multipart-form data
    if request.is_json:
        data = request.json
    else:
        data = request.form.to_dict()
        # Parse JSON strings from FormData if they exist
        if "skills" in data and isinstance(data["skills"], str):
            try: data["skills"] = json.loads(data["skills"])
            except: data["skills"] = []
        if "availableDays" in data and isinstance(data["availableDays"], str):
            try: data["availableDays"] = json.loads(data["availableDays"])
            except: data["availableDays"] = []

    # Validate required fields
    required = ["name", "email", "password"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 400

    # FIX BUG-18: only allow 'user' or 'volunteer' during self-registration.
    # Previously role=data.get("role","user") let anyone set role='admin' in the POST body.
    allowed_roles = {"user", "volunteer"}
    role = data.get("role", "user")
    if role not in allowed_roles:
        return jsonify({"error": f"Invalid role '{role}'. Allowed: user, volunteer"}), 400

    user = User(
        name=data["name"],
        email=data["email"],
        contact_number=data.get("contactNumber", ""),
        location=data.get("location", ""),
        role=role
    )
    user.set_password(data["password"])
    
    # All non-admin users require verification
    if user.role == "admin":
        user.is_verified = True
        user.verification_status = "VERIFIED"
    else:
        user.is_verified = False
        user.verification_status = "PENDING"
        
    # Handle File Upload for ID Verification
    if "idProof" in request.files:
        file = request.files["idProof"]
        if file.filename != "":
            filename = secure_filename(f"{user.email}_{int(datetime.now().timestamp())}_{file.filename}")
            upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'ids')
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, filename)
            file.save(file_path)
            user.id_proof_url = f"/api/admin/verification/proof/{filename}"

            # Apply AI metrics if provided by the frontend pre-verification step
            ai_status = data.get('ai_status')
            if ai_status:
                user.ai_doc_type = data.get('ai_doc_type')
                if data.get('ai_confidence'):
                    user.ai_confidence = float(data.get('ai_confidence'))
                
                if ai_status == "VERIFIED" or ai_status == "PENDING_ADMIN":
                    user.verification_status = "PENDING"
                else:
                    user.verification_status = "REJECTED_BY_AI"

    db.session.add(user)
    db.session.commit()

    # If registering as volunteer, create linked volunteer profile
    if user.role == "volunteer":
        volunteer = Volunteer(
            name=user.name,
            email=user.email,
            phone=user.contact_number,
            location=user.location,
            active=True,
            availability_status="AVAILABLE",
            is_verified=user.is_verified,
            verification_status=user.verification_status,
            id_proof_url=user.id_proof_url
        )
        if data.get("skills"):
            volunteer.set_service_types(data["skills"])
        if data.get("availableDays"):
            volunteer.set_available_days(data["availableDays"])
        db.session.add(volunteer)
        db.session.commit()

    # Create welcome notification
    notif_msg = f"Welcome to CVAS, {user.name}!"
        
    notif = Notification(
        user_id=user.id,
        message=notif_msg,
        notification_type="SYSTEM",
        status="unread"
    )
    db.session.add(notif)
    db.session.commit()

    # Generate JWT token
    token = create_access_token(identity=str(user.id))

    return jsonify({
        "user": user.to_dict(),
        "token": token
    }), 201


@bp.route("/login", methods=["POST"])
@limiter.limit("5 per minute")
def login():
    data = request.json

    if not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400

    # FIX BUG-09: added filter to exclude soft-deleted users from login.
    # Previously User.query.filter_by(email=...) returned deleted accounts.
    user = User.query.filter_by(email=data["email"]).filter(User.deleted_at.is_(None)).first()

    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    # Generate JWT token
    token = create_access_token(identity=str(user.id))

    return jsonify({
        "user": user.to_dict(),
        "token": token
    }), 200


@bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.to_dict()), 200


@bp.route("/users", methods=["GET"])
@jwt_required()
@require_role("admin")
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    role = request.args.get("role")
    
    query = User.query
    if role:
        query = query.filter_by(role=role)
        
    pagination = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        "status": "success",
        "data": [u.to_dict() for u in pagination.items],
        "meta": {
            "total_items": pagination.total,
            "total_pages": pagination.pages,
            "current_page": pagination.page,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev
        }
    }), 200


# FIX BUG-25: Restrict GET /users/:id to the requesting user themselves or an admin.
# Previously any authenticated user could read another user's full profile.
@bp.route("/users/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    caller_id = int(get_jwt_identity())
    caller = User.query.get(caller_id)
    if not caller:
        return jsonify({"error": "Unauthorized"}), 401
    # Allow access only to own profile or if caller is admin
    if caller.role != "admin" and caller_id != user_id:
        return jsonify({"error": "Forbidden"}), 403
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict()), 200


@bp.route("/admin/create-user", methods=["POST"])
@jwt_required()
def admin_create_user():
    """Admin creates a user account directly (auto-verified)."""
    from routes.rbac import require_role
    from flask_jwt_extended import get_jwt_identity
    caller_id = get_jwt_identity()
    caller = User.query.get(int(caller_id))
    if not caller or caller.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    required = ["name", "email", "password"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 400

    user = User(
        name=data["name"],
        email=data["email"],
        contact_number=data.get("contactNumber", ""),
        location=data.get("location", ""),
        role=data.get("role", "user"),
        is_verified=True,
        verification_status="VERIFIED"
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()

    # If role is volunteer, also create volunteer profile
    if user.role == "volunteer":
        vol = Volunteer(
            name=user.name,
            email=user.email,
            phone=user.contact_number,
            location=user.location,
            active=True,
            availability_status="AVAILABLE",
            is_verified=True,
            verification_status="VERIFIED"
        )
        db.session.add(vol)
        db.session.commit()

    return jsonify({"message": "User created successfully", "user": user.to_dict()}), 201


@bp.route("/admin/create-volunteer", methods=["POST"])
@jwt_required()
def admin_create_volunteer():
    """Admin creates a volunteer profile directly."""
    from flask_jwt_extended import get_jwt_identity
    caller_id = get_jwt_identity()
    caller = User.query.get(int(caller_id))
    if not caller or caller.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    required = ["name", "email"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    vol = Volunteer(
        name=data["name"],
        email=data["email"],
        phone=data.get("phone", ""),
        location=data.get("location", ""),
        rating=float(data.get("rating", 0.0)),
        active=True,
        availability_status="AVAILABLE",
        is_verified=True,
        verification_status="VERIFIED"
    )
    if data.get("serviceType"):
        vol.set_service_types(data["serviceType"])
    if data.get("availableDays"):
        vol.set_available_days(data["availableDays"])

    db.session.add(vol)
    db.session.commit()

    return jsonify({"message": "Volunteer created successfully", "volunteer": vol.to_dict()}), 201

