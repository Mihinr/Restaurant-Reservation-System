import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { UserRole } from '@restaurant-reservation/shared';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export function ProtectedRoute({ children, allowedRoles, requireAuth = true }: ProtectedRouteProps) {
  const { user, token } = useAppSelector((state) => state.auth);

  if (requireAuth && !token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

