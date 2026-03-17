"""
Seed data — identical to the Java DataInitializationService so the
frontend demo experience is exactly the same.
"""
from models import db, Volunteer, AssistanceRequest, User


def init_sample_data():
    """Populate the database with sample volunteers and requests if empty."""
    if Volunteer.query.count() > 0:
        return
    
    # Create sample users
    admin = User(name="Admin User", email="admin@cvas.com", contact_number="555-0001", location="New York", role="admin")
    admin.set_password("admin123")
    db.session.add(admin)
    
    user1 = User(name="John Doe", email="user@cvas.com", contact_number="555-0002", location="Brooklyn", role="user")
    user1.set_password("user123")
    db.session.add(user1)
    
    db.session.commit()

    volunteers = [
        _vol("Dr. Sarah Johnson", "sarah.johnson@email.com", "555-0101",
             "New York", ["Monday", "Wednesday", "Friday", "Saturday"],
             ["Medical Assistance", "Transportation", "Companionship"], 4.8),
        _vol("Michael Chen", "michael.chen@email.com", "555-0102",
             "New York", ["Tuesday", "Thursday", "Saturday", "Sunday"],
             ["Food Delivery", "Shopping Assistance", "Transportation"], 4.6),
        _vol("Emily Rodriguez", "emily.rodriguez@email.com", "555-0103",
             "Brooklyn", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
             ["Food Delivery", "Pet Care", "Home Repair", "Cleaning Services"], 4.5),
        _vol("James Wilson", "james.wilson@email.com", "555-0104",
             "Manhattan", ["Weekend", "Evening"],
             ["Companionship", "Medical Assistance", "Childcare"], 4.9),
        _vol("Lisa Anderson", "lisa.anderson@email.com", "555-0105",
             "Queens", ["Monday", "Wednesday", "Friday"],
             ["Technical Support", "Home Repair", "Transportation"], 4.3),
        _vol("David Martinez", "david.martinez@email.com", "555-0106",
             "Bronx", ["Tuesday", "Thursday", "Saturday"],
             ["Pet Care", "Transportation", "Shopping Assistance"], 4.7),
        _vol("Jennifer Taylor", "jennifer.taylor@email.com", "555-0107",
             "New York", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
             ["Childcare", "Companionship", "Educational Support"], 4.8),
        _vol("Robert Brown", "robert.brown@email.com", "555-0108",
             "Brooklyn", ["Saturday", "Sunday"],
             ["Home Repair", "Cleaning Services", "Heavy Lifting"], 4.4),
        _vol("Maria Garcia", "maria.garcia@email.com", "555-0109",
             "Queens", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
             ["Transportation", "Shopping Assistance", "Food Delivery"], 4.6),
        _vol("Thomas Lee", "thomas.lee@email.com", "555-0110",
             "Manhattan", ["Flexible", "Weekend"],
             ["Food Delivery", "Companionship", "Pet Care", "Technical Support"], 4.2),
    ]
    db.session.add_all(volunteers)

    requests = [
        _req("Alice Smith", "555-0201", "Manhattan", "Medical Assistance",
             "Elderly person needs medication pickup from pharmacy urgently", "HIGH"),
        _req("Bob Johnson", "555-0202", "Brooklyn", "Food Delivery",
             "Need grocery delivery for family with COVID-19 quarantine", "MEDIUM"),
        _req("Carol Williams", "555-0203", "Queens", "Pet Care",
             "Need someone to walk dog twice daily while recovering from surgery", "MEDIUM"),
        _req("Daniel Davis", "555-0204", "Bronx", "Technical Support",
             "Senior citizen needs help setting up video call for family reunion", "LOW"),
        _req("Eva Martinez", "555-0205", "Manhattan", "Home Repair",
             "Need help fixing leaky faucet in kitchen", "MEDIUM"),
    ]
    db.session.add_all(requests)
    db.session.commit()
    print(f"[OK] Sample data initialised -- {len(volunteers)} volunteers, {len(requests)} requests")


# ── helper factories ──────────────────────────────────────────────────
def _vol(name, email, phone, location, days, services, rating):
    v = Volunteer(name=name, email=email, phone=phone,
                  location=location, rating=rating, active=True)
    v.set_available_days(days)
    v.set_service_types(services)
    return v


def _req(name, contact, location, stype, desc, urgency):
    return AssistanceRequest(
        requester_name=name, requester_contact=contact,
        location=location, service_type=stype,
        description=desc, urgency_level=urgency, status="PENDING")
