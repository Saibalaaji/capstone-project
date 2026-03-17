import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route and redirects to /login if not authenticated.
 * Optionally restricts by role: <ProtectedRoute role="admin">
 */
export default function ProtectedRoute({ children, role }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4 animate-spin">⚙️</div>
                    <p className="text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (role && user.role !== role) {
        // Redirect to the correct dashboard for the user's actual role
        if (user.role === 'admin') return <Navigate to="/admin" replace />;
        if (user.role === 'volunteer') return <Navigate to="/volunteer" replace />;
        if (user.role === 'user') return <Navigate to="/user" replace />;
        return <Navigate to="/" replace />;
    }

    return children;
}
