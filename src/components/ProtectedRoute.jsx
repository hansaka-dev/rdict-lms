import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Cursor from './Cursor';

const ProtectedRoute = ({ allowedRoles = ['student', 'admin'] }) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
                // Getting the role from user_metadata (or default to 'student' if missing for backwards compatibility)
                const userRole = session.user.user_metadata?.role || 'student';
                setRole(userRole);
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    if (loading) {
        return (
            <div style={{ background: '#0a0610', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
                <Cursor />
                <h2 style={{ fontFamily: 'Outfit, sans-serif' }}>Loading Secure Space...</h2>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(role)) {
        // If they are logged in but don't have access to this route, kick them to their appropriate dashboard
        return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />;
    }

    // Role matches! Render nested routes
    return <Outlet />;
};

export default ProtectedRoute;
