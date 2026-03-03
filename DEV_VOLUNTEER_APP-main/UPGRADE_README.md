# VolunAI - Multi-Role Chat & Notification System Upgrade

## 🎯 System Overview

This upgrade transforms VolunAI into a fully synchronized multi-role platform with:
- **Authentication System** (Login/Register)
- **Real-time Chat** between Users, Admins, and Volunteers
- **In-app Notifications** for all events
- **Unified Request Workflow** with approval system
- **Role-based Dashboards** for User, Admin, and Volunteer

---

## 🚀 Quick Start

### Backend Setup

```bash
cd volunai-backend
pip install -r requirements.txt
python app.py
```

Backend runs on: `http://localhost:5000`

### Frontend Setup

```bash
cd volunai-frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## 👥 User Roles & Access

### 1. **User (Service Requester)**
- **Login**: `user@volunai.com` / `user123`
- **Dashboard**: `/user`
- **Capabilities**:
  - Submit service requests
  - View available volunteers
  - Filter volunteers by skills, location, rating
  - Chat with volunteers
  - Chat with admins
  - Receive notifications

### 2. **Admin**
- **Login**: `admin@volunai.com` / `admin123`
- **Dashboard**: `/admin`
- **Capabilities**:
  - View all service requests
  - View all users and volunteers
  - Manually assign volunteers to requests
  - Chat with users and volunteers
  - Monitor all approvals and completions
  - Receive notifications for new requests, approvals, completions

### 3. **Volunteer**
- **Dashboard**: `/volunteer`
- **Capabilities**:
  - Receive task notifications
  - Accept or decline tasks
  - Mark tasks as completed
  - Chat with users and admins
  - Toggle availability status
  - View performance metrics

---

## 📋 Complete Workflow

### Scenario 1: Volunteer Self-Approval

1. **User** logs in and submits a service request
2. **User** selects preferred volunteer from list
3. **Volunteer** receives notification
4. **Volunteer** approves task
5. Task status → `APPROVED`
6. **Admin** receives notification of approval
7. **Volunteer** completes task
8. Task status → `COMPLETED`

### Scenario 2: Admin Assignment

1. **User** submits request without selecting volunteer
2. **Admin** receives notification
3. **Admin** views request and assigns volunteer
4. **Volunteer** receives assignment notification
5. **Volunteer** accepts or declines
6. If accepted → Task status → `ASSIGNED`
7. **Volunteer** completes task
8. Task status → `COMPLETED`

---

## 💬 Chat System

### Available in All Dashboards
- User Dashboard
- Admin Dashboard
- Volunteer Dashboard

### Chat Features
- Real-time messaging
- Message history
- Unread message indicators
- Auto-refresh every 3 seconds
- Linked to service requests

### How to Use
1. Click chat icon next to user/volunteer
2. Type message and press Enter or click Send
3. Messages appear in real-time
4. Close chat widget anytime

---

## 🔔 Notification System

### Notification Types
- `NEW_REQUEST` - New service request submitted
- `NEW_MESSAGE` - New chat message received
- `ASSIGNMENT` - Volunteer assigned to task
- `APPROVAL` - Volunteer approved task
- `COMPLETION` - Task marked as completed

### Notification Features
- Real-time in-app notifications
- Unread count badge
- Mark as read functionality
- Mark all as read
- Auto-refresh every 5 seconds

---

## 🗄️ Database Schema

### Users Table
```sql
- id (PK)
- name
- email
- password_hash
- contact_number
- location
- role (user/admin/volunteer)
- created_at
```

### Volunteers Table
```sql
- id (PK)
- name
- email
- phone
- location
- available_days (JSON)
- service_type (JSON)
- rating
- active
- availability_status
- completed_tasks
- acceptance_rate
- reliability_score
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
- status (PENDING/APPROVED/ASSIGNED/COMPLETED)
- assigned_volunteer_id (FK)
```

### Messages Table
```sql
- id (PK)
- sender_id (FK → users.id)
- receiver_id (FK → users.id)
- request_id (FK → assistance_requests.id)
- message_text
- timestamp
- read (boolean)
```

### Notifications Table
```sql
- id (PK)
- user_id (FK → users.id)
- message
- notification_type
- related_id
- status (read/unread)
- timestamp
```

### Assignments Table
```sql
- id (PK)
- request_id (FK)
- volunteer_id (FK)
- match_score
- acceptance_probability
- status (SUGGESTED/ACCEPTED/DECLINED/COMPLETED)
- timestamp
- assigned_at
- completed_at
```

---

## 🔌 New API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/users` - Get all users
- `GET /api/auth/users/{id}` - Get user by ID

