import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const AuthValidator = ({ children }: { children: React.ReactNode }) => {
  const { profile, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const validateUser = async () => {
      if (!isAuthenticated || !profile) {
        return;
      }

      try {
        // Validate that the user still exists in the database and is not suspended
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("id, status, role_category, wallet_address")
          .eq("id", profile.id)
          .single();

        if (error || !profileData) {
          console.error('Profile validation failed:', error);
          toast.error("Your session is invalid. Please login again.");
          await signOut();
          navigate('/');
          return;
        }

        // Check if user is suspended or pending
        if (profileData.status === 'suspended' || profileData.status === 'pending') {
          toast.error(`Your account is ${profileData.status}. Access denied.`);
          await signOut();
          navigate('/');
          return;
        }

        // Additional validation for police routes
        if (location.pathname.startsWith('/police')) {
          const validPoliceRoles = ['police', 'police_officer'];
          if (!validPoliceRoles.includes(profileData.role_category)) {
            toast.error("Access denied. Police role required.");
            navigate('/');
            return;
          }
        }

      } catch (err) {
        console.error('Auth validation error:', err);
        toast.error("Authentication validation failed. Please login again.");
        await signOut();
        navigate('/');
      }
    };

    validateUser();
  }, [location.pathname, isAuthenticated, profile, navigate, signOut]);

  return <>{children}</>;
};

export default AuthValidator;
