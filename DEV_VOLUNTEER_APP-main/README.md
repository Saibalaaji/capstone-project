# VolunAI — Autonomous Volunteer Coordination System

A cloud-based web application that manages community service requests and automatically assigns the most suitable volunteer using AI-driven decision intelligence.

## 🌟 System Overview

VolunAI leverages advanced AI technologies to optimize volunteer coordination through:

- **AI Request Understanding**: Natural Language Processing to interpret and categorize service requests
- **Intelligent Matching**: Multi-factor scoring algorithm for optimal volunteer-task pairing
- **Acceptance Prediction**: Machine learning model to predict volunteer task acceptance likelihood
- **Adaptive Learning**: Self-improving system that learns from assignment outcomes
- **Real-time Analytics**: Comprehensive performance tracking and insights

## 🏗️ Architecture

### Backend (Spring Boot + Java 17)
- **Framework**: Spring Boot 3.2.2
- **Database**: H2 (In-memory) with JPA/Hibernate
- **AI Components**: Custom Java-based ML algorithms
- **APIs**: RESTful architecture with Swagger documentation

### Frontend (React + Vite)
- **Framework**: React 19.2.0 with Vite
- **UI Components**: TailwindCSS + Lucide Icons
- **Routing**: React Router DOM
- **Charts**: Recharts for analytics visualization

## 🤖 AI Components

### 1. Request Understanding AI
- **NLP Processing**: Extracts structured data from natural language descriptions
- **Key Extraction**: Service type, urgency level, required skills, location
- **Confidence Scoring**: AI confidence level for interpretation accuracy

### 2. Volunteer Matching AI
**Multi-factor scoring algorithm:**
```
match_score = (availability_weight × availability_score) +
             (location_weight × proximity_score) +
             (skill_weight × skill_match_score) +
             (performance_weight × reliability_score) +
             (acceptance_weight × predicted_acceptance_probability)
```

**Default Weights:**
- Availability: 25%
- Location: 20%
- Skills: 30%
- Performance: 15%
- Acceptance Probability: 10%

### 3. Acceptance Prediction Model
Predicts task acceptance likelihood using:
- Historical acceptance rate
- Response time patterns
- Current workload level
- Task urgency and skill match

### 4. Adaptive Learning Engine
- **Reliability Updates**: Adjusts volunteer scores based on task outcomes
- **Weight Optimization**: Dynamically adjusts matching weights for better accuracy
- **Performance Tracking**: Monitors system success rates and improvements

## 📊 Database Schema

### Volunteers Table
```sql
- id (PK)
- name
- email
- phone
- location
- available_days (JSON array)
- service_types (JSON array)
- rating
- active_status
```

### Service Requests Table
```sql
- id (PK)
- requester_name
- requester_contact
- location
- service_type
- description
- urgency_level
- status
- assigned_volunteer_id (FK)
```

### Assignments Table
```sql
- id (PK)
- request_id (FK)
- volunteer_id (FK)
- match_score
- acceptance_probability
- status
- timestamp
```

## 🚀 Getting Started

### Prerequisites
- Java 17 or higher
- Node.js 18 or higher
- Maven 3.6+

### Backend Setup (Python Flask)

1. **Navigate to backend directory:**
   ```bash
   cd volunai-backend
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the server:**
   ```bash
   python app.py
   ```

4. **Access API Documentation:**
   - URL: `http://localhost:5000/api/`
   - Analytics Instance: `http://localhost:5000/api/ai/enhanced/analytics`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd volunai-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access application:**
   - Frontend: `http://localhost:5173`
   - Backend API Proxy: `http://localhost:5173/api` (proxied to port 5000)

## 📱 User Interfaces

### Admin Dashboard (`/admin`)
- **Request Management**: Create and manage service requests
- **AI Recommendations**: View and approve AI-suggested volunteer matches
- **Volunteer Management**: Monitor and manage volunteer profiles
- **Analytics Dashboard**: System performance and AI model insights
- **Real-time Monitoring**: Track active assignments and response times

### Volunteer Dashboard (`/volunteer`)
- **Task Notifications**: Real-time task opportunity alerts
- **Accept/Decline Actions**: Quick response to assignment offers
- **Profile Management**: Update skills, availability, and preferences
- **Performance History**: Track completed tasks and ratings
- **Reliability Score**: Monitor personal performance metrics

## 🔌 API Endpoints

