// This file is a legacy stub. The active register page is at pages/auth/RegisterPage.jsx
// Redirecting to avoid confusion if this route is ever accessed.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegisterLegacy() {
    const navigate = useNavigate();
    useEffect(() => { navigate('/register', { replace: true }); }, [navigate]);
    return null;
}
