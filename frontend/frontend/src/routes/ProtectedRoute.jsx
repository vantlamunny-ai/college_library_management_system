import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

/**
 * Gates a route behind authentication and,
 * optionally, a set of allowed roles.
 *
 * Backend authentication/authorization remains
 * the real security boundary.
 */
export function ProtectedRoute({ roles, children }) {
    const {
        isAuthenticated,
        role,
        initializing,
    } = useAuth();

    const location = useLocation();

    // Wait while authentication is initializing
    if (initializing) {
        return null;
    }

    // User is not logged in
    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                state={{ from: location }}
                replace
            />
        );
    }

    // User doesn't have required role
    if (
        roles &&
        !roles.includes(role)
    ) {
        return (
            <Navigate
                to="/403"
                replace
            />
        );
    }

    // User is authenticated and authorized
    return children;
}

export default ProtectedRoute;