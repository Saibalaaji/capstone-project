"""
Standalone Demo Seed Script for CVAS
Run with: python seed.py
"""
import os
from app import create_app
from models import db, User, Volunteer, AssistanceRequest, Assignment, Message, Notification, VolunteerRating
from datetime import datetime, timedelta

def seed_database():
    app = create_app()
    with app.app_context():
        print("Dropping all existing tables...")
        db.drop_all()
        
        print("Creating all tables from scratch...")
        db.create_all()

        print("Seeding Users...")
        # 1 Admin
        admin = User(name="Admin Supremo", email="admin@cvas.com", contact_number="555-9999", location="System HQ", role="admin", is_verified=True, verification_status="VERIFIED")
        admin.set_password("admin123")
        
        # 2 Community Users
        user1 = User(name="Alice Community", email="alice@cvas.com", contact_number="555-0001", location="Downtown", role="user", is_verified=True, verification_status="VERIFIED")
        user1.set_password("user123")
        
        user2 = User(name="Bob Community", email="bob@cvas.com", contact_number="555-0002", location="North Hills", role="user", is_verified=True, verification_status="VERIFIED")
        user2.set_password("user123")
        
        db.session.add_all([admin, user1, user2])
        db.session.commit()
        
        print("Seeding Volunteers...")
        # 3 Verified Volunteers (User + Profile)
        v_user1 = User(name="Charlie Volunteer", email="charlie@cvas.com", contact_number="555-1001", location="Downtown", role="volunteer", is_verified=True, verification_status="VERIFIED")
        v_user1.set_password("vol123")
        
        v_user2 = User(name="Diana Volunteer", email="diana@cvas.com", contact_number="555-1002", location="Westside", role="volunteer", is_verified=True, verification_status="VERIFIED")
        v_user2.set_password("vol123")
        
        v_user3 = User(name="Evan Volunteer", email="evan@cvas.com", contact_number="555-1003", location="Eastside", role="volunteer", is_verified=True, verification_status="VERIFIED")
        v_user3.set_password("vol123")
        
        db.session.add_all([v_user1, v_user2, v_user3])
        db.session.commit()

        vol1 = Volunteer(name=v_user1.name, email=v_user1.email, phone=v_user1.contact_number, location=v_user1.location, rating=4.9, active=True, availability_status="AVAILABLE", is_verified=True, verification_status="VERIFIED", completed_tasks=12, reliability_score=98.0, acceptance_rate=0.95)
        vol1.set_available_days(["Monday", "Wednesday", "Friday"])
        vol1.set_service_types(["Medical Assistance", "Transportation"])
        
        vol2 = Volunteer(name=v_user2.name, email=v_user2.email, phone=v_user2.contact_number, location=v_user2.location, rating=4.7, active=True, availability_status="BUSY", is_verified=True, verification_status="VERIFIED", completed_tasks=34, reliability_score=95.0, acceptance_rate=0.88)
        vol2.set_available_days(["Tuesday", "Thursday", "Weekend"])
        vol2.set_service_types(["Food Delivery", "Companionship"])
        
        vol3 = Volunteer(name=v_user3.name, email=v_user3.email, phone=v_user3.contact_number, location=v_user3.location, rating=5.0, active=True, availability_status="AVAILABLE", is_verified=True, verification_status="VERIFIED", completed_tasks=5, reliability_score=100.0, acceptance_rate=1.0)
        vol3.set_available_days(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
        vol3.set_service_types(["Technical Support", "Home Repair"])
        
        db.session.add_all([vol1, vol2, vol3])
        db.session.commit()

        print("Seeding Assistance Requests...")
        # 3 Help Requests
        req1 = AssistanceRequest(requester_name=user1.name, requester_contact=user1.contact_number, location=user1.location, service_type="Medical Assistance", description="Need a ride to the physical therapy clinic.", urgency_level="High", status="PENDING")
        
        req2 = AssistanceRequest(requester_name=user2.name, requester_contact=user2.contact_number, location=user2.location, service_type="Food Delivery", description="Need groceries delivered for the week. List is ready.", urgency_level="Medium", status="ASSIGNED", assigned_volunteer_id=vol2.id)
        
        req3 = AssistanceRequest(requester_name=user1.name, requester_contact=user1.contact_number, location=user1.location, service_type="Home Repair", description="The sink is leaking and I cannot fix it myself.", urgency_level="Low", status="PENDING")
        
        db.session.add_all([req1, req2, req3])
        db.session.commit()

        print("Seeding Assignments...")
        # Create assignment for req2
        assign1 = Assignment(request_id=req2.id, volunteer_id=vol2.id, status="ACCEPTED", timestamp=datetime.utcnow() - timedelta(hours=2))
        db.session.add(assign1)
        db.session.commit()
        
        print("🎉 Database successfully seeded! Ready for Launch Prep Demo.")

if __name__ == "__main__":
    seed_database()
