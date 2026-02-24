# Volunteer Assistance Coordination System

A Spring Boot backend application for coordinating volunteers with assistance requests using AI-based matching algorithms.

## Tech Stack

- **Java 17**
- **Spring Boot 3.2.2**
- **H2 Database** (In-memory, active)
- **Spring Data JPA**
- **Spring Web**
- **Lombok**
- **Maven**

## Architecture

The application follows a layered architecture:

```
├── Controller Layer (REST APIs)
├── Service Layer (Business Logic)
├── Repository Layer (Data Access)
├── Model Layer (Domain Entities)
└── Utility Layer (AI Matching Logic)
```

## Features

### 1. Volunteer Management
- Create, update, retrieve, and delete volunteers
- Track volunteer availability, location, service types, and ratings
- Manage active/inactive status

### 2. Assistance Request Management
- Create and manage assistance requests
- Track request status (PENDING, ASSIGNED, COMPLETED)
- Assign volunteers to requests
- Filter requests by status

### 3. AI-Based Volunteer Matching
Intelligent matching algorithm that scores volunteers based on:
- **Availability Match (40%)** - Volunteer has available days
- **Service Type Match (30%)** - Volunteer offers the required service
- **Location Match (20%)** - Proximity to request location
- **Rating Weight (10%)** - Volunteer's performance rating

When creating a request, the system automatically returns the top 3 best-matched volunteers.

## Project Structure

```
volunteer-assistance-system/
├── src/
│   └── main/
│       ├── java/com/volunteer/
│       │   ├── controller/
│       │   │   ├── VolunteerController.java
│       │   │   └── AssistanceRequestController.java
│       │   ├── service/
│       │   │   ├── VolunteerService.java
│       │   │   └── AssistanceRequestService.java
│       │   ├── repository/
│       │   │   ├── VolunteerRepository.java
│       │   │   └── AssistanceRequestRepository.java
│       │   ├── model/
│       │   │   ├── Volunteer.java
│       │   │   ├── AssistanceRequest.java
│       │   │   ├── UrgencyLevel.java
│       │   │   ├── RequestStatus.java
│       │   │   └── UserRole.java
│       │   ├── dto/
│       │   │   ├── VolunteerMatch.java
│       │   │   └── AssistanceRequestResponse.java
│       │   ├── utility/
│       │   │   └── MatchingService.java
│       │   ├── exception/
│       │   │   ├── ResourceNotFoundException.java
│       │   │   ├── ErrorResponse.java
│       │   │   └── GlobalExceptionHandler.java
│       │   └── VolunteerAssistanceSystemApplication.java
│       └── resources/
│           └── application.properties
└── pom.xml
```

## API Endpoints

### Volunteer APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/volunteers` | Create a new volunteer |
| GET | `/api/volunteers` | Get all volunteers |
| GET | `/api/volunteers/{id}` | Get volunteer by ID |
| GET | `/api/volunteers/active` | Get all active volunteers |
| PUT | `/api/volunteers/{id}` | Update volunteer |
| DELETE | `/api/volunteers/{id}` | Delete volunteer |

### Assistance Request APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/requests` | Create request (returns top 3 volunteers) |
| GET | `/api/requests` | Get all requests |
| GET | `/api/requests/{id}` | Get request by ID |
| GET | `/api/requests/status/{status}` | Get requests by status |
| PATCH | `/api/requests/{id}/status` | Update request status |
| POST | `/api/requests/{requestId}/assign/{volunteerId}` | Assign volunteer to request |
| DELETE | `/api/requests/{id}` | Delete request |

## Configuration

### H2 Database Configuration (Active)
```properties
spring.datasource.url=jdbc:h2:mem:volunteer_db
spring.datasource.username=sa
spring.datasource.password=
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
```

**Access H2 Console:** `http://localhost:8080/h2-console`

### MongoDB (Available but Inactive)
To switch to MongoDB, update `pom.xml` and `application.properties`. See `H2_DATABASE_GUIDE.md` for details.

## Getting Started

### Prerequisites
- Java 17 or higher
- Maven 3.6+

### Installation

1. Clone the repository
2. Navigate to the project directory:
   ```bash
   cd volunteer-assistance-system
   ```

3. Build the project:
   ```bash
   mvn clean install
   ```

4. Run the application:
   ```bash
   mvn spring-boot:run
   ```

The application will start on `http://localhost:8080`

## Sample API Requests

### Create a Volunteer
```json
POST /api/volunteers
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "location": "New York",
  "availableDays": ["Monday", "Wednesday", "Friday"],
  "serviceType": ["Food Delivery", "Medical Assistance"],
  "rating": 4.5,
  "active": true
}
```

### Create an Assistance Request
```json
POST /api/requests
{
  "requesterName": "Jane Smith",
  "requesterContact": "0987654321",
  "location": "New York",
  "serviceType": "Food Delivery",
  "description": "Need food delivery for elderly person",
  "urgencyLevel": "HIGH"
}
```

**Response includes top 3 matched volunteers:**
```json
{
  "request": {
    "id": 1,
    "requesterName": "Jane Smith",
    ...
  },
  "suggestedVolunteers": [
    {
      "volunteer": {
        "id": 1,
        "name": "Jane Smith",
        ...
      },
      "matchScore": 0.88
    },
    ...
  ]
}
```

### Assign Volunteer to Request
```
POST /api/requests/{requestId}/assign/{volunteerId}
```

## Exception Handling

The application includes comprehensive exception handling:
- **ResourceNotFoundException** - Returns 404 when resources are not found
- **IllegalStateException** - Returns 400 for invalid operations
- **Validation Errors** - Returns 400 with detailed field errors
- **Global Exception Handler** - Catches all unexpected errors

## AI Matching Algorithm

The `MatchingService` calculates a match score (0.0 to 1.0) for each volunteer:

```
Total Score = (Availability × 0.40) + (Service Type × 0.30) + 
              (Location × 0.20) + (Rating × 0.10)
```

- **Availability**: 1.0 if volunteer has available days, 0.0 otherwise
- **Service Type**: 1.0 if exact match, 0.0 otherwise
- **Location**: 1.0 for exact match, 0.5 for partial match, 0.0 otherwise
- **Rating**: Normalized rating (rating/5.0)

## License

This project is created for educational purposes.
