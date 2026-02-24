# API Testing Examples

This file contains sample API requests for testing the Volunteer Assistance Coordination System.

## Prerequisites
- Application running on http://localhost:8080
- MongoDB running on localhost:27017

---

## Volunteer APIs

### 1. Create Volunteer
```bash
curl -X POST http://localhost:8080/api/volunteers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "1234567890",
    "location": "New York",
    "availableDays": ["Monday", "Wednesday", "Friday"],
    "serviceType": ["Food Delivery", "Medical Assistance"],
    "rating": 4.5,
    "active": true
  }'
```

### 2. Create Another Volunteer
```bash
curl -X POST http://localhost:8080/api/volunteers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "0987654321",
    "location": "New York",
    "availableDays": ["Tuesday", "Thursday", "Saturday"],
    "serviceType": ["Food Delivery", "Transportation"],
    "rating": 4.8,
    "active": true
  }'
```

### 3. Get All Volunteers
```bash
curl -X GET http://localhost:8080/api/volunteers
```

### 4. Get Volunteer by ID
```bash
curl -X GET http://localhost:8080/api/volunteers/{volunteerId}
```

### 5. Get Active Volunteers
```bash
curl -X GET http://localhost:8080/api/volunteers/active
```

### 6. Update Volunteer
```bash
curl -X PUT http://localhost:8080/api/volunteers/{volunteerId} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe Updated",
    "email": "john.doe@example.com",
    "phone": "1234567890",
    "location": "Brooklyn, New York",
    "availableDays": ["Monday", "Wednesday", "Friday", "Sunday"],
    "serviceType": ["Food Delivery", "Medical Assistance", "Tutoring"],
    "rating": 4.7,
    "active": true
  }'
```

### 7. Delete Volunteer
```bash
curl -X DELETE http://localhost:8080/api/volunteers/{volunteerId}
```

---

## Assistance Request APIs

### 1. Create Assistance Request (Returns Top 3 Volunteers)
```bash
curl -X POST http://localhost:8080/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "requesterName": "Alice Johnson",
    "requesterContact": "5551234567",
    "location": "New York",
    "serviceType": "Food Delivery",
    "description": "Need food delivery for elderly person who cannot leave home",
    "urgencyLevel": "HIGH"
  }'
```

### 2. Create Another Request
```bash
curl -X POST http://localhost:8080/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "requesterName": "Bob Williams",
    "requesterContact": "5559876543",
    "location": "Brooklyn",
    "serviceType": "Medical Assistance",
    "description": "Need help with medical appointment transportation",
    "urgencyLevel": "MEDIUM"
  }'
```

### 3. Get All Requests
```bash
curl -X GET http://localhost:8080/api/requests
```

### 4. Get Request by ID
```bash
curl -X GET http://localhost:8080/api/requests/{requestId}
```

### 5. Get Requests by Status
```bash
# Get pending requests
curl -X GET http://localhost:8080/api/requests/status/PENDING

# Get assigned requests
curl -X GET http://localhost:8080/api/requests/status/ASSIGNED

# Get completed requests
curl -X GET http://localhost:8080/api/requests/status/COMPLETED
```

### 6. Update Request Status
```bash
curl -X PATCH http://localhost:8080/api/requests/{requestId}/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED"
  }'
```

### 7. Assign Volunteer to Request
```bash
curl -X POST http://localhost:8080/api/requests/{requestId}/assign/{volunteerId}
```

### 8. Delete Request
```bash
curl -X DELETE http://localhost:8080/api/requests/{requestId}
```

---

## Testing Workflow

### Complete Test Scenario

1. **Create 3 volunteers with different attributes:**
   - Volunteer 1: New York, Food Delivery, Rating 4.5
   - Volunteer 2: New York, Medical Assistance, Rating 4.8
   - Volunteer 3: Brooklyn, Food Delivery, Rating 4.2

2. **Create an assistance request:**
   - Location: New York
   - Service Type: Food Delivery
   - Urgency: HIGH
   - **Expected:** Response includes top 3 volunteers ranked by match score

3. **Assign the best-matched volunteer:**
   - Use the volunteer ID from the suggested volunteers
   - **Expected:** Request status changes to ASSIGNED

4. **Update request status to COMPLETED:**
   - **Expected:** Request status changes to COMPLETED

5. **Verify the workflow:**
   - Get all requests and check statuses
   - Get requests by status (PENDING, ASSIGNED, COMPLETED)

---

## Expected Response Examples

### Create Request Response (with AI Matching)
```json
{
  "request": {
    "id": "65abc123def456789",
    "requesterName": "Alice Johnson",
    "requesterContact": "5551234567",
    "location": "New York",
    "serviceType": "Food Delivery",
    "description": "Need food delivery for elderly person",
    "urgencyLevel": "HIGH",
    "status": "PENDING",
    "assignedVolunteerId": null
  },
  "suggestedVolunteers": [
    {
      "volunteer": {
        "id": "65xyz789abc123456",
        "name": "Jane Smith",
        "email": "jane.smith@example.com",
        "phone": "0987654321",
        "location": "New York",
        "availableDays": ["Tuesday", "Thursday", "Saturday"],
        "serviceType": ["Food Delivery", "Transportation"],
        "rating": 4.8,
        "active": true
      },
      "matchScore": 0.88
    },
    {
      "volunteer": {
        "id": "65def456ghi789012",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "1234567890",
        "location": "New York",
        "availableDays": ["Monday", "Wednesday", "Friday"],
        "serviceType": ["Food Delivery", "Medical Assistance"],
        "rating": 4.5,
        "active": true
      },
      "matchScore": 0.85
    },
    {
      "volunteer": {
        "id": "65ghi012jkl345678",
        "name": "Mike Brown",
        "email": "mike.brown@example.com",
        "phone": "5556667777",
        "location": "Brooklyn",
        "availableDays": ["Monday", "Tuesday", "Wednesday"],
        "serviceType": ["Food Delivery"],
        "rating": 4.2,
        "active": true
      },
      "matchScore": 0.72
    }
  ]
}
```

### Error Response Example
```json
{
  "timestamp": "2026-02-11T22:50:00",
  "status": 404,
  "error": "Not Found",
  "message": "Volunteer not found with id: 123456",
  "path": "/api/volunteers/123456"
}
```

---

## Notes

- Replace `{volunteerId}` and `{requestId}` with actual IDs from your responses
- All timestamps are in ISO 8601 format
- Match scores range from 0.0 to 1.0
- The AI matching algorithm automatically ranks volunteers based on the scoring criteria
