import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageSkeleton } from '../components/Skeleton';

export const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/restricted" replace />;
  }

  return children;
};

export default ProtectedRoute;