### Core Request Management
- `POST /api/requests` - Create service request (returns AI matches)
- `GET /api/requests` - Get all requests
- `GET /api/requests/{id}` - Get specific request
- `POST /api/requests/{requestId}/assign/{volunteerId}` - Assign volunteer

### AI Services
- `POST /api/ai/interpret_request` - NLP request interpretation
- `GET /api/ai/enhanced/match_volunteers/{requestId}` - Enhanced AI matching
- `POST /api/ai/enhanced/update_performance/{volunteerId}` - Update performance
- `GET /api/ai/enhanced/analytics` - AI learning analytics

### Volunteer Management
- `POST /api/volunteers` - Create volunteer
- `GET /api/volunteers` - Get all volunteers
- `GET /api/volunteers/active` - Get active volunteers
- `PUT /api/volunteers/{id}` - Update volunteer

## 🎯 Demo Mode

The system includes a comprehensive demo dataset:

### Sample Volunteers (10)
- **Dr. Sarah Johnson**: Medical specialist, 4.8 rating
- **Michael Chen**: Food delivery expert, 4.6 rating
- **Emily Rodriguez**: Multi-skilled helper, 4.5 rating
- **James Wilson**: Elder care specialist, 4.9 rating
- **Lisa Anderson**: Technical support, 4.3 rating
- And 5 more diverse volunteers with various skills

### Sample Requests (5)
1. **Urgent Medical Assistance** - Manhattan, HIGH priority
2. **Food Delivery** - Brooklyn, MEDIUM priority  
3. **Pet Care** - Queens, MEDIUM priority
4. **Technical Support** - Bronx, LOW priority
5. **Home Repair** - Manhattan, MEDIUM priority

### Demo Simulation
The system demonstrates:
- Automatic volunteer recommendation with detailed scoring
- Real-time AI match score calculation
- Adaptive learning updates based on outcomes
- Performance analytics and trend visualization

## 📈 Analytics & Reporting

### System Performance Metrics
- **Success Rate**: Overall assignment success percentage
- **Response Time**: Average volunteer response duration
- **Match Accuracy**: AI prediction effectiveness
- **Reliability Trends**: Volunteer performance over time

### AI Model Insights
- **Weight Distribution**: Current matching algorithm weights
- **Learning Progress**: Adaptive learning improvements
- **Prediction Accuracy**: Acceptance prediction performance
- **Skill Utilization**: Service type distribution analysis

## 🔧 Configuration

### AI Matching Weights
Weights can be dynamically adjusted via the adaptive learning engine or manually configured:

```java
// In EnhancedMatchingService
private double availabilityWeight = 0.25;
private double locationWeight = 0.20;
private double skillWeight = 0.30;
private double performanceWeight = 0.15;
private double acceptanceWeight = 0.10;
```

### Database Configuration
```properties
# H2 Database (Default)
spring.datasource.url=jdbc:h2:mem:volunteer_db
spring.datasource.username=sa
spring.datasource.password=
spring.h2.console.enabled=true
```

## 🌐 Deployment

### Cloud Deployment Ready
- **Containerizable**: Docker-ready with Spring Boot
- **Scalable Architecture**: Stateless design for horizontal scaling
- **Environment Configurable**: External configuration support
- **API Documentation**: Swagger/OpenAPI integration

### Production Considerations
- Replace H2 with PostgreSQL/MySQL for production
- Configure external logging and monitoring
- Set up load balancer for high availability
- Implement proper authentication and authorization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is created for educational and demonstration purposes.

## 🔍 System Features Summary

### ✅ Implemented Features
- [x] AI Request Understanding with NLP
- [x] Multi-factor Volunteer Matching Algorithm
- [x] Acceptance Prediction Model
- [x] Adaptive Learning Engine
- [x] Admin Dashboard with AI Insights
- [x] Volunteer Dashboard with Real-time Notifications
- [x] Sample Dataset and Demo Mode
- [x] RESTful API Architecture
- [x] Comprehensive Analytics
- [x] Cloud-ready Architecture

### 🎯 Key Capabilities
- **Autonomous Matching**: AI automatically suggests best volunteer matches
- **Real-time Processing**: Instant request interpretation and matching
- **Self-Improving**: System learns and optimizes over time
- **Scalable Design**: Handles growing volunteer and request volumes
- **User-Friendly**: Intuitive interfaces for both admins and volunteers
- **Data-Driven**: Comprehensive analytics for informed decision-making

---

**VolunAI** represents the future of volunteer coordination - where artificial intelligence meets community service to create meaningful, efficient, and impactful connections between those who need help and those who want to give it.
