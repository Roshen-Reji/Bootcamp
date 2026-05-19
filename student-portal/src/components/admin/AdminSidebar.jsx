'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import styles from './AdminSidebar.module.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/admin' },
  { id: 'bootcamps', label: 'Bootcamps', icon: '🚀', path: '/admin/bootcamps' },
  { id: 'users', label: 'Users', icon: '👥', path: '/admin/users' },
  { id: 'settings', label: 'Settings', icon: '⚙️', path: '/admin/settings' },
];

export default function AdminSidebar() {
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
    if (path === '/admin') return pathname === '/admin';
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className={styles.mobileToggle}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle navigation"
      >
        <motion.span
          animate={isMobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
          className={styles.hamburgerLine}
        />
        <motion.span
          animate={isMobileOpen ? { opacity: 0 } : { opacity: 1 }}
          className={styles.hamburgerLine}
        />
        <motion.span
          animate={isMobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
          className={styles.hamburgerLine}
        />
      </button>

      {/* Mobile overlay */}
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

      {/* Sidebar */}
      <motion.aside
        className={`${styles.sidebar} ${isMobileOpen ? styles.mobileOpen : ''}`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        animate={{ width: isExpanded ? 280 : 72 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>⚡</div>
          <AnimatePresence>
            {(isExpanded || isMobileOpen) && (
              <motion.div
                className={styles.logoText}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className={styles.logoTitle}>IEEE</span>
                <span className={styles.logoSub}>Bootcamp</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
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
                <motion.div
                  className={styles.activeIndicator}
                  layoutId="activeNav"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
            </motion.button>
          ))}
        </nav>

        {/* User / Logout */}
        <div className={styles.footer}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user?.displayName?.[0] || '👤'}
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
                  <span className={styles.userName}>{user?.displayName || 'Admin'}</span>
                  <span className={styles.userRole}>Administrator</span>
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
            🚪
          </motion.button>
        </div>
      </motion.aside>

      {/* Mobile Bottom Nav */}
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
