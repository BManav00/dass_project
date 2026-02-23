/**
 * Role-based access control middleware
 * @param {Array<string>} allowedRoles - Array of roles that can access the route
 * @returns {Function} Express middleware function
 */
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        // Ensure user is authenticated (authMiddleware should run first)
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        // Check if user's role is in the allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Access forbidden',
                message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

module.exports = checkRole;
