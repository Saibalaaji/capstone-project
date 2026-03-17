import { createContext, useContext, useState, useEffect } from 'react';
import { authLogin, authRegister, authMe } from '../services/api';

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
        return u;
    };

    const register = async (data) => {
        const res = await authRegister(data);
        const { user: u, token: t } = res.data;
        localStorage.setItem('cvas_token', t);
        localStorage.setItem('cvas_user', JSON.stringify(u));
        setToken(t);
        setUser(u);
        return u;
    };

    const logout = () => {
        localStorage.removeItem('cvas_token');
        localStorage.removeItem('cvas_user');
        setToken(null);
        setUser(null);
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
