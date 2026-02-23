import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUser } from '../utils/auth';

/**
 * RoleRoute component - protects routes by user role
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @param {object} children - Child components to render if authorized
 */
const RoleRoute = ({ allowedRoles, children }) => {
    if (!isAuthenticated()) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" replace />;
    }

    const user = getUser();

    if (!user || !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        if (user?.role === 'Admin') {
            return <Navigate to="/admin" replace />;
        } else if (user?.role === 'Organizer') {
            return <Navigate to="/organizer" replace />;
        } else {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};

export default RoleRoute;
