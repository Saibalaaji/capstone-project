from flask import Blueprint, request, jsonify
from models import db, Message, Notification, User
from datetime import datetime

bp = Blueprint("chat", __name__, url_prefix="/api/chat")

@bp.route("/messages", methods=["POST"])
def send_message():
    data = request.json
    
    message = Message(
        sender_id=data["senderId"],
        receiver_id=data["receiverId"],
        request_id=data.get("requestId"),
        message_text=data["messageText"]
    )
    
    db.session.add(message)
    
    # Create notification for receiver
    receiver = User.query.get(data["receiverId"])
    sender = User.query.get(data["senderId"])
    
    notification = Notification(
        user_id=data["receiverId"],
        message=f"New message from {sender.name}",
        notification_type="NEW_MESSAGE",
        related_id=message.id
    )
    
    db.session.add(notification)
    db.session.commit()
    
    return jsonify(message.to_dict()), 201

@bp.route("/messages", methods=["GET"])
def get_messages():
    user_id = request.args.get("userId", type=int)
    other_user_id = request.args.get("otherUserId", type=int)
    request_id = request.args.get("requestId", type=int)
    
    query = Message.query
    
    if user_id and other_user_id:
        query = query.filter(
            ((Message.sender_id == user_id) & (Message.receiver_id == other_user_id)) |
            ((Message.sender_id == other_user_id) & (Message.receiver_id == user_id))
        )
    elif request_id:
        query = query.filter_by(request_id=request_id)
    
    messages = query.order_by(Message.timestamp.asc()).all()
    return jsonify([m.to_dict() for m in messages]), 200

@bp.route("/messages/<int:message_id>/read", methods=["PUT"])
def mark_read(message_id):
    message = Message.query.get_or_404(message_id)
    message.read = True
    db.session.commit()
    return jsonify(message.to_dict()), 200

@bp.route("/conversations/<int:user_id>", methods=["GET"])
def get_conversations(user_id):
    # Get unique conversation partners
    sent = db.session.query(Message.receiver_id).filter_by(sender_id=user_id).distinct()
    received = db.session.query(Message.sender_id).filter_by(receiver_id=user_id).distinct()
    
    partner_ids = set([r[0] for r in sent] + [r[0] for r in received])
    partners = User.query.filter(User.id.in_(partner_ids)).all()
    
    conversations = []
    for partner in partners:
        last_msg = Message.query.filter(
            ((Message.sender_id == user_id) & (Message.receiver_id == partner.id)) |
            ((Message.sender_id == partner.id) & (Message.receiver_id == user_id))
        ).order_by(Message.timestamp.desc()).first()
        
        unread_count = Message.query.filter_by(
            sender_id=partner.id,
            receiver_id=user_id,
            read=False
        ).count()
        
        conversations.append({
            "partner": partner.to_dict(),
            "lastMessage": last_msg.to_dict() if last_msg else None,
            "unreadCount": unread_count
        })
    
    return jsonify(conversations), 200
