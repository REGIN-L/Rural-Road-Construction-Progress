import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ allowedRoles }) {
    const { user, token, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner text="Authenticating user credentials..." />;
    }

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // If engineer tries to access admin routes
        if (user.role === 'ENGINEER') {
            return <Navigate to="/engineer/dashboard" replace />;
        }
        if (user.role === 'CONTRACTOR') {
            return <Navigate to="/contractor/dashboard" replace />;
        }
        return <Navigate to="/admin/dashboard" replace />;
    }

    return <Outlet />;
}
