# 🚀 QUICK START GUIDE - VolunAI Upgraded System

## ⚡ 3-Minute Setup

### Step 1: Start Backend (Terminal 1)
```bash
cd volunai-backend
python app.py
```
✅ Backend running on http://localhost:5000

### Step 2: Start Frontend (Terminal 2)
```bash
cd volunai-frontend
npm run dev
```
✅ Frontend running on http://localhost:5173

### Step 3: Open Browser
Navigate to: **http://localhost:5173**

---

## 🎮 Test the System (5 Minutes)

### Test 1: User Registration & Login
1. Click **"Register"** button
2. Fill form:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
   - Role: **user**
3. Click **"Register"**
4. Click **"Login"**
5. Login with: test@example.com / test123
6. ✅ Redirected to User Dashboard

### Test 2: Submit Service Request
1. In User Dashboard, fill request form:
   - Service Type: Food Delivery
   - Location: Brooklyn
   - Urgency: MEDIUM
   - Description: Need groceries delivered
2. Click **"Submit Request"**
3. ✅ Request created, admin notified

### Test 3: Chat with Volunteer
1. In User Dashboard, see "Available Volunteers" list
2. Click chat icon (💬) next to any volunteer
3. Type message: "Hi, are you available?"
4. Press Enter or click Send
5. ✅ Message sent, volunteer notified

### Test 4: Admin Login
1. Logout (or open incognito window)
2. Login as Admin:
   - Email: admin@volunai.com
   - Password: admin123
3. ✅ Redirected to Admin Dashboard
4. See notification badge (🔔) with count
5. Click "Requests" tab
6. See all service requests

### Test 5: Admin Assigns Volunteer
1. In Admin Dashboard → Requests tab
2. Find a PENDING request
3. Select volunteer from dropdown
4. ✅ Volunteer assigned, volunteer notified

### Test 6: Volunteer Approval
1. Go to: http://localhost:5173/volunteer
2. Select volunteer from dropdown (top of sidebar)
3. See notification for new task
4. Click **"Accept Task"**
5. ✅ Task approved, admin notified
6. Click **"Mark Complete"**
7. ✅ Task completed, admin notified

### Test 7: Real-Time Chat
1. As Admin, click "Volunteers" tab
2. Click chat icon next to any volunteer
3. Send message: "Great work!"
4. ✅ Message delivered in real-time

---

## 🎯 Pre-Loaded Test Accounts

### Admin Account
```
Email: admin@volunai.com
Password: admin123
Dashboard: /admin
```

### User Account
```
Email: user@volunai.com
Password: user123
Dashboard: /user
```

### Volunteers (10 pre-loaded)
```
Access via: /volunteer
Select from dropdown:
- Dr. Sarah Johnson
- Michael Chen
- Emily Rodriguez
- James Wilson
- Lisa Anderson
- David Martinez
- Jennifer Taylor
- Robert Brown
- Maria Garcia
- Thomas Lee
```

---

## 📋 Feature Checklist

Test each feature:

### Authentication
- [ ] User registration
- [ ] User login
- [ ] Role-based redirect
- [ ] Logout

### User Dashboard
- [ ] Submit service request
- [ ] View available volunteers
- [ ] Chat with volunteer
- [ ] Chat with admin
- [ ] View notifications

### Admin Dashboard
- [ ] View all requests
- [ ] View all volunteers
- [ ] View all users
- [ ] Assign volunteer to request
- [ ] Chat with users
- [ ] Chat with volunteers
- [ ] View notifications

### Volunteer Dashboard
- [ ] View task notifications
- [ ] Accept task
- [ ] Decline task
- [ ] Mark task complete
- [ ] Toggle availability
- [ ] View performance metrics

### Chat System
- [ ] Send message
- [ ] Receive message
- [ ] View message history
- [ ] Real-time updates
- [ ] Unread indicators

### Notification System
- [ ] Receive notifications
- [ ] View notification count
- [ ] Mark as read
- [ ] Mark all as read
- [ ] Real-time updates

---

## 🔍 Troubleshooting

### Backend won't start
```bash
# Install dependencies
pip install Flask Flask-CORS Flask-SQLAlchemy scikit-learn numpy scipy
```

### Frontend won't start
```bash
# Install dependencies
npm install
```

### Database issues
```bash
# Delete and recreate database
cd volunai-backend
rm -rf instance/volunai.db
python app.py
```

### Port already in use
```bash
# Backend (change port in app.py)
app.run(host="0.0.0.0", port=5001, debug=True)

# Frontend (change port in vite.config.js)
server: { port: 5174 }
```

---

## 📊 System Status Indicators

### ✅ System Working Correctly
- Backend console shows: "Server running on http://localhost:5000"
- Frontend shows: "Local: http://localhost:5173"
- No errors in browser console (F12)
- Login redirects to correct dashboard
- Notifications appear with badge count
- Chat messages send and receive

### ❌ Common Issues
- **CORS Error**: Backend not running or wrong port
- **404 Error**: Frontend proxy misconfigured
- **Login fails**: Check credentials or database
- **No notifications**: Check user ID in localStorage
- **Chat not working**: Check both users exist in database

---

## 🎨 UI Navigation

### Landing Page (/)
- Login button → /login
- Register button → /register
- Admin Dashboard → /admin
- Volunteer Dashboard → /volunteer

### User Dashboard (/user)
- Top right: Notification bell (🔔)
- Left panel: Request submission form
- Right panel: Available volunteers
- Bottom right: Chat widget (when opened)

### Admin Dashboard (/admin)
- Top right: Notification bell (🔔)
- Tabs: Requests | Volunteers | Users
- Each row: Action buttons + Chat icon

### Volunteer Dashboard (/volunteer)
- Top: Volunteer selector dropdown
- Sidebar: Navigation tabs
- Main: Notifications, Profile, History, Performance
- Each notification: Accept/Decline buttons

---

## 💡 Pro Tips

1. **Open Multiple Windows**: Test real-time features by opening multiple browser windows with different users
2. **Use Incognito**: Test different roles simultaneously
3. **Check Console**: Press F12 to see API calls and errors
4. **Refresh Data**: Most dashboards auto-refresh, but you can manually refresh browser
5. **Test Workflow**: Follow complete workflow from request → approval → completion

---

## 📞 Quick Reference

### API Base URL
```
http://localhost:5000/api
```

### Key Endpoints
```
POST /api/auth/login
POST /api/auth/register
POST /api/requests
POST /api/chat/messages
GET /api/notifications/{userId}
POST /api/approvals/volunteer/{volId}/approve/{reqId}
```

### Database Location
```
volunai-backend/instance/volunai.db
```

### Frontend Routes
```
/              - Landing page
/login         - Login page
/register      - Registration page
/user          - User dashboard
/admin         - Admin dashboard
/volunteer     - Volunteer dashboard
```

---

## ✨ Success Indicators

You'll know the system is working when:
1. ✅ You can register and login
2. ✅ Notifications appear with count badges
3. ✅ Chat messages send and appear in real-time
4. ✅ Requests show up in admin dashboard
5. ✅ Volunteers can accept/decline tasks
6. ✅ Status updates propagate across dashboards

---

**Ready to test!** 🚀

Start both servers and navigate to http://localhost:5173
