from flask import Blueprint, request, jsonify
from models import db, Notification

bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")

@bp.route("/<int:user_id>", methods=["GET"])
def get_notifications(user_id):
    status = request.args.get("status")
    query = Notification.query.filter_by(user_id=user_id)
    
    if status:
        query = query.filter_by(status=status)
    
    notifications = query.order_by(Notification.timestamp.desc()).all()
    return jsonify([n.to_dict() for n in notifications]), 200

@bp.route("/<int:notification_id>/read", methods=["PUT"])
def mark_read(notification_id):
    notification = Notification.query.get_or_404(notification_id)
    notification.status = "read"
    db.session.commit()
    return jsonify(notification.to_dict()), 200

@bp.route("/user/<int:user_id>/mark-all-read", methods=["PUT"])
def mark_all_read(user_id):
    Notification.query.filter_by(user_id=user_id, status="unread").update({"status": "read"})
    db.session.commit()
    return jsonify({"message": "All notifications marked as read"}), 200

@bp.route("/<int:notification_id>", methods=["DELETE"])
def delete_notification(notification_id):
    notification = Notification.query.get_or_404(notification_id)
    db.session.delete(notification)
    db.session.commit()
    return jsonify({"message": "Notification deleted"}), 200
