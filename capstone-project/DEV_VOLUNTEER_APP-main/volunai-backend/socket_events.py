from flask import request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import decode_token

socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")

# Store connected users: user_id -> sid
connected_users = {}

@socketio.on("connect")
def handle_connect():
    print(f"Client connected: {request.sid}")

@socketio.on("disconnect")
def handle_disconnect():
    print(f"Client disconnected: {request.sid}")
    # Remove from connected tracking
    for user_id, sid in list(connected_users.items()):
        if sid == request.sid:
            del connected_users[user_id]
            break

@socketio.on("authenticate")
def handle_authenticate(data):
    """Authenticate WebSocket connection using JWT"""
    token = data.get("token")
    if not token:
        return False
        
    try:
        decoded = decode_token(token)
        user_id = str(decoded["sub"])
        
        # Track connection and join personal room
        connected_users[user_id] = request.sid
        join_room(f"user_{user_id}")
        
        emit("authenticated", {"status": "success", "userId": user_id})
        print(f"User {user_id} authenticated on socket {request.sid}")
    except Exception as e:
        print(f"WebSocket auth failed: {e}")
        emit("error", {"message": "Authentication failed"})

@socketio.on("join_request_room")
def handle_join_request(data):
    """Join a chat room specific to an assistance request"""
    request_id = data.get("requestId")
    if request_id:
        room = f"request_{request_id}"
        join_room(room)
        print(f"Socket {request.sid} joined room {room}")

@socketio.on("leave_request_room")
def handle_leave_request(data):
    request_id = data.get("requestId")
    if request_id:
        room = f"request_{request_id}"
        leave_room(room)

def emit_notification(user_id, notification_data):
    """Utility to push a notification to a specific user"""
    room = f"user_{user_id}"
    socketio.emit("new_notification", notification_data, room=room)

def emit_chat_message(recipient_id, message_data, request_id=None):
    """Utility to push a chat message"""
    # Push to personal room so it shows up in general notifications/badges
    socketio.emit("new_message", message_data, room=f"user_{recipient_id}")
    
    # Also push to the specific request chat room if applicable
    if request_id:
        socketio.emit("chat_update", message_data, room=f"request_{request_id}")
