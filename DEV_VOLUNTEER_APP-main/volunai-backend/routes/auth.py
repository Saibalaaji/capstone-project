from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, Volunteer, Notification
from datetime import datetime

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.route("/register", methods=["POST"])
def register():
    data = request.json

    # Validate required fields
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
        role=data.get("role", "user")
    )
    user.set_password(data["password"])

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
            availability_status="AVAILABLE"
        )
        if data.get("skills"):
            volunteer.set_service_types(data["skills"])
        if data.get("availableDays"):
            volunteer.set_available_days(data["availableDays"])
        db.session.add(volunteer)
        db.session.commit()

    # Create welcome notification
    notif = Notification(
        user_id=user.id,
        message=f"Welcome to CVAS, {user.name}! Your account has been created.",
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
def login():
    data = request.json

    if not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=data["email"]).first()

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
def get_users():
    role = request.args.get("role")
    query = User.query
    if role:
        query = query.filter_by(role=role)
    users = query.all()
    return jsonify([u.to_dict() for u in users]), 200


@bp.route("/users/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict()), 200
