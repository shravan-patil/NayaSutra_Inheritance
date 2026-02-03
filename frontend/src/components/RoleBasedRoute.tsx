import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type RoleBasedRouteProps = {
  children: React.ReactNode;
  requiredRole?: string;
  allowedRoles?: string[];
};

export const RoleBasedRoute = ({ children, requiredRole, allowedRoles }: RoleBasedRouteProps) => {
  const { profile, isAuthenticated } = useAuth();

  // Check if user is authenticated
  if (!isAuthenticated || !profile) {
    return <Navigate to="/" replace />;
  }

  // Check if user has the required role
  if (requiredRole && profile.role_category !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Check if user's role is in the allowed roles list
  if (allowedRoles && !allowedRoles.includes(profile.role_category)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Specific protection for police routes
export const PoliceProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <RoleBasedRoute 
      requiredRole="police" 
      allowedRoles={["police", "police_officer"]}
    >
      {children}
    </RoleBasedRoute>
  );
};

// Specific protection for profile-related routes
export const ProfileProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <RoleBasedRoute 
      allowedRoles={["judiciary", "judge", "lawyer", "clerk", "court_staff", "public_party", "police", "police_officer", "legal_practitioner"]}
    >
      {children}
    </RoleBasedRoute>
  );
};

export default RoleBasedRoute;
