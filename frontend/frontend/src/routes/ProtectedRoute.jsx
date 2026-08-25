import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Gates a route behind authentication and, optionally, a set of allowed
 * roles. This is a UX guard only — the backend's verifyToken/authorizeRoles
 * middleware remains the real security boundary.
 */
export function ProtectedRoute({ roles, children }) {
  const { isAuthenticated, role, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
