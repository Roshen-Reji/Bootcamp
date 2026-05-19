'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, logoutUser, getUserProfile } from '@/lib/auth';
import { getBootcamp } from '@/lib/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bootcamp, setBootcamp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        // If user has a bootcampId, load the bootcamp data
        if (authUser.bootcampId) {
          const bc = await getBootcamp(authUser.bootcampId);
          setBootcamp(bc);
        }
      } else {
        setUser(null);
        setBootcamp(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setBootcamp(null);
  };

  const refreshUser = async () => {
    if (user?.uid) {
      const profile = await getUserProfile(user.uid);
      setUser(prev => ({ ...prev, ...profile }));
    }
  };

  const refreshBootcamp = async () => {
    if (user?.bootcampId) {
      const bc = await getBootcamp(user.bootcampId);
      setBootcamp(bc);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      bootcamp,
      loading,
      logout,
      refreshUser,
      refreshBootcamp,
      isAdmin: user?.role === 'admin',
      isVolunteer: user?.role === 'volunteer',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
