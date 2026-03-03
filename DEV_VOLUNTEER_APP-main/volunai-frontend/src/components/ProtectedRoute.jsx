import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

/**
 * ProtectedRoute — wraps a route that requires authentication.
 *
 * DEMO MODE: Role enforcement is intentionally disabled so all dashboards
 * remain accessible without a specific role. This allows testers to navigate
 * directly to /admin or /volunteer without needing to log in with a matching role.
 *
 * Set STRICT_ROLES=true below to re-enable role enforcement in production.
 *
 * Usage:
 *   <Route path="/admin/*" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
 */
const STRICT_ROLES = false; // ← Set to true in production

export default function ProtectedRoute({ children, role }) {
    const location = useLocation();
    const user = authService.getCurrentUser();

    if (!user) {
        // Not logged in → redirect to login, preserve destination
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (STRICT_ROLES && role && user.role !== role) {
        // Logged in but wrong role → redirect to their own dashboard
        const roleHome =
            user.role === 'admin' ? '/admin' :
                user.role === 'volunteer' ? '/volunteer' : '/user';
        return <Navigate to={roleHome} replace />;
    }

    return children;
}
