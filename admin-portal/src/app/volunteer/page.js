'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { getBootcamp, subscribeToSubmissions, subscribeToStudents, subscribeToTasks, subscribeToTeams } from '@/lib/db';
import GlassCard from '@/components/ui/GlassCard';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import styles from './page.module.css';

// Minimalist Icons
const UserIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const TaskIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
const SubtaskIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
const ClockIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [bootcamp, setBootcamp] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!user || !user.bootcampId) return;

    const loadBc = async () => {
      const bc = await getBootcamp(user.bootcampId);
      if (bc) setBootcamp(bc);
    };
    loadBc();

    const unsubStudents = subscribeToStudents(user.bootcampId, setAllStudents);
    const unsubTeams = subscribeToTeams(user.bootcampId, setTeams);

    const unsubSubs = subscribeToSubmissions(user.bootcampId, (allSubs) => {
      setSubmissions(allSubs);
    });

    const unsubTasks = subscribeToTasks(user.bootcampId, (data) => setTasks(data));

    return () => {
      unsubStudents();
      unsubTeams();
      unsubSubs();
      unsubTasks();
    };
  }, [user]);

  const isTeamBased = bootcamp?.teamConfig?.enabled;
  const myTeamIds = isTeamBased ? teams.filter(t => t.volunteerId === user.uid).map(t => t.id) : [];
  const students = isTeamBased 
    ? allStudents.filter(s => myTeamIds.includes(s.teamId))
    : allStudents.filter(s => s.volunteerId === user.uid);

  // Create mapping dictionaries for fast lookup
  const studentMap = {};
  students.forEach(s => { studentMap[s.uid || s.id] = s; });

  const taskMap = {};
  tasks.forEach(t => { taskMap[t.id] = t; });

  // Helper functions to convert raw IDs to readable names
  const getStudentName = (studentId) => {
    const student = studentMap[studentId];
    return student ? (student.name || student.displayName || student.email) : 'Unknown Student';
  };

  const getTaskName = (taskId) => {
    const task = taskMap[taskId];
    return task ? task.title : 'Unknown Task';
  };

  // Filter submissions dynamically based on current assigned students
  const myStudentIds = students.map(s => s.uid || s.id);
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
          <h2 className={styles.sectionTitle} style={{ marginBottom: '16px' }}>Action Required</h2>

          {pendingSubmissions.length === 0 ? (
            <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
              <p className="text-secondary m-0">No pending submissions to review. Great job!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingSubmissions.slice(0, 5).map((sub, i) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: 'rgba(0,0,0,0.15)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserIcon /> {getStudentName(sub.studentId)}
                    </h4>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#a0a0a0' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {sub.subtaskId ? <SubtaskIcon /> : <TaskIcon />}
                        {sub.subtaskId ? `Subtask: ${sub.subtaskTitle || sub.subtaskId}` : getTaskName(sub.taskId)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ClockIcon /> {sub.submittedAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                      </span>
                    </div>
                  </div>

                  <Link href="/volunteer/submissions" className="btn btn-primary btn-sm" style={{ padding: '6px 16px' }}>
                    Review
                  </Link>
                </motion.div>
              ))}

              {pendingSubmissions.length > 5 && (
                <Link href="/volunteer/submissions" style={{ display: 'block', textAlign: 'center', marginTop: '12px', fontSize: '0.9rem', color: '#6c5ce7', textDecoration: 'none' }}>
                  View all {pendingSubmissions.length} pending submissions →
                </Link>
              )}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
