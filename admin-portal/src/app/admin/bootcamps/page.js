'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { subscribeToBootcamps, deleteBootcamp } from '@/lib/db';
import GlassCard from '@/components/ui/GlassCard';
import styles from './page.module.css';

const SOCIETY_ICONS = {
  computer_society: '💻',
  student_branch: '🎓',
  women_in_engineering: '👩‍💻',
  robotics: '🤖',
  industrial_applications: '⚙️',
};

const SOCIETY_NAMES = {
  computer_society: 'Computer Society',
  student_branch: 'Student Branch',
  women_in_engineering: 'Women In Engineering',
  robotics: 'Robotics & Automation',
  industrial_applications: 'Industrial Applications',
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export default function BootcampsPage() {
  const [bootcamps, setBootcamps] = useState([]);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const unsub = subscribeToBootcamps(setBootcamps);
    return () => unsub();
  }, []);

  const filtered = filter === 'all'
    ? bootcamps
    : bootcamps.filter(bc => bc.status === filter);

  return (
    <div className={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Bootcamps</h1>
            <p className={styles.subtitle}>Manage all your IEEE bootcamps</p>
          </div>
          <motion.button
            className="btn btn-primary btn-lg"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/admin/bootcamps/create')}
          >
            + Create Bootcamp
          </motion.button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          {['all', 'active', 'archived'].map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={styles.filterCount}>
                {f === 'all' ? bootcamps.length : bootcamps.filter(bc => bc.status === f).length}
              </span>
            </button>
          ))}
        </div>

        {/* Bootcamp Grid */}
        {filtered.length === 0 ? (
          <GlassCard hover={false} padding="xl">
            <div className="empty-state">
              <div className="empty-state-icon">🚀</div>
              <h3>No bootcamps found</h3>
              <p className="empty-state-text">
                {filter === 'all'
                  ? 'Create your first bootcamp to get started'
                  : `No ${filter} bootcamps`}
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className={styles.grid}>
            {filtered.map((bc, i) => (
              <motion.div
                key={bc.id}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard
                  glow
                  padding="lg"
                  onClick={() => router.push(`/admin/bootcamps/${bc.id}`)}
                >
                  <div className={styles.card}>
                    <div className={styles.cardTop}>
                      <span className={styles.cardIcon}>
                        {bc.icon || SOCIETY_ICONS[bc.society] || '🚀'}
                      </span>
                      <span className={`badge ${bc.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                        {bc.status}
                      </span>
                    </div>
                    <h3 className={styles.cardName}>{bc.name}</h3>
                    <p className={styles.cardDesc}>{bc.description}</p>
                    <div className={styles.cardFooter}>
                      <div className={styles.societyTag}>
                        <span>{SOCIETY_ICONS[bc.society]}</span>
                        <span>{SOCIETY_NAMES[bc.society] || bc.society}</span>
                      </div>
                      <div className={styles.cardBadges}>
                        {bc.teamConfig?.enabled && (
                          <span className="badge badge-info">Teams</span>
                        )}
                      </div>
                    </div>
                    {/* Color theme preview */}
                    <div className={styles.themePreview}>
                      <div
                        className={styles.themeColor}
                        style={{ background: bc.colorTheme?.primary || '#6C63FF' }}
                      />
                      <div
                        className={styles.themeColor}
                        style={{ background: bc.colorTheme?.secondary || '#FF6584' }}
                      />
                      <div
                        className={styles.themeColor}
                        style={{ background: bc.colorTheme?.accent || '#00D9FF' }}
                      />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
