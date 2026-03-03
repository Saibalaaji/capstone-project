"""
SQLAlchemy database models for VolunAI.
Mirrors the existing Java/JPA entities so the React frontend works unchanged.
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import json

db = SQLAlchemy()


class Volunteer(db.Model):
    __tablename__ = "volunteers"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(30), nullable=True)
    location = db.Column(db.String(120), nullable=True)
    available_days = db.Column(db.Text, default="[]")   # JSON array
    service_type = db.Column(db.Text, default="[]")      # JSON array
    rating = db.Column(db.Float, default=0.0)
    active = db.Column(db.Boolean, default=True)
    
    # New fields for unified management
    availability_status = db.Column(db.String(20), default="AVAILABLE") # AVAILABLE, BUSY, INACTIVE
    completed_tasks = db.Column(db.Integer, default=0)
    acceptance_rate = db.Column(db.Float, default=1.0)
    reliability_score = db.Column(db.Float, default=1.0)

    # ----- helpers to serialise / deserialise JSON list columns -----
    def get_available_days(self):
        try:
            return json.loads(self.available_days) if self.available_days else []
        except (json.JSONDecodeError, TypeError):
            return []

    def set_available_days(self, days_list):
        self.available_days = json.dumps(days_list)

    def get_service_types(self):
        try:
            return json.loads(self.service_type) if self.service_type else []
        except (json.JSONDecodeError, TypeError):
            return []

    def set_service_types(self, types_list):
        self.service_type = json.dumps(types_list)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "location": self.location,
            "availableDays": self.get_available_days(),
            "serviceType": self.get_service_types(),
            "rating": self.rating,
            "active": self.active,
            "availabilityStatus": self.availability_status,
            "completedTasks": self.completed_tasks,
            "acceptanceRate": self.acceptance_rate,
            "reliabilityScore": self.reliability_score
        }


class AssistanceRequest(db.Model):
    __tablename__ = "assistance_requests"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    requester_name = db.Column(db.String(120), nullable=False)
    requester_contact = db.Column(db.String(120), nullable=False)
    location = db.Column(db.String(120), nullable=False)
    service_type = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    urgency_level = db.Column(db.String(20), nullable=False, default="MEDIUM")
    status = db.Column(db.String(20), nullable=False, default="PENDING")
    assigned_volunteer_id = db.Column(db.Integer, db.ForeignKey("volunteers.id"), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "requesterName": self.requester_name,
            "requesterContact": self.requester_contact,
            "location": self.location,
            "serviceType": self.service_type,
            "description": self.description,
            "urgencyLevel": self.urgency_level,
            "status": self.status,
            "assignedVolunteerId": self.assigned_volunteer_id,
        }


class Assignment(db.Model):
    __tablename__ = "assignments"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    request_id = db.Column(db.Integer, db.ForeignKey("assistance_requests.id"), nullable=False)
    volunteer_id = db.Column(db.Integer, db.ForeignKey("volunteers.id"), nullable=False)
    match_score = db.Column(db.Float, default=0.0)
    acceptance_probability = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default="SUGGESTED") # SUGGESTED, ACCEPTED, DECLINED, COMPLETED
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "requestId": self.request_id,
            "volunteerId": self.volunteer_id,
            "matchScore": self.match_score,
            "acceptanceProbability": self.acceptance_probability,
            "status": self.status,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "assignedAt": self.assigned_at.isoformat() if self.assigned_at else None,
            "completedAt": self.completed_at.isoformat() if self.completed_at else None,
        }


class User(db.Model):
    __tablename__ = "users"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    contact_number = db.Column(db.String(30), nullable=True)
    location = db.Column(db.String(120), nullable=True)
    role = db.Column(db.String(20), nullable=False, default="user")  # user, admin, volunteer
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "contactNumber": self.contact_number,
            "location": self.location,
            "role": self.role,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }


class Message(db.Model):
    __tablename__ = "messages"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    request_id = db.Column(db.Integer, db.ForeignKey("assistance_requests.id"), nullable=True)
    message_text = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    read = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            "id": self.id,
            "senderId": self.sender_id,
            "receiverId": self.receiver_id,
            "requestId": self.request_id,
            "messageText": self.message_text,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "read": self.read
        }


class Notification(db.Model):
    __tablename__ = "notifications"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)  # NEW_REQUEST, NEW_MESSAGE, ASSIGNMENT, APPROVAL, COMPLETION
    related_id = db.Column(db.Integer, nullable=True)  # request_id or message_id
    status = db.Column(db.String(20), default="unread")  # unread, read
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "message": self.message,
            "notificationType": self.notification_type,
            "relatedId": self.related_id,
            "status": self.status,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }
