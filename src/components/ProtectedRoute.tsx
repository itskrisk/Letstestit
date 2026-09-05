import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppRole } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: AppRole;
}

const LOGIN_PATHS: Record<string, string> = {
    customer: '/login',
    merchant: '/partner/login',
    courier: '/courier/login',
    admin: '/admin/login',
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    // Wait for auth to initialize
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // No user at all — send to the appropriate login page
    if (!user) {
        const loginPath = requiredRole ? (LOGIN_PATHS[requiredRole] || '/login') : '/login';
        return <Navigate to={loginPath} state={{ from: location }} replace />;
    }

    // User is logged in but profile not loaded yet — wait
    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
                <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Role check: The silo layouts handle the UX for wrong-role users who
    // navigate to a portal *page*. ProtectedRoute handles blocking access
    // to the actual *dashboards* — so we redirect to the correct login for
    // the required role, not the user's own dashboard, to avoid ping-ponging.
    if (requiredRole && !profile.roles?.includes(requiredRole)) {
        const loginPath = LOGIN_PATHS[requiredRole] || '/login';
        return <Navigate to={loginPath} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
