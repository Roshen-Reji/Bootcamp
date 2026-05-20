'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { subscribeToStudent } from '@/lib/db';
import styles from '@/components/admin/AdminSidebar.module.css';

const DashboardIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>;
const TasksIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>;
const LeaderboardIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>;
const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;
const LogoIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>;
const LogoutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { id: 'tasks', label: 'My Tasks', icon: <TasksIcon />, path: '/dashboard/tasks' },
  { id: 'leaderboard', label: 'Leaderboard', icon: <LeaderboardIcon />, path: '/dashboard/leaderboard' },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon />, path: '/dashboard/settings' },
];

export default function StudentSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user?.bootcampId || !user?.uid) return;
    const unsub = subscribeToStudent(user.bootcampId, user.uid, setStudentProfile);
    return () => unsub();
  }, [user]);

  const handleNav = (path) => {
    router.push(path);
  };

  const isActive = (path) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(path);
  };

  const currentLevelRaw = studentProfile?.level || user?.level || 'beginner';
  const displayLevel = currentLevelRaw.charAt(0).toUpperCase() + currentLevelRaw.slice(1);

  return (
    <>
      <motion.aside
        className={styles.sidebar}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        animate={{ width: isExpanded ? 280 : 72 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className={styles.logo}>
          <div className={styles.logoIcon}><LogoIcon /></div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                className={styles.logoText}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className={styles.logoTitle}>Student</span>
                <span className={styles.logoSub}>Portal</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <motion.button
              key={item.id}
              className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
              onClick={() => handleNav(item.path)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    className={styles.navLabel}
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive(item.path) && (
                <motion.div className={styles.activeIndicator} layoutId="activeNav" />
              )}
            </motion.button>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user?.displayName?.[0] || 'S'}
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  className={styles.userMeta}
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className={styles.userName}>{user?.displayName || 'Student'}</span>
                  <span className={styles.userRole}>Level: {displayLevel}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            className={styles.logoutBtn}
            onClick={logout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Logout"
          >
            <LogoutIcon />
          </motion.button>
        </div>
      </motion.aside>

      <nav className={styles.mobileNav}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`${styles.mobileNavItem} ${isActive(item.path) ? styles.mobileActive : ''}`}
            onClick={() => handleNav(item.path)}
            title={item.label}
          >
            <span className={styles.mobileNavIcon}>{item.icon}</span>
          </button>
        ))}
      </nav>
    </>
  );
}