### Chat
- `POST /api/chat/messages` - Send message
- `GET /api/chat/messages?userId={id}&otherUserId={id}` - Get conversation
- `GET /api/chat/conversations/{userId}` - Get all conversations
- `PUT /api/chat/messages/{id}/read` - Mark message as read

### Notifications
- `GET /api/notifications/{userId}` - Get user notifications
- `GET /api/notifications/{userId}?status=unread` - Get unread notifications
- `PUT /api/notifications/{id}/read` - Mark notification as read
- `PUT /api/notifications/user/{userId}/mark-all-read` - Mark all as read
- `DELETE /api/notifications/{id}` - Delete notification

### Approvals
- `POST /api/approvals/volunteer/{volunteerId}/approve/{requestId}` - Volunteer approves task
- `POST /api/approvals/volunteer/{volunteerId}/decline/{requestId}` - Volunteer declines task
- `POST /api/approvals/task/{requestId}/complete` - Mark task as completed

---

## 🎨 Frontend Components

### New Pages
- `Login.jsx` - User authentication
- `Register2.jsx` - User registration
- `UserDashboard.jsx` - User interface with chat and request submission
- `AdminDashboard2.jsx` - Enhanced admin panel

### New Components
- `ChatWidget.jsx` - Reusable chat component
- `NotificationPanel.jsx` - Notification dropdown

### Services
- `authService.js` - Authentication, chat, notifications, approvals

---

## 🔐 Security Features

- Password hashing with werkzeug
- Role-based access control
- Session management with localStorage
- Input validation on all forms

---

## 📊 Key Features

### ✅ Implemented
- [x] Multi-role authentication system
- [x] Real-time chat between all roles
- [x] In-app notification system
- [x] Volunteer selection by users
- [x] Volunteer self-approval workflow
- [x] Admin manual assignment
- [x] Task completion tracking
- [x] Unified database architecture
- [x] Role-based dashboards
- [x] Real-time data synchronization

### 🎯 Workflow Synchronization
- All modules operate in real-time
- Notifications trigger on every action
- Chat linked to service requests
- Status updates propagate instantly
- Admin oversight of all activities

---

## 🧪 Testing the System

### Test User Accounts
```
Admin:
Email: admin@volunai.com
Password: admin123

User:
Email: user@volunai.com
Password: user123
```

### Test Workflow
1. Login as User
2. Submit a service request
3. Select a volunteer
4. Open chat with volunteer
5. Login as Volunteer (use volunteer dashboard selector)
6. View notification
7. Approve task
8. Login as Admin
9. View approval notification
10. Monitor all activities

---

## 🚀 Deployment Notes

### Production Checklist
- [ ] Replace SQLite with PostgreSQL/MySQL
- [ ] Implement JWT authentication
- [ ] Add WebSocket for real-time updates
- [ ] Set up Redis for caching
- [ ] Configure HTTPS
- [ ] Add rate limiting
- [ ] Implement proper logging
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure CORS for production domain
- [ ] Add email notifications

---

## 📞 Support

For issues or questions:
- Check API logs: Backend console
- Check browser console for frontend errors
- Verify database connections
- Ensure all dependencies are installed

---

**VolunAI** - Where AI meets community service through seamless communication and intelligent coordination.
