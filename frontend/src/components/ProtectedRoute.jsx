// components/ProtectedRoute.jsx
import { Navigate } from 'react-router';
import { useSelector } from 'react-redux';

export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useSelector((state) => state.auth);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useSelector((state) => state.auth);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }

    return isAuthenticated ? <Navigate to="/" replace /> : children;
};