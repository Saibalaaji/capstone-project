from flask import Blueprint, request, jsonify
from models import db, User, Volunteer, Notification
from datetime import datetime

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@bp.route("/register", methods=["POST"])
def register():
    data = request.json
    
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already exists"}), 400
    
    user = User(
        name=data["name"],
        email=data["email"],
        contact_number=data.get("contactNumber"),
        location=data.get("location"),
        role=data.get("role", "user")
    )
    user.set_password(data["password"])
    
    db.session.add(user)
    db.session.commit()
    
    # If registering as volunteer, create volunteer profile
    if user.role == "volunteer":
        volunteer = Volunteer(
            name=user.name,
            email=user.email,
            phone=user.contact_number,
            location=user.location,
            active=True,
            availability_status="AVAILABLE"
        )
        db.session.add(volunteer)
        db.session.commit()
    
    return jsonify(user.to_dict()), 201

@bp.route("/login", methods=["POST"])
def login():
    data = request.json
    user = User.query.filter_by(email=data["email"]).first()
    
    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401
    
    return jsonify(user.to_dict()), 200

@bp.route("/users", methods=["GET"])
def get_users():
    role = request.args.get("role")
    query = User.query
    if role:
        query = query.filter_by(role=role)
    users = query.all()
    return jsonify([u.to_dict() for u in users]), 200

@bp.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict()), 200
