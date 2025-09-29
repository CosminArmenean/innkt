import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'basic' | 'premium' | 'admin';
  requireMfa?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = 'basic',
  requireMfa = false 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user);

  if (isLoading) {
    console.log('ProtectedRoute - showing loading spinner');
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute - user not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('ProtectedRoute - user authenticated, rendering children');

  if (requireMfa && !user?.isMfaEnabled) {
    return <Navigate to="/setup-2fa" state={{ from: location }} replace />;
  }

  // Check role-based access
  const roleHierarchy = { basic: 1, premium: 2, admin: 3 };
  const userRoleLevel = roleHierarchy[user?.role || 'basic'];
  const requiredRoleLevel = roleHierarchy[requiredRole];

  if (userRoleLevel < requiredRoleLevel) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
