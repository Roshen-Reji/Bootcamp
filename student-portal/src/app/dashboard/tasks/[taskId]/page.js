'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { getBootcamp, subscribeToTutorials, subscribeToSubtasks, createSubmission, subscribeToSubmissions, reviewSubmission } from '@/lib/db';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Editor from '@monaco-editor/react';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import GlassCard from '@/components/ui/GlassCard';
import Modal from '@/components/ui/Modal';
import CustomDropdown from '@/components/ui/CustomDropdown';
import styles from './page.module.css';

// HELPER: Intercepts standard YouTube links and forces them into embeddable iframes
const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return url;
};

const SUBMISSION_TYPE_CONFIG = [
  { value: 'code', label: 'Code Editor', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg> },
  { value: 'link', label: 'URL Link', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> },
  { value: 'text', label: 'Text Response', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg> },
  { value: 'video', label: 'Video Submission', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg> },
  { value: 'image', label: 'Image Submission', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg> },
  { value: 'multichoice', label: 'Multiple Choice', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg> },
];

export default function StudentTaskDetailPage() {
  const { taskId } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [bootcamp, setBootcamp] = useState(null);
  const [task, setTask] = useState(null);
  const [tutorials, setTutorials] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [activeTab, setActiveTab] = useState('instructions');
  const [isMounted, setIsMounted] = useState(false);

  // Main Task Submission state
  const [submissionType, setSubmissionType] = useState('text');
  const [submissionContent, setSubmissionContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Subtask Submission State
  const [activeSubtask, setActiveSubtask] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [subtaskContent, setSubtaskContent] = useState('');
  const [submittingSubtask, setSubmittingSubtask] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    if (!user?.bootcampId) return;

    const loadData = async () => {
      const bc = await getBootcamp(user.bootcampId);
      if (bc) setBootcamp(bc);

      const taskDoc = await getDoc(doc(db, 'bootcamps', user.bootcampId, 'tasks', taskId));
      if (taskDoc.exists()) {
        const taskData = taskDoc.data();
        setTask({ id: taskDoc.id, ...taskData });

        if (taskData.submissionTypes && taskData.submissionTypes.length > 0) {
          const initialType = taskData.submissionTypes[0];
          setSubmissionType(initialType);
          setSubmissionContent(initialType === 'multichoice' ? [] : '');
        }
      }
    };
    loadData();

    const unsubTuts = subscribeToTutorials(user.bootcampId, taskId, setTutorials);
    const unsubSub = subscribeToSubtasks(user.bootcampId, taskId, setSubtasks);

    const unsubSubs = subscribeToSubmissions(user.bootcampId, (allSubs) => {
      setSubmissions(allSubs.filter(s => s.studentId === user.uid && s.taskId === taskId));
    });

    return () => {
      unsubTuts();
      unsubSub();
      unsubSubs();
    };
  }, [user, taskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submissionContent || (Array.isArray(submissionContent) && submissionContent.length === 0)) return;

    setSubmitting(true);
    try {
      const subId = await createSubmission(user.bootcampId, {
        taskId,
        studentId: user.uid,
        type: submissionType,
        content: submissionContent,
        points: task.points || 0,
      });

      if (submissionType === 'multichoice' && task.multichoiceOptions) {
        const correctOptions = task.multichoiceOptions
          .filter(opt => opt.isCorrect)
          .map(opt => opt.text);

        const selectedOpts = Array.isArray(submissionContent) ? submissionContent : [];

        const isCorrect = correctOptions.length > 0 &&
          correctOptions.length === selectedOpts.length &&
          correctOptions.every(val => selectedOpts.includes(val));

        if (isCorrect) {
          await reviewSubmission(user.bootcampId, subId, { status: 'approved', pointsAwarded: task.points || 0 });
        } else {
          await reviewSubmission(user.bootcampId, subId, { status: 'rejected', pointsAwarded: 0, reviewerNote: "Auto-graded: Incorrect answer." });
        }
      }

    } catch (err) {
      console.error(err);
      alert('Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubtaskSubmit = async (e) => {
    e.preventDefault();
    if (!subtaskContent || !activeSubtask) return;
    if (Array.isArray(subtaskContent) && subtaskContent.length === 0) return;

    setSubmittingSubtask(true);
    try {
      const subId = await createSubmission(user.bootcampId, {
        taskId,
        studentId: user.uid,
        type: activeSubtask.submissionType || 'text',
        content: subtaskContent,
        subtaskId: activeSubtask.id,
        subtaskTitle: activeSubtask.title,
        points: activeSubtask.points || 0
      });

      if (activeSubtask.submissionType === 'multichoice' && activeSubtask.multichoiceOptions) {
        const correctOptions = activeSubtask.multichoiceOptions
          .filter(opt => opt.isCorrect)
          .map(opt => opt.text);

        const selectedOpts = Array.isArray(subtaskContent) ? subtaskContent : [];

        const isCorrect = correctOptions.length > 0 &&
          correctOptions.length === selectedOpts.length &&
          correctOptions.every(val => selectedOpts.includes(val));

        if (isCorrect) {
          await reviewSubmission(user.bootcampId, subId, { status: 'approved', pointsAwarded: activeSubtask.points || 0 });
        } else {
          await reviewSubmission(user.bootcampId, subId, { status: 'rejected', pointsAwarded: 0, reviewerNote: "Auto-graded: Incorrect answer." });
        }
      }

      setModalOpen(false);
      setActiveSubtask(null);
      setSubtaskContent('');
    } catch (err) {
      console.error(err);
      alert('Failed to submit subtask');
    } finally {
      setSubmittingSubtask(false);
    }
  };

  if (!bootcamp || !task) return null;

  const mainSubmission = submissions.find(s => !s.subtaskId);
  const isMainTaskLocked = mainSubmission?.status === 'pending' || mainSubmission?.status === 'approved';

  const isMainDisabled = submitting || !submissionContent || (Array.isArray(submissionContent) && submissionContent.length === 0);
  const isSubDisabled = submittingSubtask || !subtaskContent || (Array.isArray(subtaskContent) && subtaskContent.length === 0);

  return (
    <div className={styles.container}>
      <SocietyBackground society={bootcamp.society} customColor={bootcamp.colorTheme?.primary} />

      <div className={styles.header}>
        <button className="btn btn-ghost btn-sm mb-4" onClick={() => router.push('/dashboard/tasks')}>
          ← Back to Tasks
        </button>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{task.title}</h1>
          <span className="badge badge-primary">{task.points} pts</span>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.mainCol}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'instructions' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('instructions')}
            >
              Instructions
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'tutorials' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('tutorials')}
            >
              Tutorials ({tutorials.length})
            </button>
          </div>

          <GlassCard hover={false} padding="lg">
            {activeTab === 'instructions' && (
              <div className={styles.contentArea}>
                <h3 className={styles.sectionTitle}>Task Overview</h3>
                <p className={styles.description}>{task.description}</p>

                {task.guidelines && (
                  <>
                    <h3 className={styles.sectionTitle}>Guidelines</h3>
                    <div className={styles.guidelines}>{task.guidelines}</div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'tutorials' && (
              <div className={styles.contentArea}>
                {tutorials.length === 0 ? (
                  <p className="text-secondary">No tutorials available for this task.</p>
                ) : (
                  <div className={styles.tutorialList}>
                    {tutorials.map((tut, i) => {
                      const tutSubtasks = subtasks.filter(s => s.tutorialId === tut.id);

                      return (
                        <div key={tut.id} className={styles.tutorialItem}>
                          <h4>
                            <span className={styles.stepNum}>{i + 1}</span>
                            {tut.title}
                          </h4>
                          <p>{tut.description}</p>
                          {tut.content?.map((c, j) => {
                            const isVideoURL = c.value && (
                              c.value.includes('youtube.com') ||
                              c.value.includes('youtu.be') ||
                              c.value.includes('vimeo.com') ||
                              c.value.match(/\.(mp4|webm|ogg)$/i)
                            );

                            const isVideo = (c.type === 'video' || c.type === 'youtube' || isVideoURL) && c.value;
                            const isLink = c.type === 'link' && !isVideo;
                            const embedUrl = isVideo ? getYouTubeEmbedUrl(c.value) : null;

                            return (
                              <div key={j} className={styles.tutContent}>
                                {isVideo && isMounted ? (
                                  <div
                                    className={styles.videoWrapper}
                                    style={{
                                      position: 'relative',
                                      paddingBottom: '56.25%',
                                      height: 0,
                                      overflow: 'hidden',
                                      borderRadius: '8px',
                                      backgroundColor: '#000',
                                      marginBottom: '16px',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                  >
                                    {c.value.match(/\.(mp4|webm|ogg)$/i) ? (
                                      <video
                                        controls
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '8px' }}
                                        src={c.value}
                                      />
                                    ) : (
                                      <iframe
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0, borderRadius: '8px' }}
                                        src={embedUrl}
                                        title="Tutorial Video"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      />
                                    )}
                                  </div>
                                ) : isLink ? (
                                  <div className={styles.linkWrapper}>
                                    <a href={c.value} target="_blank" rel="noopener noreferrer" className={styles.clickableLink}>
                                      <span className={styles.linkIcon}>🔗</span>
                                      {c.value}
                                    </a>
                                  </div>
                                ) : c.value ? (
                                  <p className={styles.textContent}>{c.value}</p>
                                ) : null}
                              </div>
                            );
                          })}

                          {tutSubtasks.length > 0 && (
                            <div className={styles.attachedSubtasks} style={{ marginTop: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <h5 style={{ fontSize: '0.9rem', color: '#a0a0a0', marginBottom: '12px', fontWeight: 600 }}>Required Subtasks for this step:</h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {tutSubtasks.map((sub) => {
                                  const subSubmission = submissions.find(s => s.subtaskId === sub.id);

                                  return (
                                    <div key={sub.id} style={{ display: 'flex', flexDirection: 'column', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', padding: '2px 6px', background: 'rgba(108, 99, 255, 0.2)', color: 'var(--color-primary)', borderRadius: '4px', fontWeight: 700 }}>
                                            {sub.submissionType}
                                          </span>
                                          <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{sub.title}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                          <span style={{ fontWeight: 700, color: '#ffa502', fontSize: '0.9rem' }}>+{sub.points} pts</span>

                                          {subSubmission && subSubmission.status !== 'rejected' ? (
                                            <span className={`badge ${subSubmission.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                                              {subSubmission.status.charAt(0).toUpperCase() + subSubmission.status.slice(1)}
                                            </span>
                                          ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              {subSubmission?.status === 'rejected' && (
                                                <span className="badge badge-danger">Rejected</span>
                                              )}
                                              <button
                                                className="btn btn-primary"
                                                style={{ padding: '6px 16px', fontSize: '0.8rem', height: 'auto' }}
                                                onClick={() => {
                                                  setActiveSubtask(sub);
                                                  setSubtaskContent(sub.submissionType === 'multichoice' ? [] : '');
                                                  setModalOpen(true);
                                                }}
                                              >
                                                {subSubmission?.status === 'rejected' ? 'Resubmit' : 'Submit'}
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {subSubmission?.status === 'rejected' && subSubmission?.reviewerNote && (
                                        <div style={{ marginTop: '16px', background: 'rgba(255, 71, 87, 0.03)', border: '1px solid rgba(255, 71, 87, 0.2)', borderRadius: '8px', overflow: 'hidden' }}>
                                          <div style={{ background: 'rgba(255, 71, 87, 0.1)', padding: '8px 12px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ff4757', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                            Feedback on your subtask
                                          </div>
                                          <div style={{ padding: '12px', borderLeft: '3px solid #ff4757' }}>
                                            <p style={{ margin: 0, fontSize: '0.95rem', color: '#f1f5f9', fontStyle: 'italic' }}>"{subSubmission.reviewerNote}"</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </div>

        <div className={styles.sideCol}>
          <GlassCard hover={false} padding="lg" className={styles.submissionCard}>
            <h3 className={styles.sectionTitle}>Submit Final Task</h3>

            {isMainTaskLocked ? (
              <div className={styles.successState}>
                <div className={styles.successIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={mainSubmission.status === 'approved' ? "#2ecc71" : "#f1c40f"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <h4>{mainSubmission.status === 'approved' ? 'Task Completed!' : 'Pending Review!'}</h4>
                <p>{mainSubmission.status === 'approved' ? 'Great job, you have earned the points for this task.' : 'Your work is pending review by your volunteer.'}</p>
                <button className="btn btn-secondary mt-4" onClick={() => router.push('/dashboard/tasks')}>
                  Back to Tasks
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.submitForm}>

                {mainSubmission?.status === 'rejected' && (
                  <div style={{ marginBottom: '24px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255, 71, 87, 0.3)', boxShadow: '0 4px 12px rgba(255, 71, 87, 0.1)' }}>
                    <div style={{ background: 'rgba(255, 71, 87, 0.15)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4757', fontWeight: 600 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                      Submission Needs Revision
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(0, 0, 0, 0.2)' }}>
                      <p style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: '#e2e8f0' }}>Your previous attempt was reviewed and marked as incorrect. Please review the feedback below and try again.</p>
                      {mainSubmission.reviewerNote && (
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderLeft: '3px solid #ff4757', padding: '16px', borderRadius: '0 6px 6px 0' }}>
                          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ff4757', marginBottom: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            Note from your Reviewer
                          </div>
                          <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.5', color: '#fff', fontStyle: 'italic' }}>"{mainSubmission.reviewerNote}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="input-group">
                  <label style={{ marginBottom: '8px', display: 'block' }}>Submission Type</label>
                  <CustomDropdown
                    value={submissionType}
                    options={task.submissionTypes?.map(type => SUBMISSION_TYPE_CONFIG.find(c => c.value === type) || { value: type, label: type }) || []}
                    onChange={(val) => {
                      setSubmissionType(val);
                      setSubmissionContent(val === 'multichoice' ? [] : '');
                    }}
                  />
                </div>

                <div className={styles.editorArea}>
                  {submissionType === 'code' ? (
                    <div className={styles.monacoWrapper}>
                      <Editor
                        height="300px"
                        defaultLanguage="javascript"
                        theme="vs-dark"
                        value={submissionContent}
                        onChange={(val) => setSubmissionContent(val)}
                        options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16 } }}
                      />
                    </div>
                  ) : submissionType === 'link' || submissionType === 'video' || submissionType === 'image' ? (
                    <div className="input-group">
                      <label>URL Link</label>
                      <input
                        required
                        type="url"
                        className="input"
                        placeholder="https://..."
                        value={submissionContent}
                        onChange={(e) => setSubmissionContent(e.target.value)}
                      />
                    </div>
                  ) : submissionType === 'multichoice' ? (
                    <div className="input-group">
                      <label>Select Answers</label>
                      {task.multichoiceOptions?.map((opt, idx) => (
                        <label key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            checked={Array.isArray(submissionContent) ? submissionContent.includes(opt.text) : false}
                            onChange={(e) => {
                              const current = Array.isArray(submissionContent) ? submissionContent : [];
                              if (e.target.checked) {
                                setSubmissionContent([...current, opt.text]);
                              } else {
                                setSubmissionContent(current.filter(val => val !== opt.text));
                              }
                            }}
                          />
                          <span>{opt.text}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="input-group">
                      <label>Your Answer</label>
                      <textarea
                        required
                        className="textarea"
                        rows={8}
                        placeholder="Type your answer here..."
                        value={submissionContent}
                        onChange={(e) => setSubmissionContent(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full mt-4"
                  disabled={isMainDisabled}
                >
                  {submitting ? 'Submitting...' : 'Submit Final Task'}
                </button>
              </form>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Subtask Submission Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={`Submit: ${activeSubtask?.title || 'Subtask'}`}>
        <form onSubmit={handleSubtaskSubmit} className="flex-col gap-md" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div className={styles.editorArea}>
            {activeSubtask?.submissionType === 'code' ? (
              <div className={styles.monacoWrapper}>
                <Editor
                  height="300px"
                  defaultLanguage="javascript"
                  theme="vs-dark"
                  value={subtaskContent}
                  onChange={(val) => setSubtaskContent(val)}
                  options={{ minimap: { enabled: false }, fontSize: 14 }}
                />
              </div>
            ) : activeSubtask?.submissionType === 'link' || activeSubtask?.submissionType === 'video' || activeSubtask?.submissionType === 'image' ? (
              <div className="input-group">
                <label>Submission URL</label>
                <input
                  required
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={subtaskContent}
                  onChange={(e) => setSubtaskContent(e.target.value)}
                />
              </div>
            ) : activeSubtask?.submissionType === 'multichoice' ? (
              <div className="input-group">
                <label>Select Answers</label>
                {activeSubtask.multichoiceOptions?.map((opt, idx) => (
                  <label key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={Array.isArray(subtaskContent) ? subtaskContent.includes(opt.text) : false}
                      onChange={(e) => {
                        const current = Array.isArray(subtaskContent) ? subtaskContent : [];
                        if (e.target.checked) {
                          setSubtaskContent([...current, opt.text]);
                        } else {
                          setSubtaskContent(current.filter(val => val !== opt.text));
                        }
                      }}
                    />
                    <span>{opt.text}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="input-group">
                <label>Your Answer</label>
                <textarea
                  required
                  className="textarea"
                  rows={6}
                  placeholder="Type your answer here..."
                  value={subtaskContent}
                  onChange={(e) => setSubtaskContent(e.target.value)}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full mt-2"
            disabled={isSubDisabled}
          >
            {submittingSubtask ? 'Submitting...' : 'Submit Subtask'}
          </button>
        </form>
      </Modal>

    </div>
  );
}