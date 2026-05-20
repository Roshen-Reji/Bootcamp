'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getBootcamp, subscribeToSubmissions, subscribeToStudents, subscribeToTasks, reviewSubmission } from '@/lib/db';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import GlassCard from '@/components/ui/GlassCard';
import SubmissionAssistantPanel from '@/components/submissions/SubmissionAssistantPanel';
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
  const [processingId, setProcessingId] = useState(null);
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  const [customPoints, setCustomPoints] = useState({});
  const [rejectingId, setRejectingId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});

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

  const getMaxPoints = (sub) => {
    return sub.points !== undefined ? sub.points : (taskMap[sub.taskId]?.points || 10);
  };

  const handleStatusUpdate = async (sub, newStatus, awardedPoints = 0, reviewerNote = null) => {
    if (processingId) return;
    setProcessingId(sub.id);

    try {
      const payload = {
        status: newStatus,
        pointsAwarded: newStatus === 'approved' ? awardedPoints : 0
      };

      if (reviewerNote !== null) {
        payload.reviewerNote = reviewerNote;
      }

      await reviewSubmission(id, sub.id, payload);
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setProcessingId(null);
    }
  };

  const setDraftNote = (submissionId, note) => {
    setReviewNotes(prev => ({ ...prev, [submissionId]: note }));
  };

  const getDraftNote = (sub) => reviewNotes[sub.id] ?? sub.reviewerNote ?? '';

  if (!bootcamp) return null;

  const filteredSubs = filter === 'all'
    ? submissions
    : submissions.filter(s => s.status === filter);

  // Group filtered submissions by student
  const groupedSubmissions = Object.values(filteredSubs.reduce((acc, sub) => {
    if (!acc[sub.studentId]) {
      acc[sub.studentId] = {
        studentId: sub.studentId,
        studentName: getStudentName(sub.studentId),
        initial: getStudentInitial(sub.studentId),
        items: []
      };
    }
    acc[sub.studentId].items.push(sub);
    return acc;
  }, {}));

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

      <div className={styles.grid} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {groupedSubmissions.length === 0 ? (
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
          groupedSubmissions.map((group, i) => (
            <motion.div
              key={group.studentId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard padding="none">
                {/* Accordion Header */}
                <div
                  onClick={() => setExpandedStudentId(prev => prev === group.studentId ? null : group.studentId)}
                  style={{ padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className={styles.studentAvatar}>{group.initial}</div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserIcon /> {group.studentName}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                      {group.items.length} Submissions
                    </span>
                    <span style={{ transform: expandedStudentId === group.studentId ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Accordion Body */}
                {expandedStudentId === group.studentId && (
                  <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    {group.items.map(sub => (
                      <div key={sub.id} style={{ padding: '16px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', marginTop: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <p style={{ margin: '0 0 4px 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {sub.subtaskId ? <SubtaskIcon /> : <TaskIcon />}
                              {sub.subtaskId ? `Subtask: ${sub.subtaskTitle || sub.subtaskId}` : getTaskName(sub.taskId)}
                            </p>
                            <span style={{ fontSize: '0.8rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <ClockIcon /> {sub.submittedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                            </span>
                          </div>
                          <span className={`badge ${sub.status === 'approved' ? 'badge-success' : sub.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                            {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                          </span>
                        </div>

                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.9rem' }}>
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

                        <SubmissionAssistantPanel
                          submission={sub}
                          maxPoints={getMaxPoints(sub)}
                          onUseFeedback={(note) => setDraftNote(sub.id, note)}
                          onUsePoints={(points) => setCustomPoints(prev => ({ ...prev, [sub.id]: points }))}
                        />

                        {sub.reviewerNote && (
                          <div className={styles.reviewNoteDisplay}>
                            <strong>Student-visible review</strong>
                            <p>{sub.reviewerNote}</p>
                          </div>
                        )}

                        {sub.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div className={styles.reviewNoteBox}>
                              <label>Review note visible to student</label>
                              <textarea
                                className="textarea"
                                value={getDraftNote(sub)}
                                onChange={(e) => setDraftNote(sub.id, e.target.value)}
                                placeholder="Add feedback, even when approving correct work."
                              />
                            </div>
                            {rejectingId === sub.id ? (
                              <div style={{ width: '100%', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <label style={{ fontSize: '0.85rem', marginBottom: '8px', display: 'block', opacity: 0.8 }}>Reason for Rejection (Visible to Student)</label>
                                <textarea
                                  className="textarea"
                                  style={{ minHeight: '60px', marginBottom: '12px' }}
                                  value={getDraftNote(sub)}
                                  onChange={(e) => setDraftNote(sub.id, e.target.value)}
                                  placeholder="e.g., Please double check your math on step 3..."
                                />
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button className="btn btn-ghost btn-sm" onClick={() => setRejectingId(null)}>Cancel</button>
                                  <button
                                    className={styles.rejectBtn}
                                    onClick={() => {
                                      handleStatusUpdate(sub, 'rejected', 0, getDraftNote(sub));
                                      setRejectingId(null);
                                    }}
                                    disabled={processingId === sub.id}
                                  >
                                    Confirm Rejection
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button
                                  className={styles.rejectBtn}
                                  onClick={() => {
                                    setRejectingId(sub.id);
                                  }}
                                  disabled={processingId === sub.id}
                                >
                                  <XIcon />
                                  <span>Reject</span>
                                </button>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px' }}>
                                  <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Points:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={getMaxPoints(sub)}
                                    value={customPoints[sub.id] !== undefined ? customPoints[sub.id] : getMaxPoints(sub)}
                                    onChange={(e) => {
                                      const val = Math.min(Math.max(0, parseInt(e.target.value) || 0), getMaxPoints(sub));
                                      setCustomPoints(prev => ({ ...prev, [sub.id]: val }));
                                    }}
                                    style={{ width: '60px', padding: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}
                                  />
                                  <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>/ {getMaxPoints(sub)}</span>
                                </div>

                                <button
                                  className={styles.approveBtn}
                                  onClick={() => {
                                    const pts = customPoints[sub.id] !== undefined ? customPoints[sub.id] : getMaxPoints(sub);
                                    handleStatusUpdate(sub, 'approved', pts, getDraftNote(sub));
                                  }}
                                  disabled={processingId === sub.id}
                                >
                                  <CheckIcon />
                                  <span>
                                    {processingId === sub.id ? 'Processing...' : `Approve`}
                                  </span>
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {sub.status !== 'pending' && (
                          <div className={styles.reviewNoteBox}>
                            <label>Send another review note to student</label>
                            <textarea
                              className="textarea"
                              value={getDraftNote(sub)}
                              onChange={(e) => setDraftNote(sub.id, e.target.value)}
                              placeholder="Add a note without changing the result."
                            />
                            <div className={styles.reviewNoteActions}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleStatusUpdate(sub, sub.status, sub.pointsAwarded || 0, getDraftNote(sub))}
                                disabled={processingId === sub.id || !getDraftNote(sub).trim()}
                              >
                                {processingId === sub.id ? 'Saving...' : 'Send Review'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
