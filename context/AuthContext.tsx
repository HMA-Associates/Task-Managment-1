
import React, { createContext, useState, useEffect, useMemo } from 'react';
import type { User } from '../types';
import { login as apiLogin, logout as apiLogout, getMe } from '../services/api';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<User | null>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => null,
    logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            setLoading(true);
            try {
                const currentUser = await getMe();
                setUser(currentUser);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkLoggedIn();
    }, []);

    const login = async (email: string, pass: string) => {
        setLoading(true);
        try {
            const loggedInUser = await apiLogin(email, pass);
            setUser(loggedInUser);
            return loggedInUser;
        } catch (error) {
            setUser(null);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await apiLogout();
        setUser(null);
    };

    const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
