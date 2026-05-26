'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { subscribeToBootcamps } from '@/lib/db';
import GlassCard from '@/components/ui/GlassCard';
import { getPrimarySocietyId, getSocietyLabel } from '@/shared/societies';
import styles from './page.module.css';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

// SVG Icon Components
const RocketIcon = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>;
const BookIcon = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>;
const CodeIcon = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>;
const GraduationIcon = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>;
const GearIcon = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;
const BotIcon = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>;
const UsersIcon = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;

const SOCIETY_ICONS = {
  computer_society: <CodeIcon size={24} />,
  student_branch: <GraduationIcon size={24} />,
  women_in_engineering: <UsersIcon size={24} />,
  robotics: <BotIcon size={24} />,
  industrial_applications: <GearIcon size={24} />,
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [bootcamps, setBootcamps] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToBootcamps((data) => {
      const filtered = user.role === 'organiser' ? data.filter(bc => bc.createdBy === user.uid) : data;
      setBootcamps(filtered);
    });
    return () => unsub();
  }, [user]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const activeBootcamps = bootcamps.filter(b => b.status === 'active');

  return (
    <div className={styles.container}>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div className={styles.header} variants={fadeUp}>
          <div>
            <h1 className={styles.greeting}>
              {greeting()}, <span className={styles.name}>{user?.displayName || 'Admin'}</span>
            </h1>
            <p className={styles.subtitle}>Here&apos;s what&apos;s happening across your bootcamps</p>
          </div>
        </motion.div>

        {/* Single stat: Active Bootcamps */}
        <motion.div className={styles.statsGrid} variants={fadeUp}>
          <GlassCard hover={false} padding="lg">
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#6C63FF15', color: '#6C63FF' }}>
                <RocketIcon size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{activeBootcamps.length}</span>
                <span className={styles.statLabel}>Active Bootcamps</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Active Bootcamps */}
        <motion.div variants={fadeUp}>
          <div className={styles.sectionHeader}>
            <h2>Active Bootcamps</h2>
            <motion.a
              href="/admin/bootcamps"
              className="btn btn-primary btn-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              + New Bootcamp
            </motion.a>
          </div>

          {activeBootcamps.length === 0 ? (
            <GlassCard hover={false} padding="xl">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <RocketIcon size={48} />
                </div>
                <h3>No Bootcamps Yet</h3>
                <p className="empty-state-text">Create your first bootcamp to get started</p>
              </div>
            </GlassCard>
          ) : (
            <div className={styles.bootcampGrid}>
              {activeBootcamps.map((bc, i) => (
                <motion.div
                  key={bc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <GlassCard
                    glow
                    padding="lg"
                    onClick={() => router.push(`/admin/bootcamps/${bc.id}`)}
                  >
                    <div className={styles.bcCard}>
                      <div className={styles.bcHeader}>
                        <span className={styles.bcIcon}>
                          {SOCIETY_ICONS[getPrimarySocietyId(bc.society)] || <BookIcon size={24} />}
                        </span>
                        <span className="badge badge-success">Active</span>
                      </div>
                      <h3 className={styles.bcName}>{bc.name}</h3>
                      <p className={styles.bcDesc}>{bc.description}</p>
                      <div className={styles.bcMeta}>
                        <span className={styles.bcSociety}>
                          {getSocietyLabel(bc.society)}
                        </span>
                        {bc.teamConfig?.enabled && (
                          <span className="badge badge-info">Team-based</span>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
