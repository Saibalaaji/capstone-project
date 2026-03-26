import os
import io
import json
import pytest
from app import create_app
from models import db, User, Volunteer

@pytest.fixture
def client():
    # Force testing configuration
    os.environ['FLASK_ENV'] = 'development'
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['WTF_CSRF_ENABLED'] = False

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            
            # Create an admin user for testing
            admin = User(
                name="Admin Test",
                email="admin@test.com",
                role="admin",
                is_verified=True,
                verification_status="VERIFIED"
            )
            admin.set_password("adminpass")
            db.session.add(admin)
            db.session.commit()
            
        yield client

def login(client, email, password):
    res = client.post('/api/auth/login', json={'email': email, 'password': password})
    return res.get_json()['token']

def test_user_registration_pending_status(client):
    # Test normal user registration
    res = client.post('/api/auth/register', data={
        'name': 'Test User',
        'email': 'user@test.com',
        'password': 'password123',
        'role': 'user'
    }) # no ID proof required for just registration in tests depending on implementation, 
       # but auth.py says ID is optional or handles without it if not present, wait let's check auth.py
    
    assert res.status_code == 201
    data = res.get_json()
    assert data['user']['verification_status'] == 'PENDING'

    # Ensure unverified user is blocked from creating a request
    token = login(client, 'user@test.com', 'password123')
    req_res = client.post('/api/requests', json={
        'requester_name': 'Test User',
        'requester_contact': '123',
        'location': 'NY',
        'service_type': 'Other',
        'description': 'Help'
    }, headers={'Authorization': f'Bearer {token}'})
    
    # Should get 403 Forbidden because they are PENDING
    assert req_res.status_code == 403

def test_admin_verification_workflow(client):
    # Register a new volunteer
    client.post('/api/auth/register', data={
        'name': 'Pending Vol',
        'email': 'vol@test.com',
        'password': 'password123',
        'role': 'volunteer'
    })
    
    # Login as admin
    admin_token = login(client, 'admin@test.com', 'adminpass')
    
    # Check pending list
    res = client.get('/api/admin/verification/pending', headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 200
    pending_users = res.get_json()
    assert len(pending_users) == 1
    assert pending_users[0]['email'] == 'vol@test.com'
    
    vol_id = pending_users[0]['id']
    
    # Approve volunteer
    approve_res = client.post(f'/api/admin/verification/{vol_id}/approve', headers={'Authorization': f'Bearer {admin_token}'})
    assert approve_res.status_code == 200
    
    # Verify they are no longer pending
    res = client.get('/api/admin/verification/pending', headers={'Authorization': f'Bearer {admin_token}'})
    assert len(res.get_json()) == 0

    # Ensure the volunteer is VERIFIED in the DB
    with client.application.app_context():
        vol = Volunteer.query.filter_by(email='vol@test.com').first()
        assert vol.verification_status == 'VERIFIED'
        assert vol.is_verified == True
