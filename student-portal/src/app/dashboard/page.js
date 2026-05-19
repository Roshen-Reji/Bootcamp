'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { getBootcamp, subscribeToTasks, subscribeToSubmissions, subscribeToStudent } from '@/lib/db';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import GlassCard from '@/components/ui/GlassCard';
import styles from './page.module.css';

export default function StudentDashboard() {
  // Added refreshUser to update the sidebar globally
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [bootcamp, setBootcamp] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);

  useEffect(() => {
    if (!user?.bootcampId) return;

    const loadBc = async () => {
      const bc = await getBootcamp(user.bootcampId);
      if (bc) setBootcamp(bc);
    };
    loadBc();

    const unsubTasks = subscribeToTasks(user.bootcampId, setTasks);

    // Fetch only this user's submissions
    const unsubSubs = subscribeToSubmissions(user.bootcampId, (allSubs) => {
      setSubmissions(allSubs.filter(s => s.studentId === user.uid));
    });

    // Listen to the student's specific document in real-time
    const unsubStudent = subscribeToStudent(user.bootcampId, user.uid, (profile) => {
      setStudentProfile(profile);

      // MAGIC TRICK: If the real-time profile level is different from the cached user level,
      // refresh the global Auth Context so the Sidebar at the bottom instantly updates!
      if (profile?.level && user?.level && profile.level !== user.level) {
        refreshUser();
      }
    });

    return () => {
      unsubTasks();
      unsubSubs();
      unsubStudent(); // Cleanup listener
    };
  }, [user, refreshUser]);

  if (!bootcamp) return null;

  // Calculate stats
  const completedTaskIds = submissions
    .filter(s => s.status === 'approved')
    .map(s => s.taskId);

  const pendingTaskIds = submissions
    .filter(s => s.status === 'pending')
    .map(s => s.taskId);

  // Determine current level dynamically from real-time profile, fallback to session user level
  const currentLevel = studentProfile?.level || user?.level || 'beginner';

  // STRICT FILTERING: Only show tasks that match the student's exact current level
  const availableTasks = tasks.filter(t => t.level === currentLevel);
  const nextTask = availableTasks.find(t => !completedTaskIds.includes(t.id) && !pendingTaskIds.includes(t.id));

  return (
    <div className={styles.container}>
      <SocietyBackground society={bootcamp.society} customColor={bootcamp.colorTheme?.primary} />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Hello, {user?.displayName}</h1>
          <p className={styles.subtitle}>Welcome to {bootcamp.name}</p>
        </div>
        {/* Removed the top Level badge from here as requested */}
      </div>

      <div className={styles.statsRow}>
        <GlassCard hover={false} padding="lg">
          <div className={styles.statBox}>
            <span className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
            </span>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{studentProfile?.totalPoints || user?.totalPoints || 0}</span>
              <span className={styles.statLabel}>Total Points</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover={false} padding="lg">
          <div className={styles.statBox}>
            <span className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </span>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{completedTaskIds.length}</span>
              <span className={styles.statLabel}>Tasks Completed</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover={false} padding="lg">
          <div className={styles.statBox}>
            <span className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </span>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{pendingTaskIds.length}</span>
              <span className={styles.statLabel}>Pending Review</span>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className={styles.grid}>
        <div className={styles.mainCol}>
          <GlassCard hover={false} padding="lg">
            <h2 className={styles.sectionTitle}>Up Next For You</h2>
            {nextTask ? (
              <div className={styles.nextTask}>
                <div className={styles.nextTaskInfo}>
                  <h3>{nextTask.title}</h3>
                  <span className={`badge ${nextTask.level === 'advanced' ? 'badge-danger' :
                      nextTask.level === 'intermediate' ? 'badge-warning' : 'badge-success'
                    }`}>
                    {nextTask.level}
                  </span>
                  <p>{nextTask.description}</p>
                  <span className={styles.points}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, display: 'inline-block' }}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
                    {nextTask.points} points
                  </span>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => router.push(`/dashboard/tasks/${nextTask.id}`)}
                >
                  Start Task →
                </button>
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-state-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </span>
                <p>You have completed all available tasks for your current level!</p>
              </div>
            )}
          </GlassCard>
        </div>

        <div className={styles.sideCol}>
          <GlassCard hover={false} padding="lg">
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <div className={styles.activityList}>
              {submissions.slice(0, 5).map(sub => {
                const task = tasks.find(t => t.id === sub.taskId);
                return (
                  <div key={sub.id} className={styles.activityItem}>
                    <div className={styles.activityInfo}>
                      <span className={styles.activityTitle}>{task?.title || 'Unknown Task'}</span>
                      <span className={styles.activityDate}>
                        {sub.submittedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </span>
                    </div>
                    <span className={`badge ${sub.status === 'approved' ? 'badge-success' :
                        sub.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                      }`}>
                      {sub.status}
                    </span>
                  </div>
                );
              })}
              {submissions.length === 0 && (
                <p className={styles.emptyText}>No activity yet. Start your first task!</p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}