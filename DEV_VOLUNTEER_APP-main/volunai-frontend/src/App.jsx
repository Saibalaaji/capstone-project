import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';

// ── Lazy-loaded routes ── each page becomes its own async JS chunk
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminDashboard2 = lazy(() => import('./pages/AdminDashboard2'));
const VolunteerDashboard = lazy(() => import('./pages/VolunteerDashboard'));
const ChatRequest = lazy(() => import('./pages/ChatRequest'));
const RegisterVolunteer = lazy(() => import('./pages/RegisterVolunteer'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register2'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* ── Public routes (no login required) ── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/chat" element={<ChatRequest />} />
          <Route path="/register-volunteer" element={<RegisterVolunteer />} />

          {/* ── Protected routes (login required, any role) ──
              Role enforcement is OFF (STRICT_ROLES=false in ProtectedRoute),
              so any logged-in user can access any dashboard in this demo. */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin2/*"
            element={
              <ProtectedRoute>
                <AdminDashboard2 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer/*"
            element={
              <ProtectedRoute>
                <VolunteerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── 404 catch-all ── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
