'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import styles from '@/components/admin/AdminSidebar.module.css'; // Reusing admin sidebar CSS

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/volunteer' },
  { id: 'students', label: 'My Students', icon: '👥', path: '/volunteer/students' },
  { id: 'submissions', label: 'Submissions', icon: '📝', path: '/volunteer/submissions' },
];

export default function VolunteerSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleNav = (path) => {
    router.push(path);
    setIsMobileOpen(false);
  };

  const isActive = (path) => {
    if (path === '/volunteer') return pathname === '/volunteer';
    return pathname.startsWith(path);
  };

  return (
    <>
      <button
        className={styles.mobileToggle}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <motion.span animate={isMobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }} className={styles.hamburgerLine} />
        <motion.span animate={isMobileOpen ? { opacity: 0 } : { opacity: 1 }} className={styles.hamburgerLine} />
        <motion.span animate={isMobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }} className={styles.hamburgerLine} />
      </button>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className={styles.mobileOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`${styles.sidebar} ${isMobileOpen ? styles.mobileOpen : ''}`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        animate={{ width: isExpanded ? 280 : 72 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className={styles.logo}>
          <div className={styles.logoIcon}>🛡️</div>
          <AnimatePresence>
            {(isExpanded || isMobileOpen) && (
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
                {(isExpanded || isMobileOpen) && (
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
              {(isExpanded || isMobileOpen) && (
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
          >
            🚪
          </motion.button>
        </div>
      </motion.aside>

      <nav className={styles.mobileNav}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`${styles.mobileNavItem} ${isActive(item.path) ? styles.mobileActive : ''}`}
            onClick={() => handleNav(item.path)}
          >
            <span className={styles.mobileNavIcon}>{item.icon}</span>
            <span className={styles.mobileNavLabel}>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
