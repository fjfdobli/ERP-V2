import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { getCurrentUser, setUser } from '../redux/slices/authSlice';
import LoadingScreen from './common/LoadingScreen';
import { supabase } from '../supabaseClient';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAppSelector((state) => state.auth);
  const [initialChecked, setInitialChecked] = useState(false);
  const [authenticating, setAuthenticating] = useState(true);
  const [authAttempts, setAuthAttempts] = useState(0);
  const dispatch = useAppDispatch();

  // Check auth status when component loads
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        try {
          // Check for session directly with Supabase first
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error("Session retrieval error:", sessionError);
            // Clear any existing tokens on session error
            localStorage.removeItem('token');
            localStorage.removeItem('supabase_auth_token');
          }
          else if (sessionData?.session?.access_token) {
            console.log("Found Supabase session, authenticating...");
            // Store token in both formats for compatibility
            localStorage.setItem('token', sessionData.session.access_token);
            localStorage.setItem('supabase_auth_token', JSON.stringify(sessionData.session));
            await dispatch(getCurrentUser());
          } else {
            // Check for token directly
            const token = localStorage.getItem('token');
            const sessionJson = localStorage.getItem('supabase_auth_token');
            
            if (token) {
              console.log("Found direct token, authenticating...");
              await dispatch(getCurrentUser());
            } else if (sessionJson && sessionJson !== '[object Object]') {
              try {
                // Try to parse the session and extract the token
                const session = JSON.parse(sessionJson);
                if (session?.access_token) {
                  console.log("Found session token, authenticating...");
                  localStorage.setItem('token', session.access_token);
                  await dispatch(getCurrentUser());
                }
              } catch (parseError) {
                console.error("Error parsing stored session:", parseError);
                localStorage.removeItem('supabase_auth_token');
              }
            } else {
              console.log("No valid authentication token found");
            }
          }
        } catch (error) {
          console.error("Auth check failed:", error);
        }
      }
      
      setAuthenticating(false);
      setInitialChecked(true);
    };
    
    checkAuth();
  }, [dispatch, isAuthenticated]);

  // Track authentication attempts to prevent infinite loops
  useEffect(() => {
    if (!isAuthenticated && !loading && initialChecked) {
      const token = localStorage.getItem('token');
      if (token && authAttempts < 3) {
        console.log(`Authentication attempt ${authAttempts + 1} with saved token...`);
        setAuthAttempts(prev => prev + 1);
        dispatch(getCurrentUser());
      }
    }
  }, [dispatch, isAuthenticated, loading, initialChecked, authAttempts]);

  // Show loading screen during initial check or when explicitly loading
  if (authenticating || (loading && !initialChecked)) {
    return <LoadingScreen />;
  }

  // Redirect to login if not authenticated after checks complete
  if (!isAuthenticated) {
    // Check if we've exceeded retry attempts before redirecting
    if (authAttempts >= 3) {
      console.log("Max auth attempts reached, redirecting to login");
      localStorage.removeItem('token');
      localStorage.removeItem('supabase_auth_token');
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;