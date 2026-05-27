'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import styles from '@/components/admin/AdminSidebar.module.css';
import BootcampSwitcher from '@/components/ui/BootcampSwitcher';

const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>;
const StudentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const SubmissionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;
const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/volunteer' },
  { id: 'students', label: 'My Students', icon: <StudentsIcon />, path: '/volunteer/students' },
  { id: 'submissions', label: 'Submissions', icon: <SubmissionsIcon />, path: '/volunteer/submissions' },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon />, path: '/volunteer/settings' },
];

export default function VolunteerSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, bootcamp, logout } = useAuth();

  const handleNav = (path) => {
    router.push(path);
  };

  const isActive = (path) => {
    if (path === '/volunteer') return pathname === '/volunteer';
    return pathname.startsWith(path);
  };

  const dynamicNavItems = [...NAV_ITEMS];
  if (bootcamp?.teamConfig?.enabled) {
    dynamicNavItems.splice(2, 0, { id: 'teams', label: 'My Teams', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, path: '/volunteer/teams' });
  }

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
          <div className={styles.logoIcon}><ShieldIcon /></div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                className={styles.logoText}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className={styles.logoTitle}>Volunteer</span>
                <span className={styles.logoSub}>Portal</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <BootcampSwitcher isExpanded={isExpanded} />

        <nav className={styles.nav}>
          {dynamicNavItems.map((item) => (
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
              {user?.displayName?.[0] || 'V'}
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
                  <span className={styles.userName}>{user?.displayName || 'Volunteer'}</span>
                  <span className={styles.userRole}>Reviewer</span>
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
        {dynamicNavItems.map((item) => (
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