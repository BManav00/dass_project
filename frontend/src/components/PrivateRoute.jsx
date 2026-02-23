import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

/**
 * PrivateRoute component - protects routes requiring authentication
 * @param {object} children - Child components to render if authenticated
 */
const PrivateRoute = ({ children }) => {
    if (!isAuthenticated()) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default PrivateRoute;
