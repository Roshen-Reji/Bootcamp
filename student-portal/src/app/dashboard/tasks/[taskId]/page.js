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

      // AUTO-GRADING LOGIC FOR MAIN TASK
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
          await reviewSubmission(user.bootcampId, subId, { status: 'rejected', pointsAwarded: 0 });
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

      // AUTO-GRADING LOGIC FOR SUBTASKS
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
          await reviewSubmission(user.bootcampId, subId, { status: 'rejected', pointsAwarded: 0 });
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
                                      paddingBottom: '56.25%', // Mathematically forces a 16:9 Aspect Ratio
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

                          {/* Attached Subtasks */}
                          {tutSubtasks.length > 0 && (
                            <div className={styles.attachedSubtasks} style={{ marginTop: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <h5 style={{ fontSize: '0.9rem', color: '#a0a0a0', marginBottom: '12px', fontWeight: 600 }}>Required Subtasks for this step:</h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {tutSubtasks.map((sub) => {
                                  const subSubmission = submissions.find(s => s.subtaskId === sub.id);

                                  return (
                                    <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', padding: '2px 6px', background: 'rgba(108, 99, 255, 0.2)', color: 'var(--color-primary)', borderRadius: '4px', fontWeight: 700 }}>
                                          {sub.submissionType}
                                        </span>
                                        <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{sub.title}</span>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <span style={{ fontWeight: 700, color: '#ffa502', fontSize: '0.9rem' }}>+{sub.points} pts</span>

                                        {subSubmission ? (
                                          <span className={`badge ${subSubmission.status === 'approved' ? 'badge-success' :
                                            subSubmission.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                                            }`}>
                                            {subSubmission.status.charAt(0).toUpperCase() + subSubmission.status.slice(1)}
                                          </span>
                                        ) : (
                                          <button
                                            className="btn btn-primary"
                                            style={{ padding: '6px 16px', fontSize: '0.8rem', height: 'auto' }}
                                            onClick={() => {
                                              setActiveSubtask(sub);
                                              setSubtaskContent(sub.submissionType === 'multichoice' ? [] : '');
                                              setModalOpen(true);
                                            }}
                                          >
                                            Submit
                                          </button>
                                        )}
                                      </div>
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
                  <div style={{ padding: '12px', background: 'rgba(255, 71, 87, 0.1)', border: '1px solid #ff4757', color: '#ff4757', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
                    <strong>Note:</strong> Your previous submission was incorrect/rejected. Please try again.
                  </div>
                )}

                <div className="input-group">
                  <label>Submission Type</label>
                  <select
                    className="select"
                    value={submissionType}
                    onChange={(e) => {
                      setSubmissionType(e.target.value);
                      setSubmissionContent(e.target.value === 'multichoice' ? [] : '');
                    }}
                  >
                    {task.submissionTypes?.map(type => (
                      <option key={type} value={type}>
                        {type === 'code' ? 'Code Editor' :
                          type === 'link' ? 'URL Link' :
                            type === 'text' ? 'Text Response' :
                              type === 'video' ? 'Video Submission' :
                                type === 'image' ? 'Image Submission' :
                                  type === 'multichoice' ? 'Multiple Choice' :
                                    type}
                      </option>
                    ))}
                  </select>
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