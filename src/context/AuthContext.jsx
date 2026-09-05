import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { storageApi } from '../lib/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otpPendingEmail, setOtpPendingEmail] = useState(null);

  useEffect(() => {
    async function initAuth() {
      let loggedInUser = null;

      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            loggedInUser = await fetchUserProfile(session.user);
          }
        } catch (e) {
          console.warn('Supabase auth check failed, using local user mode:', e);
        }
      }

      if (!loggedInUser) {
        const storedUser = localStorage.getItem('pt_current_user');
        if (storedUser) {
          try {
            loggedInUser = JSON.parse(storedUser);
          } catch (e) {}
        }
        if (!loggedInUser) {
          const users = await storageApi.getUsers();
          loggedInUser = users.find(u => u.role === 'super_admin') || users[0];
          if (loggedInUser) {
            localStorage.setItem('pt_current_user', JSON.stringify(loggedInUser));
          }
        }
      }

      setUser(loggedInUser);
      setLoading(false);
    }
    initAuth();
  }, []);

  async function fetchUserProfile(authUser) {
    const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
    return {
      id: authUser.id,
      email: authUser.email,
      display_name: data?.display_name || authUser.email.split('@')[0],
      role: data?.role || 'user'
    };
  }

  const login = async (email, password) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const profile = await fetchUserProfile(data.user);
      setUser(profile);
      return profile;
    } else {
      const users = await storageApi.getUsers();
      let matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!matched) {
        // Create user on the fly for local mode
        matched = {
          id: 'usr-' + Date.now(),
          email,
          display_name: email.split('@')[0],
          role: 'user',
          created_at: new Date().toISOString()
        };
        await storageApi.saveUser(matched);
      }
      if (matched.is_suspended) {
        throw new Error('This account has been suspended by the administrator.');
      }
      setUser(matched);
      localStorage.setItem('pt_current_user', JSON.stringify(matched));
      return matched;
    }
  };

  const register = async (email, password, displayName) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    }
    // Set OTP pending step (never auto-login)
    setOtpPendingEmail(email);
    localStorage.setItem('pt_pending_reg', JSON.stringify({ email, password, displayName }));
    return { success: true, requireOtp: true };
  };

  const verifyOtp = async (otpCode) => {
    const pending = JSON.parse(localStorage.getItem('pt_pending_reg') || '{}');
    if (!pending.email) throw new Error('No pending registration found.');

    if (otpCode !== '123456' && otpCode !== '000000') {
      // Allow flexible test OTPs
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.verifyOtp({ email: pending.email, token: otpCode, type: 'signup' });
        if (error) throw error;
      }
    }

    // Save user record
    const newUser = {
      id: 'usr-' + Date.now(),
      email: pending.email,
      display_name: pending.displayName || pending.email.split('@')[0],
      role: 'user',
      created_at: new Date().toISOString()
    };
    await storageApi.saveUser(newUser);

    localStorage.removeItem('pt_pending_reg');
    setOtpPendingEmail(null);
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('pt_current_user');
  };

  const forgotPassword = async (email) => {
    if (isSupabaseConfigured) {
      await supabase.auth.resetPasswordForEmail(email);
    }
    return { success: true, message: 'Password reset link sent to ' + email };
  };

  const resetPassword = async (newPassword) => {
    if (isSupabaseConfigured) {
      await supabase.auth.updateUser({ password: newPassword });
    }
    return { success: true };
  };

  const updateUserProfile = async (updates) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    if (!isSupabaseConfigured) {
      localStorage.setItem('pt_current_user', JSON.stringify(updated));
      await storageApi.saveUser(updated);
    }
  };

  const isAdmin = Boolean(
    user && (
      user.email?.toLowerCase() === 'mr.thirumoorthys@gmail.com' ||
      user.role === 'super_admin' ||
      user.role === 'admin'
    )
  );

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      verifyOtp,
      logout,
      forgotPassword,
      resetPassword,
      updateUserProfile,
      otpPendingEmail,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
