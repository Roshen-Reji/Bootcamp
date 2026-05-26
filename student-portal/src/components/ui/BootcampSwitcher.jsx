'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { getBootcampsByIds } from '@/lib/db';
import { updateUserProfile } from '@/lib/auth';
import styles from './BootcampSwitcher.module.css';

const SwitchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
);

export default function BootcampSwitcher({ isExpanded }) {
  const { user, bootcamp, refreshBootcamp } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [availableBootcamps, setAvailableBootcamps] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch bootcamp details if user has multiple active bootcamps
  useEffect(() => {
    if (user?.activeBootcamps && user.activeBootcamps.length > 1) {
      setLoading(true);
      getBootcampsByIds(user.activeBootcamps).then(bcs => {
        setAvailableBootcamps(bcs);
        setLoading(false);
      }).catch(err => {
        console.error('Failed to load bootcamps for switcher', err);
        setLoading(false);
      });
    }
  }, [user?.activeBootcamps]);

  // Don't render anything if they only have 1 or 0 bootcamps
  if (!user?.activeBootcamps || user.activeBootcamps.length <= 1) {
    return null;
  }

  const handleSwitch = async (newBootcampId) => {
    if (newBootcampId === user.bootcampId) return;
    
    setIsOpen(false);
    try {
      // Update in firestore
      await updateUserProfile(user.uid, { bootcampId: newBootcampId });
      // Reload page to re-fetch all contexts safely (tasks, leaderboard etc depend on bootcampId on mount)
      window.location.reload();
    } catch (err) {
      console.error('Failed to switch bootcamp', err);
      alert('Failed to switch bootcamp. Please try again.');
    }
  };

  return (
    <div className={styles.switcherContainer} ref={dropdownRef}>
      <button 
        className={`${styles.switcherBtn} ${!isExpanded ? styles.collapsed : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        title="Switch Bootcamp"
      >
        <span className={styles.icon}><SwitchIcon /></span>
        <AnimatePresence>
          {isExpanded && (
            <motion.span 
              className={styles.currentName}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
            >
              {bootcamp?.name || 'Loading...'}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={`${styles.dropdown} ${!isExpanded ? styles.dropdownCollapsed : ''}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className={styles.dropdownHeader}>Switch Bootcamp</div>
            {loading ? (
              <div className={styles.loading}>Loading...</div>
            ) : (
              <ul className={styles.bootcampList}>
                {availableBootcamps.map(bc => (
                  <li key={bc.id}>
                    <button 
                      className={`${styles.bootcampOption} ${bc.id === user.bootcampId ? styles.activeOption : ''}`}
                      onClick={() => handleSwitch(bc.id)}
                    >
                      <span className={styles.bcName}>{bc.name}</span>
                      {bc.id === user.bootcampId && <span className={styles.activeDot}></span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
