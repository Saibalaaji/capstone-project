import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PasswordResetPage from './pages/auth/PasswordResetPage';
import AdminDashboard from './pages/AdminDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import UserDashboard from './pages/UserDashboard';
import ChatRequest from './pages/ChatRequest';
import RegisterVolunteer from './pages/RegisterVolunteer';
import PendingVerification from './pages/PendingVerification';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<PasswordResetPage />} />
          <Route path="/chat" element={<ChatRequest />} />
          <Route path="/register-volunteer" element={<RegisterVolunteer />} />
          <Route path="/pending-verification" element={<PendingVerification />} />

          {/* Protected routes */}
          <Route path="/admin/*" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/volunteer/*" element={
            <ProtectedRoute role="volunteer">
              <VolunteerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/user/*" element={
            <ProtectedRoute role="user">
              <UserDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
