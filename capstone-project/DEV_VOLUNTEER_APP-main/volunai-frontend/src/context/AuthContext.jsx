import { createContext, useContext, useState, useEffect } from 'react';
import { authLogin, authRegister, authMe } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket_events';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('cvas_token'));
    const [loading, setLoading] = useState(true);

    // Restore session from token on mount
    useEffect(() => {
        const restoreSession = async () => {
            const stored = localStorage.getItem('cvas_token');
            if (stored) {
                try {
                    const res = await authMe();
                    setUser(res.data);
                    setToken(stored);
                    initSocket(stored); // Init socket with restored token
                } catch {
                    localStorage.removeItem('cvas_token');
                    localStorage.removeItem('cvas_user');
                    setToken(null);
                }
            }
            setLoading(false);
        };
        restoreSession();
    }, []);

    const login = async (email, password) => {
        const res = await authLogin({ email, password });
        const { user: u, token: t } = res.data;
        localStorage.setItem('cvas_token', t);
        localStorage.setItem('cvas_user', JSON.stringify(u));
        setToken(t);
        setUser(u);
        initSocket(t); // Init socket on login
        return u;
    };

    const register = async (data) => {
        // data could be FormData or JSON object, api.js should send it directly
        const res = await authRegister(data);
        const { user: u, token: t } = res.data;
        localStorage.setItem('cvas_token', t);
        localStorage.setItem('cvas_user', JSON.stringify(u));
        setToken(t);
        setUser(u);
        initSocket(t); // Init socket on register
        return u;
    };

    const logout = () => {
        localStorage.removeItem('cvas_token');
        localStorage.removeItem('cvas_user');
        setToken(null);
        setUser(null);
        disconnectSocket(); // Disconnect on logout
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
