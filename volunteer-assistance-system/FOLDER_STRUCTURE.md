# Folder Structure

```
volunteer-assistance-system/
│
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── volunteer/
│   │   │           ├── controller/
│   │   │           │   ├── AssistanceRequestController.java
│   │   │           │   └── VolunteerController.java
│   │   │           │
│   │   │           ├── service/
│   │   │           │   ├── AssistanceRequestService.java
│   │   │           │   └── VolunteerService.java
│   │   │           │
│   │   │           ├── repository/
│   │   │           │   ├── AssistanceRequestRepository.java
│   │   │           │   └── VolunteerRepository.java
│   │   │           │
│   │   │           ├── model/
│   │   │           │   ├── AssistanceRequest.java
│   │   │           │   ├── RequestStatus.java
│   │   │           │   ├── UrgencyLevel.java
│   │   │           │   ├── UserRole.java
│   │   │           │   └── Volunteer.java
│   │   │           │
│   │   │           ├── dto/
│   │   │           │   ├── AssistanceRequestResponse.java
│   │   │           │   └── VolunteerMatch.java
│   │   │           │
│   │   │           ├── utility/
│   │   │           │   └── MatchingService.java
│   │   │           │
│   │   │           ├── exception/
│   │   │           │   ├── ErrorResponse.java
│   │   │           │   ├── GlobalExceptionHandler.java
│   │   │           │   └── ResourceNotFoundException.java
│   │   │           │
│   │   │           └── VolunteerAssistanceSystemApplication.java
│   │   │
│   │   └── resources/
│   │       └── application.properties
│   │
│   └── test/
│       └── java/
│           └── com/
│               └── volunteer/
│
├── pom.xml
└── README.md
```
