import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, getMe } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('ruralconnect_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            if (token) {
                try {
                    const res = await getMe();
                    setUser(res.user);
                    localStorage.setItem('ruralconnect_user', JSON.stringify(res.user));
                } catch (err) {
                    logoutUser();
                    setUser(null);
                    setToken(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        };
        checkAuth();
    }, [token]);

    const login = async (credentials) => {
        const res = await loginUser(credentials);
        setUser(res.user);
        setToken(res.token);
        return res;
    };

    const register = async (userData) => {
        const res = await registerUser(userData);
        setUser(res.user);
        setToken(res.token);
        return res;
    };

    const logout = () => {
        logoutUser();
        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
