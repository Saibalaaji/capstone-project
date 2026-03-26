from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Message, Notification, User
from routes.rbac import require_ownership_or_admin
from socket_events import emit_chat_message, emit_notification
from datetime import datetime

bp = Blueprint("chat", __name__, url_prefix="/api/chat")

@bp.route("/messages", methods=["POST"])
@jwt_required()
def send_message():
    current_user_id = int(get_jwt_identity())
    data = request.json
    
    message = Message(
        sender_id=current_user_id,
        receiver_id=data["receiverId"],
        request_id=data.get("requestId"),
        message_text=data["messageText"]
    )

    db.session.add(message)
    # FIX BUG-08: flush to get message.id from DB before creating the notification.
    # Previously notification.related_id was always None because message.id had not been assigned yet.
    db.session.flush()

    # Create notification for receiver
    receiver = User.query.get(data["receiverId"])
    sender = User.query.get(current_user_id)

    notification = Notification(
        user_id=data["receiverId"],
        message=f"New message from {sender.name}",
        notification_type="NEW_MESSAGE",
        related_id=message.id  # now valid after flush
    )

    db.session.add(notification)
    db.session.commit()
    
    # Emit real-time events via WebSockets
    msg_dict = message.to_dict()
    emit_chat_message(data["receiverId"], msg_dict, data.get("requestId"))
    
    notif_dict = notification.to_dict()
    notif_dict["notificationType"] = "NEW_MESSAGE"
    emit_notification(data["receiverId"], notif_dict)
    
    return jsonify(msg_dict), 201

@bp.route("/messages", methods=["GET"])
@jwt_required()
def get_messages():
    current_user_id = int(get_jwt_identity())
    other_user_id = request.args.get("otherUserId", type=int)
    request_id = request.args.get("requestId", type=int)
    
    query = Message.query
    
    if other_user_id:
        query = query.filter(
            ((Message.sender_id == current_user_id) & (Message.receiver_id == other_user_id)) |
            ((Message.sender_id == other_user_id) & (Message.receiver_id == current_user_id))
        )
    elif request_id:
        query = query.filter_by(request_id=request_id)
    
    messages = query.order_by(Message.timestamp.asc()).all()
    return jsonify([m.to_dict() for m in messages]), 200

@bp.route("/messages/<int:message_id>/read", methods=["PUT"])
@jwt_required()
def mark_read(message_id):
    current_user_id = int(get_jwt_identity())
    message = Message.query.get_or_404(message_id)
    
    # Ensure they are actually the recipient of the message
    if message.receiver_id != current_user_id:
        return jsonify({"error": "Forbidden"}), 403
        
    message.read = True
    db.session.commit()
    return jsonify(message.to_dict()), 200

@bp.route("/conversations/<int:user_id>", methods=["GET"])
@jwt_required()
@require_ownership_or_admin(id_param_name="user_id")
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
