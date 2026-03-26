from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from models import User

def require_role(*roles):
    """
    Decorator to restrict access to specific roles.
    Assumes @jwt_required() has already been called.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))
            
            if not user:
                return jsonify({"error": "User not found"}), 404
                
            # Admins can do anything
            if user.role == "admin" or user.role in roles:
                return fn(*args, **kwargs)
                
            return jsonify({"error": "Unauthorized role"}), 403
        return decorator
    return wrapper

def verified_required(fn):
    """
    Decorator to restrict access only to VERIFIED users/volunteers.
    Assumes @jwt_required() has already been called.
    """
    @wraps(fn)
    def decorator(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Admins bypass verification check
        if user.role == "admin" or user.verification_status == "VERIFIED":
            return fn(*args, **kwargs)
            
        return jsonify({"error": "Account verification pending or rejected"}), 403
    return decorator

def require_ownership_or_admin(id_param_name):
    """
    Protects a route so only an 'admin' or the owner of the resource can access it.
    Expects the route to have a variable matching `id_param_name`.
    If checking 'vid' or 'volunteer_id', it links the volunteer's email to the user's email.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = User.query.get(int(current_user_id))
            
            if not user:
                return jsonify({"error": "User not found"}), 404
                
            if user.role == "admin":
                return fn(*args, **kwargs)
                
            target_id = kwargs.get(id_param_name)
            
            # Special case for Volunteer ID mappings (User ID != Volunteer ID)
            if id_param_name in ['vid', 'volunteer_id']:
                from models import Volunteer
                vol = Volunteer.query.get(target_id)
                if not vol or vol.email != user.email:
                    return jsonify({
                        "error": "Forbidden", 
                        "message": "You do not have permission to access or modify this resource."
                    }), 403
            else:
                if str(current_user_id) != str(target_id):
                    return jsonify({
                        "error": "Forbidden", 
                        "message": "You do not have permission to access or modify this resource."
                    }), 403
                
            return fn(*args, **kwargs)
        return decorator
    return wrapper
