'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { updateUserProfile } from '@/lib/auth';
import { updateOwnBootcampProfile } from '@/lib/db';
import GlassCard from '@/components/ui/GlassCard';
import styles from './page.module.css';

const UserIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const LockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const LogoutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const AlertIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;

export default function StudentSettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setPasswordMsg({ type: 'error', text: err.code === 'auth/wrong-password' ? 'Current password is incorrect.' : err.message || 'Failed to change password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const currentLevel = user?.level ? `Student - ${user.level}` : 'Student';
  const tabs = [
    { id: 'profile', label: 'Profile', icon: <UserIcon /> },
    { id: 'security', label: 'Security', icon: <LockIcon /> },
  ];

  return (
    <div className={styles.container}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Manage your student account</p>
        </div>

        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button key={tab.id} className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`} onClick={() => setActiveTab(tab.id)}>
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
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
                <span className={styles.helpText}>Email cannot be changed here</span>
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
        )}

        {activeTab === 'security' && (
          <GlassCard hover={false} padding="lg">
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon} style={{ background: 'rgba(46, 213, 115, 0.15)', color: '#2ed573' }}><LockIcon /></div>
              <div>
                <h2 className={styles.sectionTitle}>Change Password</h2>
                <p className={styles.sectionDesc}>Reauthenticate and set a new password</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Current Password</label>
                <input className={styles.input} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>New Password</label>
                <input className={styles.input} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Confirm New Password</label>
                <input className={styles.input} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
              </div>
              {passwordMsg && (
                <div className={`${styles.message} ${styles[passwordMsg.type]}`}>
                  {passwordMsg.type === 'success' ? <CheckIcon /> : <AlertIcon />}
                  <span>{passwordMsg.text}</span>
                </div>
              )}
              <button type="submit" className={styles.submitBtn} disabled={passwordLoading}>
                {passwordLoading ? <span className={styles.spinner} /> : <><LockIcon /><span>Update Password</span></>}
              </button>
            </form>
          </GlassCard>
        )}
      </motion.div>
    </div>
  );
}
