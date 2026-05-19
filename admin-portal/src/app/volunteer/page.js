'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link'; // FIXED: Added Link import
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { getBootcamp, subscribeToSubmissions, subscribeToStudents } from '@/lib/db';
import GlassCard from '@/components/ui/GlassCard';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import styles from './page.module.css';

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [bootcamp, setBootcamp] = useState(null);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    if (!user || !user.bootcampId) return;

    const loadBc = async () => {
      const bc = await getBootcamp(user.bootcampId);
      if (bc) setBootcamp(bc);
    };
    loadBc();

    const unsubStudents = subscribeToStudents(user.bootcampId, (allStudents) => {
      // Filter for students assigned to this volunteer
      setStudents(allStudents.filter(s => s.volunteerId === user.uid));
    });

    const unsubSubs = subscribeToSubmissions(user.bootcampId, (allSubs) => {
      // Filter submissions for this volunteer's students
      // We need a mapping of assigned student IDs
      setSubmissions(allSubs);
    });

    return () => {
      unsubStudents();
      unsubSubs();
    };
  }, [user]);

  // Filter submissions dynamically based on current assigned students
  const myStudentIds = students.map(s => s.uid);
  const mySubmissions = submissions.filter(s => myStudentIds.includes(s.studentId));
  const pendingSubmissions = mySubmissions.filter(s => s.status === 'pending');

  if (!bootcamp) return null;

  return (
    <div className={styles.container}>
      <SocietyBackground society={bootcamp.society} customColor={bootcamp.colorTheme?.primary} />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome, {user?.displayName}</h1>
          <p className={styles.subtitle}>Volunteer Dashboard • {bootcamp.name}</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <GlassCard hover={false} padding="lg">
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(108, 99, 255, 0.15)', color: '#6C63FF' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div>
              <div className={styles.statValue}>{students.length}</div>
              <div className={styles.statLabel}>My Students</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover={false} padding="lg">
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(255, 165, 2, 0.15)', color: '#ffa502' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <div>
              <div className={styles.statValue}>{pendingSubmissions.length}</div>
              <div className={styles.statLabel}>Pending Reviews</div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className={styles.content}>
        <GlassCard hover={false} padding="lg">
          <h2 className={styles.sectionTitle}>Action Required</h2>
          {pendingSubmissions.length === 0 ? (
            <p className="text-secondary mt-2">No pending submissions to review. Great job!</p>
          ) : (
            <div className={styles.actionList}>
              {pendingSubmissions.slice(0, 5).map(sub => (
                <div key={sub.id} className={styles.actionItem}>
                  <div>
                    <span className={styles.studentName}>Student: {sub.studentId}</span>
                    <span className={styles.taskName}>Task: {sub.taskId}</span>
                  </div>
                  {/* FIXED: Changed from standard <a> tag to Next.js <Link> */}
                  <Link href="/volunteer/submissions" className="btn btn-primary btn-sm">Review</Link>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}