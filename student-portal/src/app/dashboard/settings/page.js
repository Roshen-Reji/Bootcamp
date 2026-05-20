'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { updateUserProfile } from '@/lib/auth';
import { updateOwnBootcampProfile } from '@/lib/db';
import GlassCard from '@/components/ui/GlassCard';
import styles from './page.module.css';

const UserIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const LogoutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const AlertIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;

export default function StudentSettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() });
      await updateUserProfile(user.uid, { displayName: displayName.trim() });
      if (user.bootcampId) {
        await updateOwnBootcampProfile(user.bootcampId, user.uid, user.role, { displayName: displayName.trim() });
      }
      if (refreshUser) await refreshUser();
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      console.error(err);
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const currentLevel = user?.level ? `Student - ${user.level}` : 'Student';

  return (
    <div className={styles.container}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Manage your student account</p>
        </div>

        <GlassCard hover={false} padding="lg">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} style={{ background: 'rgba(108, 99, 255, 0.15)', color: '#6C63FF' }}><UserIcon /></div>
            <div>
              <h2 className={styles.sectionTitle}>Profile Information</h2>
              <p className={styles.sectionDesc}>Update the name shown on submissions and leaderboards</p>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <input className={styles.input} type="email" value={user?.email || ''} disabled />
              <span className={styles.helpText}>Contact an admin to change your email or password.</span>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Display Name</label>
              <input className={styles.input} type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Role / Level</label>
              <input className={styles.input} type="text" value={currentLevel} disabled />
            </div>
            {profileMsg && (
              <div className={`${styles.message} ${styles[profileMsg.type]}`}>
                {profileMsg.type === 'success' ? <CheckIcon /> : <AlertIcon />}
                <span>{profileMsg.text}</span>
              </div>
            )}
            <button type="submit" className={styles.submitBtn} disabled={profileLoading}>
              {profileLoading ? <span className={styles.spinner} /> : <><CheckIcon /><span>Save Changes</span></>}
            </button>
          </form>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button type="button" onClick={logout} className="btn" style={{ background: 'rgba(255, 71, 87, 0.1)', color: '#ff4757', border: '1px solid rgba(255, 71, 87, 0.3)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', width: '100%', justifyContent: 'center' }}>
              <LogoutIcon />
              Sign Out
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}