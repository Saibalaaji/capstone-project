// This file is a legacy stub. The active login page is at pages/auth/LoginPage.jsx
// Redirecting to avoid confusion if this route is ever accessed.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginLegacy() {
    const navigate = useNavigate();
    useEffect(() => { navigate('/login', { replace: true }); }, [navigate]);
    return null;
}
