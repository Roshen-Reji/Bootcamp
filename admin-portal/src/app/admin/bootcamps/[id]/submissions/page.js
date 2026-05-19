'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getBootcamp, subscribeToSubmissions, subscribeToStudents, subscribeToTasks, reviewSubmission } from '@/lib/db';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import GlassCard from '@/components/ui/GlassCard';
import styles from './page.module.css';

// Icons
const BackIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>;
const FileIcon = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>;
const UserIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const TaskIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
const ClockIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const XIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const LinkIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>;
const SubtaskIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;

export default function SubmissionsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [bootcamp, setBootcamp] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null); // ADDED: Prevents multi-clicks

  useEffect(() => {
    const loadBc = async () => {
      const bc = await getBootcamp(id);
      if (bc) setBootcamp(bc);
    };
    loadBc();

    const unsubSubs = subscribeToSubmissions(id, setSubmissions);
    const unsubStudents = subscribeToStudents(id, (data) => setStudents(data));
    const unsubTasks = subscribeToTasks(id, (data) => setTasks(data));

    return () => {
      unsubSubs();
      unsubStudents();
      unsubTasks();
    };
  }, [id]);

  const studentMap = {};
  students.forEach(s => { studentMap[s.uid || s.id] = s; });

  const taskMap = {};
  tasks.forEach(t => { taskMap[t.id] = t; });

  const getStudentName = (studentId) => {
    const student = studentMap[studentId];
    if (student) return student.name || student.displayName || student.email || 'Unknown Student';
    return 'Unknown Student';
  };

  const getStudentInitial = (studentId) => {
    const name = getStudentName(studentId);
    return name.charAt(0).toUpperCase();
  };

  const getTaskName = (taskId) => {
    const task = taskMap[taskId];
    if (task) return task.title || 'Untitled Task';
    return 'Unknown Task';
  };

  const handleStatusUpdate = async (sub, newStatus) => {
    if (processingId) return; // Ignore if already processing an update
    setProcessingId(sub.id);

    try {
      const targetPoints = sub.points !== undefined
        ? sub.points
        : (taskMap[sub.taskId]?.points || 10);

      await reviewSubmission(id, sub.id, {
        status: newStatus,
        pointsAwarded: newStatus === 'approved' ? targetPoints : 0
      });
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setProcessingId(null);
    }
  };

  if (!bootcamp) return null;

  const filteredSubs = filter === 'all'
    ? submissions
    : submissions.filter(s => s.status === filter);

  return (
    <div className={styles.container}>
      <SocietyBackground society={bootcamp.society} customColor={bootcamp.colorTheme?.primary} />

      <div className={styles.header}>
        <div>
          <button className={styles.backBtn} onClick={() => router.push(`/admin/bootcamps/${id}`)}>
            <BackIcon />
            <span>Back to Dashboard</span>
          </button>
          <h1 className={styles.title}>Submissions</h1>
          <p className={styles.subtitle}>Review and grade student submissions</p>
        </div>
      </div>

      <div className={styles.filters}>
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={styles.filterCount}>
              {f === 'all' ? submissions.length : submissions.filter(s => s.status === f).length}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {filteredSubs.length === 0 ? (
          <GlassCard hover={false} padding="xl">
            <div className="empty-state">
              <span className="empty-state-icon">
                <FileIcon />
              </span>
              <h3>No {filter} submissions</h3>
              <p className="empty-state-text">You&apos;re all caught up!</p>
            </div>
          </GlassCard>
        ) : (
          filteredSubs.map((sub, i) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard padding="lg">
                <div className={styles.subCard}>
                  <div className={styles.subHeader}>
                    <div className={styles.subMeta}>
                      <div className={styles.studentAvatar}>
                        {getStudentInitial(sub.studentId)}
                      </div>
                      <div>
                        <h3 className={styles.subStudent}>
                          <UserIcon />
                          <span>{getStudentName(sub.studentId)}</span>
                        </h3>
                        <p className={styles.subTask}>
                          {sub.subtaskId ? <SubtaskIcon /> : <TaskIcon />}
                          <span>{sub.subtaskId ? `Subtask: ${sub.subtaskTitle || sub.subtaskId}` : getTaskName(sub.taskId)}</span>
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${sub.status === 'approved' ? 'badge-success' :
                        sub.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                      }`}>
                      {sub.status}
                    </span>
                  </div>

                  <div className={styles.subContent}>
                    <p className={styles.subTypeLabel}>Submission ({sub.type}):</p>
                    {['link', 'video', 'image'].includes(sub.type) ? (
                      <a href={sub.content} target="_blank" rel="noreferrer" className={styles.subLink}>
                        <LinkIcon />
                        <span>View Submission ↗</span>
                      </a>
                    ) : sub.type === 'code' ? (
                      <pre className={styles.codeBlock}>
                        <code>{sub.content}</code>
                      </pre>
                    ) : (
                      <p className={styles.subText}>{Array.isArray(sub.content) ? sub.content.join(', ') : sub.content}</p>
                    )}
                  </div>

                  <div className={styles.subFooter}>
                    <span className={styles.subDate}>
                      <ClockIcon />
                      <span>{sub.submittedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
                    </span>

                    {sub.status === 'pending' && (
                      <div className={styles.actions}>
                        <button
                          className={styles.rejectBtn}
                          onClick={() => handleStatusUpdate(sub, 'rejected')}
                          disabled={processingId === sub.id}
                        >
                          <XIcon />
                          <span>Reject</span>
                        </button>
                        <button
                          className={styles.approveBtn}
                          onClick={() => handleStatusUpdate(sub, 'approved')}
                          disabled={processingId === sub.id}
                        >
                          <CheckIcon />
                          <span>
                            {processingId === sub.id ? 'Processing...' : `Approve (+${sub.points !== undefined ? sub.points : (taskMap[sub.taskId]?.points || 10)} pts)`}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}