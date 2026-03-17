"""
CVAS — Community Volunteer Assistance & Coordination System
Python ML Backend
Flask application entry-point.
"""
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db
from data_init import init_sample_data
from routes import volunteers, requests, ai, assignments, auth, chat, notifications, approvals


def create_app():
    app = Flask(__name__)

    # ── Configuration ──
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///volunai.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = "cvas-secret-key-2025"  # Change in production
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False  # Tokens don't expire for demo

    # ── Extensions ──
    db.init_app(app)
    CORS(app)  # allow React dev-server origin
    JWTManager(app)

    # ── Register API blueprints ──
    app.register_blueprint(auth.bp)
    app.register_blueprint(volunteers.bp)
    app.register_blueprint(requests.bp)
    app.register_blueprint(ai.bp)
    app.register_blueprint(assignments.bp)
    app.register_blueprint(chat.bp)
    app.register_blueprint(notifications.bp)
    app.register_blueprint(approvals.bp)

    # ── Create tables & seed data on first run ──
    with app.app_context():
        db.create_all()
        init_sample_data()

    return app


if __name__ == "__main__":
    app = create_app()
    print("=" * 60)
    print("  CVAS — Community Volunteer Assistance & Coordination System")
    print("  Server running on http://localhost:5000")
    print("  API docs: http://localhost:5000/api/")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5000, debug=True)
