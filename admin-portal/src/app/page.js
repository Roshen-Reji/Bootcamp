'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { loginUser, loginWithGoogle } from '@/lib/auth';
import { Zap, Mail, Lock } from 'lucide-react';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import styles from './page.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'volunteer') {
        router.push('/volunteer');
      }
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userData = await loginUser(email, password);
      
      if (userData.role === 'student') {
        setError('Students should use the Student Portal to log in');
        setLoading(false);
        return;
      }

      if (userData.role === 'admin') {
        router.push('/admin');
      } else if (userData.role === 'volunteer') {
        router.push('/volunteer');
      } else {
        setError('Unauthorized access');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later');
      } else {
        setError('Something went wrong. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const userData = await loginWithGoogle();

      if (userData.role === 'student') {
        setError('Students should use the Student Portal to log in');
        setLoading(false);
        return;
      }

      if (userData.role === 'admin') {
        router.push('/admin');
      } else if (userData.role === 'volunteer') {
        router.push('/volunteer');
      } else {
        setError('Unauthorized access');
      }
    } catch (err) {
      console.error('Google login error:', err);
      if (err.message) {
        setError(err.message);
      } else {
        setError('Google login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <SocietyBackground society="computer_society" />
      
      <div className={styles.orbContainer}>
        <motion.div
          className={styles.orb}
          style={{ background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)' }}
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -80, 60, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className={`${styles.orb} ${styles.orb2}`}
          style={{ background: 'radial-gradient(circle, rgba(0,217,255,0.1) 0%, transparent 70%)' }}
          animate={{
            x: [0, -120, 80, 0],
            y: [0, 60, -100, 0],
            scale: [1, 0.8, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        className={styles.loginWrapper}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo / Branding */}
        <motion.div
          className={styles.branding}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className={styles.logoIcon}>
            <Zap size={32} />
          </div>
          <h1 className={styles.brandTitle}>IEEE Bootcamp</h1>
          <p className={styles.brandSubtitle}>Admin & Volunteer Portal</p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          className={styles.loginCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><Mail size={18} /></span>
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  placeholder="admin@ieee.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><Lock size={18} /></span>
                <input
                  id="password"
                  type="password"
                  className={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  className={styles.error}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className={styles.btnSpinner} />
              ) : (
                <>
                  Sign In
                  <span className={styles.btnArrow}>→</span>
                </>
              )}
            </motion.button>
            
            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ padding: '0 12px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            </div>

            <button
              type="button"
              className="btn w-full"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                background: 'white',
                color: '#333',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              onClick={handleGoogleLogin}
              disabled={loading}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>
        </motion.div>

        <motion.p
          className={styles.footerText}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Students? Use the <strong>Student Portal</strong> to log in.
        </motion.p>
      </motion.div>
    </div>
  );
}
