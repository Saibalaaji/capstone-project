"""
CVAS — Community Volunteer Assistance & Coordination System
Python ML Backend
Flask application entry-point.
"""
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from models import db, User
from data_init import init_sample_data
import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

from routes import volunteers, requests, ai, assignments, auth, chat, notifications, approvals, verification, ratings, admin
from socket_events import socketio

def create_app():
    app = Flask(__name__)

    # ── Configuration ──
    # Load config based on environment variable (default to development)
    env = os.environ.get("FLASK_ENV", "development")
    if env == "production":
        app.config.from_object('config.ProductionConfig')
    else:
        app.config.from_object('config.DevelopmentConfig')

    # Ensure upload directory exists locally
    if not app.config.get("USE_S3", False):
        os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'ids'), exist_ok=True)

    # ── Extensions ──
    db.init_app(app)
    # FIX BUG-03: restrict CORS to trusted origins only — was CORS(app) which allows all domains
    allowed_origins = [
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # CRA dev server (fallback)
        "http://127.0.0.1:5173",
        os.environ.get("FRONTEND_URL", ""),  # Production frontend URL from env
    ]
    CORS(app, origins=[o for o in allowed_origins if o])
    JWTManager(app)
    socketio.init_app(app)
    limiter.init_app(app)

    # ── Register API blueprints ──
    app.register_blueprint(auth.bp)
    app.register_blueprint(volunteers.bp)
    app.register_blueprint(requests.bp)
    app.register_blueprint(ai.bp)
    app.register_blueprint(assignments.bp)
    app.register_blueprint(chat.bp)
    app.register_blueprint(notifications.bp)
    app.register_blueprint(approvals.bp)
    app.register_blueprint(verification.bp)
    app.register_blueprint(ratings.bp)
    app.register_blueprint(admin.bp)

    # FIX BUG-05: added JWT + admin-role check before serving ID proof files.
    # Previously this route was completely public — anyone with a filename could download private IDs.
    @app.route('/api/admin/verification/proof/<filename>')
    @jwt_required()
    def serve_id_proof(filename):
        caller_id = get_jwt_identity()
        caller = User.query.get(int(caller_id))
        if not caller or caller.role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return send_from_directory(os.path.join(app.config['UPLOAD_FOLDER'], 'ids'), filename)

    # ── Create tables & seed data on first run ──
    with app.app_context():
        db.create_all()
        _run_migrations(db)   # safe column additions for existing DBs
        # Create default mock data if not exists
        init_sample_data()

    return app


def _run_migrations(db):
    """Safe inline migrations — add new columns without touching existing data."""
    import sqlalchemy as sa
    with db.engine.connect() as conn:
        # assignments.assigned_by (added in v2)
        try:
            conn.execute(sa.text(
                "ALTER TABLE assignments ADD COLUMN assigned_by VARCHAR(20) DEFAULT 'SYSTEM'"
            ))
            conn.commit()
            print("[migration] Added assignments.assigned_by column")
        except Exception:
            pass  # column already exists — ignore

        # Add deleted_at columns for soft deletes
        try:
            conn.execute(sa.text("ALTER TABLE users ADD COLUMN deleted_at DATETIME"))
            conn.commit()
        except Exception: pass
        
        try:
            conn.execute(sa.text("ALTER TABLE volunteers ADD COLUMN deleted_at DATETIME"))
            conn.commit()
        except Exception: pass

        # Add AI verification fields
        try:
            conn.execute(sa.text("ALTER TABLE users ADD COLUMN ai_doc_type VARCHAR(50)"))
            conn.commit()
        except Exception: pass
        try:
            conn.execute(sa.text("ALTER TABLE users ADD COLUMN ai_confidence FLOAT"))
            conn.commit()
        except Exception: pass
        
        try:
            conn.execute(sa.text("ALTER TABLE volunteers ADD COLUMN ai_doc_type VARCHAR(50)"))
            conn.commit()
        except Exception: pass
        try:
            conn.execute(sa.text("ALTER TABLE volunteers ADD COLUMN ai_confidence FLOAT"))
            conn.commit()
        except Exception: pass

        # FIX BUG-04: REMOVED auto-verify logic that was running on every server restart.
        # Previously this UPDATE forced ALL users and volunteers to VERIFIED on startup,
        # making the entire verification workflow non-functional.
        # The verification flow now works exclusively through admin approval (admin.py).




if __name__ == "__main__":
    app = create_app()
    print("=" * 60)
    print("  CVAS — Community Volunteer Management System")
    print("  Server running on http://localhost:5000")
    print("  WebSocket server active")
    print("  API docs: http://localhost:5000/api/")
    print("=" * 60)
    socketio.run(app, host="0.0.0.0", port=5000, debug=app.config["DEBUG"], allow_unsafe_werkzeug=True)
