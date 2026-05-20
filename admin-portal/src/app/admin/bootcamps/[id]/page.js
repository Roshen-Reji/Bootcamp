'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getBootcamp, updateBootcamp } from '@/lib/db';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import GlassCard from '@/components/ui/GlassCard';
import { getSocietyLabel } from '@/shared/societies';
import styles from './page.module.css';

const TABS = [
  { id: 'overview', label: 'Overview', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { id: 'tasks', label: 'Tasks', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
  { id: 'volunteers', label: 'Volunteers', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { id: 'students', label: 'Students', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id: 'submissions', label: 'Submissions', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
  { id: 'leaderboard', label: 'Leaderboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg> },
];

export default function BootcampDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [bootcamp, setBootcamp] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBootcamp = async () => {
      const bc = await getBootcamp(id);
      if (!bc) {
        router.push('/admin/bootcamps');
        return;
      }
      setBootcamp(bc);
      setLoading(false);
    };
    loadBootcamp();
  }, [id, router]);

  const handleArchive = async () => {
    if (confirm('Are you sure you want to archive this bootcamp?')) {
      try {
        await updateBootcamp(id, { status: 'archived' });
        setBootcamp({ ...bootcamp, status: 'archived' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!bootcamp) return null;

  return (
    <div className={styles.container}>
      <SocietyBackground society={bootcamp.society} customColor={bootcamp.colorTheme?.primary} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Bootcamp Header */}
        <div className={styles.bcHeader}>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/admin/bootcamps')}>
            ← All Bootcamps
          </button>
          <div className={styles.bcInfo}>
            <span className={styles.bcIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            </span>
            <div>
              <h1 className={styles.bcName}>{bootcamp.name}</h1>
              <div className={styles.bcMeta}>
                <span className={styles.societyBadge} style={{ color: bootcamp.colorTheme?.primary }}>
                  {getSocietyLabel(bootcamp.society)}
                </span>
                {bootcamp.teamConfig?.enabled && (
                  <span className="badge badge-info">Team-based</span>
                )}
                <span className={`badge ${bootcamp.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                  {bootcamp.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats removed as requested */}

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => {
                if (tab.id === 'tasks') router.push(`/admin/bootcamps/${id}/tasks`);
                else if (tab.id === 'volunteers') router.push(`/admin/bootcamps/${id}/volunteers`);
                else if (tab.id === 'students') router.push(`/admin/bootcamps/${id}/students`);
                else if (tab.id === 'submissions') router.push(`/admin/bootcamps/${id}/submissions`);
                else if (tab.id === 'leaderboard') router.push(`/admin/bootcamps/${id}/leaderboard`);
                else setActiveTab(tab.id);
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Content */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.overviewGrid}
          >
            {/* Quick Actions */}
            <GlassCard hover={false} padding="lg">
              <h3 className={styles.sectionTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8, display: 'inline-block'}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Quick Actions
              </h3>
              <div className={styles.quickActions}>
                <button className="btn btn-primary" onClick={() => router.push(`/admin/bootcamps/${id}/volunteers`)}>
                  + Add Volunteer
                </button>
                <button className="btn btn-secondary" onClick={() => router.push(`/admin/bootcamps/${id}/students`)}>
                  + Add Student
                </button>
                <button className="btn btn-secondary" onClick={() => router.push(`/admin/bootcamps/${id}/tasks`)}>
                  + Create Task
                </button>
                {bootcamp.status !== 'archived' && (
                  <button className="btn btn-ghost" style={{color: '#ff4757', borderColor: '#ff4757'}} onClick={handleArchive}>
                    Archive Bootcamp
                  </button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
