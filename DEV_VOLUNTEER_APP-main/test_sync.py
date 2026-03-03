#!/usr/bin/env python3
"""
VolunAI Synchronization Test Script
Tests the full workflow synchronization between Admin and Volunteer dashboards
"""

import requests
import json
import time

API_BASE = "http://localhost:5000/api"

def test_request_creation_and_sync():
    """Test that requests appear in all relevant dashboards"""
    print("=== Testing Request Creation & Synchronization ===")
    
    # 1. Create a test request
    request_data = {
        "requesterName": "Test User",
        "requesterContact": "test@example.com",
        "location": "New York",
        "serviceType": "Food Delivery",
        "urgencyLevel": "HIGH",
        "description": "Need urgent food delivery for elderly person"
    }
    
    print("1. Creating test request...")
    response = requests.post(f"{API_BASE}/requests", json=request_data)
    if response.status_code == 201:
        request_id = response.json()["request"]["id"]
        print(f"   ✓ Request created with ID: {request_id}")
    else:
        print(f"   ✗ Failed to create request: {response.text}")
        return
    
    # 2. Check if request appears in admin dashboard
    print("2. Checking admin dashboard...")
    response = requests.get(f"{API_BASE}/requests")
    if response.status_code == 200:
        requests_list = response.json()
        found = any(r["id"] == request_id for r in requests_list)
        print(f"   {'✓' if found else '✗'} Request visible in admin dashboard")
    
    # 3. Check if request appears in volunteer dashboards
    print("3. Checking volunteer dashboards...")
    volunteers_response = requests.get(f"{API_BASE}/volunteers")
    if volunteers_response.status_code == 200:
        volunteers = volunteers_response.json()
        for vol in volunteers[:2]:  # Test first 2 volunteers
            vol_requests = requests.get(f"{API_BASE}/volunteers/{vol['id']}/requests")
            if vol_requests.status_code == 200:
                vol_request_list = vol_requests.json()
                found = any(r["id"] == request_id for r in vol_request_list)
                print(f"   {'✓' if found else '✗'} Request visible to volunteer {vol['name']}")
    
    return request_id

def test_volunteer_acceptance_sync(request_id):
    """Test that volunteer acceptance updates all dashboards"""
    print("\n=== Testing Volunteer Acceptance Synchronization ===")
    
    # Get first available volunteer
    volunteers_response = requests.get(f"{API_BASE}/volunteers")
    if volunteers_response.status_code != 200:
        print("   ✗ Failed to get volunteers")
        return
    
    volunteers = volunteers_response.json()
    volunteer_id = volunteers[0]["id"]
    volunteer_name = volunteers[0]["name"]
    
    print(f"1. Volunteer {volunteer_name} accepting request {request_id}...")
    response = requests.post(f"{API_BASE}/requests/{request_id}/accept/{volunteer_id}")
    
    if response.status_code == 200:
        print("   ✓ Request accepted successfully")
    else:
        print(f"   ✗ Failed to accept request: {response.text}")
        return
    
    # Check if status updated in admin dashboard
    print("2. Checking admin dashboard for status update...")
    response = requests.get(f"{API_BASE}/requests")
    if response.status_code == 200:
        requests_list = response.json()
        request = next((r for r in requests_list if r["id"] == request_id), None)
        if request and request["status"] == "ASSIGNED":
            print(f"   ✓ Status updated to ASSIGNED in admin dashboard")
            print(f"   ✓ Assigned to: {request.get('assigned_volunteer_name', 'Unknown')}")
        else:
            print("   ✗ Status not updated in admin dashboard")
    
    # Check if other volunteers see it as assigned
    print("3. Checking other volunteer dashboards...")
    for vol in volunteers[1:3]:  # Check other volunteers
        vol_requests = requests.get(f"{API_BASE}/volunteers/{vol['id']}/requests")
        if vol_requests.status_code == 200:
            vol_request_list = vol_requests.json()
            request = next((r for r in vol_request_list if r["id"] == request_id), None)
            if request:
                can_accept = request.get("can_accept", False)
                assigned_to = request.get("assigned_volunteer", "Unknown")
                print(f"   {'✓' if not can_accept else '✗'} Volunteer {vol['name']} sees task as assigned to {assigned_to}")
    
    return volunteer_id

def test_completion_sync(request_id, volunteer_id):
    """Test that task completion updates all dashboards"""
    print("\n=== Testing Task Completion Synchronization ===")
    
    print(f"1. Volunteer completing request {request_id}...")
    response = requests.post(f"{API_BASE}/requests/{request_id}/complete/{volunteer_id}")
    
    if response.status_code == 200:
        print("   ✓ Request completed successfully")
    else:
        print(f"   ✗ Failed to complete request: {response.text}")
        return
    
    # Check admin dashboard
    print("2. Checking admin dashboard for completion...")
    response = requests.get(f"{API_BASE}/requests")
    if response.status_code == 200:
        requests_list = response.json()
        request = next((r for r in requests_list if r["id"] == request_id), None)
        if request and request["status"] == "COMPLETED":
            print("   ✓ Status updated to COMPLETED in admin dashboard")
        else:
            print("   ✗ Status not updated in admin dashboard")
    
    # Check volunteer dashboards
    print("3. Checking volunteer dashboards for completion...")
    volunteers_response = requests.get(f"{API_BASE}/volunteers")
    if volunteers_response.status_code == 200:
        volunteers = volunteers_response.json()
        for vol in volunteers[:2]:
            vol_requests = requests.get(f"{API_BASE}/volunteers/{vol['id']}/requests")
            if vol_requests.status_code == 200:
                vol_request_list = vol_requests.json()
                request = next((r for r in vol_request_list if r["id"] == request_id), None)
                if request and request["status"] == "COMPLETED":
                    print(f"   ✓ Volunteer {vol['name']} sees task as completed")

def main():
    print("VolunAI Synchronization Test")
    print("=" * 50)
    
    try:
        # Test the full workflow
        request_id = test_request_creation_and_sync()
        if request_id:
            volunteer_id = test_volunteer_acceptance_sync(request_id)
            if volunteer_id:
                test_completion_sync(request_id, volunteer_id)
        
        print("\n" + "=" * 50)
        print("Synchronization test completed!")
        print("Check the frontend dashboards to verify real-time updates.")
        
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to backend server.")
        print("Make sure the Flask backend is running on http://localhost:5000")
    except Exception as e:
        print(f"✗ Test failed with error: {e}")

if __name__ == "__main__":
    main()