import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService, profileService } from '../lib/supabaseService';
import { supabase } from '../lib/supabaseClient';

export type AppRole = 'customer' | 'merchant' | 'courier' | 'admin';

interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  emailVerified: boolean;
  loyaltyTier: string;
  profile?: {
    id: string;
    roles: string[];
    status: string;
    avatarUrl?: string;
  };
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  token: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  addRole: (role: AppRole) => Promise<{ error: string | null }>;
  refreshUser: () => Promise<void>;
  updateToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));

  // SINGLE SESSION ENFORCEMENT: Validate session on mount
  useEffect(() => {
    const validateSession = async () => {
      const storedToken = localStorage.getItem('accessToken');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const { data: { user: authUser } } = await authService.getUser();
        
        if (!authUser) {
          localStorage.removeItem('accessToken');
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        // Check active_sessions table for single-session enforcement
        const { data: sessionData } = await supabase
          .from('active_sessions')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        if (sessionData) {
          // Verify the stored token matches the current session
          const currentToken = localStorage.getItem('accessToken');
          if (currentToken !== sessionData.session_token) {
            // Session mismatch - another session was created
            console.warn('[Auth] Session mismatch detected. Logging out.');
            await authService.signOut();
            localStorage.removeItem('accessToken');
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
          }
        }

        // Get profile
        const { data: profileData } = await profileService.getProfile(authUser.id);

        const normalizedUser: User = {
          id: authUser.id,
          email: authUser.email || '',
          fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          phone: authUser.user_metadata?.phone,
          emailVerified: authUser.email_confirmed_at ? true : false,
          loyaltyTier: 'bronze',
          profile: profileData ? {
            ...profileData,
            roles: profileData.roles || ['customer']
          } : {
            id: authUser.id,
            roles: ['customer'],
            status: 'ACTIVE'
          }
        };

        setUser(normalizedUser);
        setProfile(normalizedUser.profile);
      } catch (err) {
        console.error('[Auth] Session validation failed:', err);
        localStorage.removeItem('accessToken');
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await authService.getUser();
      
      if (!authUser) {
        setUser(null);
        setProfile(null);
        return;
      }

      // Get profile
      const { data: profileData } = await profileService.getProfile(authUser.id);

      const normalizedUser: User = {
        id: authUser.id,
        email: authUser.email || '',
        fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        phone: authUser.user_metadata?.phone,
        emailVerified: authUser.email_confirmed_at ? true : false,
        loyaltyTier: 'bronze',
        profile: profileData ? {
          ...profileData,
          roles: profileData.roles || ['customer']
        } : {
          id: authUser.id,
          roles: ['customer'],
          status: 'ACTIVE'
        }
      };

      setUser(normalizedUser);
      setProfile(normalizedUser.profile);
    } catch (err) {
      console.error('[AuthContext] Failed to refresh user:', err);
      localStorage.removeItem('accessToken');
      setUser(null);
      setProfile(null);
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      // First authenticate to get user ID
      const { data, error } = await authService.signIn(email, password);
      
      if (error) {
        return { error: error.message || 'Login failed.' };
      }

      if (!data.user) {
        return { error: 'Login failed. No user data returned.' };
      }

      if (data.session) {
        localStorage.setItem('accessToken', data.session.access_token);
        setToken(data.session.access_token);
      }

      // SINGLE SESSION ENFORCEMENT: Check for existing sessions and invalidate them
      const { data: userSessions } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('user_id', data.user.id);

      if (userSessions && userSessions.length > 0) {
        // User has an existing session - invalidate it and create new one
        await supabase
          .from('active_sessions')
          .delete()
          .eq('user_id', data.user.id);
      }

      // Create new session record
      const primaryRole = data.user.user_metadata?.role || 'customer';
      await supabase
        .from('active_sessions')
        .upsert({
          user_id: data.user.id,
          session_token: data.session?.access_token || '',
          primary_role: primaryRole,
          all_roles: [primaryRole],
          updated_at: new Date().toISOString()
        });

      // Get profile
      const { data: profileData } = await profileService.getProfile(data.user.id);

      const normalizedUser: User = {
        id: data.user.id,
        email: data.user.email || '',
        fullName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
        phone: data.user.user_metadata?.phone,
        emailVerified: data.user.email_confirmed_at ? true : false,
        loyaltyTier: 'bronze',
        profile: profileData ? {
          ...profileData,
          roles: profileData.roles || ['customer']
        } : {
          id: data.user.id,
          roles: ['customer'],
          status: 'ACTIVE'
        }
      };

      setUser(normalizedUser);
      setProfile(normalizedUser.profile);
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Login failed.' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: Record<string, any>
  ): Promise<{ error: string | null }> => {
    try {
      const role = metadata?.role || 'customer';

      // ONE EMAIL = ONE ROLE: Check if this email already has an account
      const { data: existingUser } = await authService.getUser();
      if (existingUser?.user) {
        return { error: 'This email is already registered. Please log in instead, or use a different email for a new account.' };
      }

      const { data, error } = await authService.signUp(email, password, {
        full_name: metadata?.name || email.split('@')[0],
        phone: metadata?.phone,
        role: role,
        merchant_type: metadata?.merchantType || 'Restaurant',
        vehicle_type: metadata?.vehicleType || 'Motorbike'
      });

      if (error) {
        return { error: error.message || 'Signup failed.' };
      }

      if (data.session) {
        localStorage.setItem('accessToken', data.session.access_token);
        setToken(data.session.access_token);
      }

      if (!data.user) {
        return { error: 'Signup failed. No user data returned.' };
      }

      // Get profile
      const { data: profileData } = await profileService.getProfile(data.user.id);

      const normalizedUser: User = {
        id: data.user.id,
        email: data.user.email || '',
        fullName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
        phone: data.user.user_metadata?.phone,
        emailVerified: data.user.email_confirmed_at ? true : false,
        loyaltyTier: 'bronze',
        profile: profileData ? {
          ...profileData,
          roles: profileData.roles || [role]
        } : {
          id: data.user.id,
          roles: [role],
          status: 'ACTIVE'
        }
      };

      setUser(normalizedUser);
      setProfile(normalizedUser.profile);
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Signup failed.' };
    }
  };

  const signOut = async () => {
    try {
      const currentUser = user;
      if (currentUser) {
        // Remove active session record
        await supabase
          .from('active_sessions')
          .delete()
          .eq('user_id', currentUser.id);
      }
      await authService.signOut();
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
    } finally {
      localStorage.removeItem('accessToken');
      setToken(null);
      setUser(null);
      setProfile(null);
    }
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await authService.resetPassword(email);
      return { error: error?.message || null };
    } catch (err: any) {
      return { error: err.message || 'Password reset failed.' };
    }
  };

  const addRole = async (role: AppRole): Promise<{ error: string | null }> => {
    try {
      // ONE EMAIL = ONE ROLE: Cannot add a role if user already has one
      const currentRoles = profile?.roles || [];
      if (currentRoles.length > 0) {
        const currentRole = currentRoles[0];
        if (currentRole !== role) {
          return { error: `Your account already has the "${currentRole}" role. One email can only have one role. Please use a different email for ${role} access, or log out and sign up with a new email.` };
        }
        return { error: `You already have the "${role}" role.` };
      }

      if (!user) {
        return { error: 'You must be logged in to add a role.' };
      }

      // Add the role to the profile
      const { error: updateError } = await profileService.updateProfile(user.id, {
        roles: [role]
      });

      if (updateError) {
        return { error: updateError.message || 'Failed to add role.' };
      }

      // Refresh user data
      await refreshUser();
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to add role.' };
    }
  };

  const updateToken = (newToken: string | null) => {
    setToken(newToken);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, token, signIn, signUp, signOut, resetPassword, addRole, refreshUser, updateToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
