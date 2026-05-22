// student-portal/src/app/dashboard/tasks/[taskId]/page.js
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
import { Lock, Unlock, ChevronUp, ChevronDown } from 'lucide-react';
import styles from './page.module.css';

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
  { value: 'code', label: 'Code Editor', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg> },
  { value: 'link', label: 'URL Link', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg> },
  { value: 'video', label: 'Video Submission', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg> },
  { value: 'image', label: 'Image Submission', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg> },
  { value: 'multichoice', label: 'Multiple Choice', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg> },
];

const isEmptySubmission = (content) => !content || (Array.isArray(content) && content.length === 0);

export default function StudentTaskDetailPage() {
  const { taskId } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [bootcamp, setBootcamp] = useState(null);
  const [task, setTask] = useState(null);
  const [tutorials, setTutorials] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  // Defaulted to 'link' instead of 'text'
  const [submissionType, setSubmissionType] = useState('link');
  const [submissionContent, setSubmissionContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  
  const [activeSubtask, setActiveSubtask] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [subtaskContent, setSubtaskContent] = useState('');
  const [submittingSubtask, setSubmittingSubtask] = useState(false);

  
  // New States
  const [activeTab, setActiveTab] = useState('learning'); // 'learning' or 'submission'
  const [expandedTutorials, setExpandedTutorials] = useState({});

  useEffect(() => {
    if (!user?.bootcampId) return undefined;

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

  const autoGradeMultichoice = async (subId, options, selected, points) => {
    const correctOptions = options
      .filter(opt => opt.isCorrect)
      .map(opt => opt.text);

    const selectedOpts = Array.isArray(selected) ? selected : [];
    const isCorrect = correctOptions.length > 0 &&
      correctOptions.length === selectedOpts.length &&
      correctOptions.every(val => selectedOpts.includes(val));

    if (isCorrect) {
      await reviewSubmission(user.bootcampId, subId, {
        status: 'approved',
        pointsAwarded: points || 0,
        reviewerNote: 'Auto-graded correct answer.',
      });
    } else {
      await reviewSubmission(user.bootcampId, subId, {
        status: 'rejected',
        pointsAwarded: 0,
        reviewerNote: 'Auto-graded: Incorrect answer.',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEmptySubmission(submissionContent)) return;

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
        await autoGradeMultichoice(subId, task.multichoiceOptions, submissionContent, task.points);
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
    if (!activeSubtask || isEmptySubmission(subtaskContent)) return;

    setSubmittingSubtask(true);
    try {
      const subId = await createSubmission(user.bootcampId, {
        taskId,
        studentId: user.uid,
        // Fallback to 'link'
        type: activeSubtask.submissionType || 'link',
        content: subtaskContent,
        subtaskId: activeSubtask.id,
        subtaskTitle: activeSubtask.title,
        points: activeSubtask.points || 0,
      });

      if (activeSubtask.submissionType === 'multichoice' && activeSubtask.multichoiceOptions) {
        await autoGradeMultichoice(subId, activeSubtask.multichoiceOptions, subtaskContent, activeSubtask.points);
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
const renderSubmissionField = ({ type, value, onChange, options, rows = 8 }) => {
    if (type === 'code') {
      return (
        <div className={styles.monacoWrapper}>
          <Editor
            height="300px"
            defaultLanguage="javascript"
            theme="vs-dark"
            value={value}
            onChange={(val) => onChange(val || '')}
            options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16 } }}
          />
        </div>
      );
    }

    if (type === 'link' || type === 'video' || type === 'image') {
      return (
        <div className="input-group">
          <label>Submission URL</label>
          <input
            required
            type="url"
            className="input"
            placeholder="https://..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    }

    if (type === 'multichoice') {
      return (
        <div className="input-group">
          <label>Select Answers</label>
          <div className={styles.choiceList}>
            {options?.map((opt, idx) => (
              <label key={idx} className={styles.choiceItem}>
                <input
                  type="checkbox"
                  checked={Array.isArray(value) ? value.includes(opt.text) : false}
                  onChange={(e) => {
                    const current = Array.isArray(value) ? value : [];
                    onChange(e.target.checked
                      ? [...current, opt.text]
                      : current.filter(val => val !== opt.text));
                  }}
                />
                <span>{opt.text}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="input-group">
        <label>Your Answer</label>
        <textarea
          required
          className="textarea"
          rows={rows}
          placeholder="Type your answer here..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  };

  const renderTutorialContent = (content = []) => content.map((item, index) => {
    const value = item.value || '';
    const isVideoURL = value && (
      value.includes('youtube.com') ||
      value.includes('youtu.be') ||
      value.includes('vimeo.com') ||
      value.match(/\.(mp4|webm|ogg)$/i)
    );
    const isVideo = (item.type === 'video' || item.type === 'youtube' || isVideoURL) && value;
    const isLink = item.type === 'link' && !isVideo;
    const embedUrl = isVideo ? getYouTubeEmbedUrl(value) : null;

    return (
      <div key={`${item.type}-${index}`} className={styles.tutContent}>
        {isVideo ? (
          <div className={styles.videoWrapper}>
            {value.match(/\.(mp4|webm|ogg)$/i) ? (
              <video controls src={value} />
            ) : (
              <iframe
                src={embedUrl}
                title="Tutorial video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        ) : isLink ? (
          <div className={styles.linkWrapper}>
            <a href={value} target="_blank" rel="noopener noreferrer" className={styles.clickableLink}>
              <span>Open resource</span>
            </a>
          </div>
        ) : value ? (
          <p className={styles.textContent}>{value}</p>
        ) : null}
      </div>
    );
  });

  const openSubtaskModal = (subtask) => {
    setActiveSubtask(subtask);
    setSubtaskContent(subtask.submissionType === 'multichoice' ? [] : '');
    setModalOpen(true);
  };

  if (!bootcamp || !task) return null;

  
  const mainSubmission = submissions.find(s => !s.subtaskId);
  const isMainTaskLocked = mainSubmission?.status === 'pending' || mainSubmission?.status === 'approved';
  const isMainDisabled = submitting || isEmptySubmission(submissionContent);
  const isSubDisabled = submittingSubtask || isEmptySubmission(subtaskContent);
  const submissionOptions = task.submissionTypes?.map(type => SUBMISSION_TYPE_CONFIG.find(c => c.value === type) || { value: type, label: type }) || [];

  // Calculate 80% completion gate
  const completedSubtasks = submissions.filter(s => s.subtaskId && s.status !== 'rejected').length;
  const totalSubtasks = subtasks.length;
  const completionRatio = totalSubtasks === 0 ? 1 : completedSubtasks / totalSubtasks;
  const completionPercentage = Math.round(completionRatio * 100);
  const canSubmitMainTask = completionRatio >= 0.8;


  return (
    <div className={styles.container}>
      <SocietyBackground society={bootcamp.society} customColor={bootcamp.colorTheme?.primary} />

      <div className={styles.header}>
        <button className="btn btn-ghost btn-sm mb-4" onClick={() => router.push('/dashboard/tasks')}>
          Back to Tasks
        </button>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{task.title}</h1>
          <span className="badge badge-primary">{task.points} pts</span>
        </div>
      </div>

      
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'learning' ? styles.activeTab : ''}`} 
          onClick={() => setActiveTab('learning')}
        >
          Learning Path ({completionPercentage}%)
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'submission' ? styles.activeTab : ''}`} 
          onClick={() => setActiveTab('submission')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Final Task Submission
            {canSubmitMainTask ? <Unlock size={16} /> : <Lock size={16} />}
          </div>
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'learning' && (
          <GlassCard hover={false} padding="lg" className={styles.taskShell}>
            <section className={styles.taskOverview}>
              <span className={styles.eyebrow}>Task</span>
              <h2 className={styles.sectionTitle}>Overview</h2>
              <p className={styles.description}>{task.description}</p>

              {task.guidelines && (
                <div className={styles.guidelinesBlock}>
                  <h3>Guidelines</h3>
                  <div>{task.guidelines}</div>
                </div>
              )}
            </section>

            <section className={styles.learningSection}>
              <div className={styles.learningHeader}>
                <div>
                  <span className={styles.eyebrow}>Learning path</span>
                  <h2 className={styles.sectionTitle}>Tutorials & Subtasks</h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge">{tutorials.length} tutorials</span>
                  <div style={{ fontSize: '0.8rem', marginTop: '4px', color: 'var(--color-text-secondary)' }}>
                    {completedSubtasks} / {totalSubtasks} subtasks completed
                  </div>
                </div>
              </div>

              <div className={styles.progressBarWrapper}>
                <div className={styles.progressBar} style={{ width: `${completionPercentage}%` }}></div>
              </div>

              {tutorials.length === 0 ? (
                <div className={styles.emptyPanel}>No tutorials are available for this task yet.</div>
              ) : (
                <div className={styles.tutorialList}>
                  {tutorials.map((tutorial, index) => {
                    const tutorialSubtasks = subtasks.filter(subtask => subtask.tutorialId === tutorial.id);
                    const isExpanded = expandedTutorials[tutorial.id];

                    return (
                      <article key={tutorial.id} className={`${styles.tutorialItem} ${isExpanded ? styles.expanded : ''}`}>
                        <div className={styles.tutorialHeader} onClick={() => setExpandedTutorials(prev => ({ ...prev, [tutorial.id]: !prev[tutorial.id] }))} style={{ cursor: 'pointer' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span className={styles.stepNum}>{index + 1}</span>
                            <div>
                              <h3>{tutorial.title}</h3>
                              {tutorial.description && <p>{tutorial.description}</p>}
                            </div>
                          </div>
                          <div className={styles.expandIcon}>
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className={styles.tutorialBody}>
                            {renderTutorialContent(tutorial.content)}

                            <div className={styles.subtasksPanel}>
                              <div className={styles.subtasksHeader}>
                                <h4>Subtasks in this tutorial</h4>
                                <span>{tutorialSubtasks.length}</span>
                              </div>

                              {tutorialSubtasks.length === 0 ? (
                                <p className={styles.emptySubtasks}>No subtasks attached to this tutorial.</p>
                              ) : (
                                <div className={styles.subtaskList}>
                                  {tutorialSubtasks.map((subtask) => {
                                    const subSubmission = submissions.find(s => s.subtaskId === subtask.id);
                                    const subLocked = subSubmission && subSubmission.status !== 'rejected';

                                    return (
                                      <div key={subtask.id} className={styles.subtaskItem}>
                                        <div className={styles.subtaskTop}>
                                          <div className={styles.subtaskInfo}>
                                            <span className={styles.subtaskType}>{subtask.submissionType || 'link'}</span>
                                            <div>
                                              <h5>{subtask.title}</h5>
                                              {subtask.description && <p>{subtask.description}</p>}
                                            </div>
                                          </div>
                                          <div className={styles.subtaskActions}>
                                            <span className={styles.subtaskPoints}>+{subtask.points || 0} pts</span>
                                            {subLocked ? (
                                              <span className={`badge ${subSubmission.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                                                {subSubmission.status}
                                              </span>
                                            ) : (
                                              <>
                                                {subSubmission?.status === 'rejected' && <span className="badge badge-danger">Rejected</span>}
                                                <button className="btn btn-primary btn-sm" onClick={() => openSubtaskModal(subtask)}>
                                                  {subSubmission?.status === 'rejected' ? 'Resubmit' : 'Submit'}
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </div>

                                        {subSubmission?.reviewerNote && (
                                          <div className={`${styles.subtaskNote} ${subSubmission.status === 'rejected' ? styles.noteRejected : styles.noteApproved}`}>
                                            <strong>Reviewer note</strong>
                                            <p>{subSubmission.reviewerNote}</p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </GlassCard>
        )}

        {activeTab === 'submission' && (
          <GlassCard hover={false} padding="lg" className={styles.submissionCard}>
            <h3 className={styles.sectionTitle}>Submit Final Task</h3>
            
            {!canSubmitMainTask ? (
              <div className={styles.lockedState}>
                <div className={styles.lockedIcon}>
                  <Lock size={48} strokeWidth={1.5} />
                </div>
                <h4>Submission Locked</h4>
                <p>You have completed {completionPercentage}% of the required tutorials and subtasks.</p>
                <p>You must reach at least 80% completion before you can submit the final task.</p>
                <div className={styles.progressBarWrapper} style={{ marginTop: '20px', maxWidth: '300px', margin: '20px auto' }}>
                  <div className={styles.progressBar} style={{ width: `${completionPercentage}%`, background: '#ff4757' }}></div>
                </div>
                <button className="btn btn-primary mt-4" onClick={() => setActiveTab('learning')}>
                  Return to Learning Path
                </button>
              </div>
            ) : isMainTaskLocked ? (
              <div className={styles.successState}>
                <div className={styles.successIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={mainSubmission.status === 'approved' ? '#2ecc71' : '#f1c40f'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </div>
                <h4>{mainSubmission.status === 'approved' ? 'Task Completed!' : 'Pending Review!'}</h4>
                <p>{mainSubmission.status === 'approved' ? 'Great job, you have earned the points for this task.' : 'Your work is pending review by your volunteer.'}</p>
                {['link', 'video', 'image'].includes(mainSubmission.type) && mainSubmission.content && (
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
                    <a href={mainSubmission.content} target="_blank" rel="noreferrer" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
                      color: 'white',
                      padding: '12px 28px',
                      borderRadius: '9999px',
                      textDecoration: 'none',
                      fontWeight: '600',
                      fontSize: '1rem',
                      boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                      <span>View Submission ↗</span>
                    </a>
                  </div>
                )}
                {mainSubmission.reviewerNote && (
                  <div className={styles.reviewerNote}>
                    <strong>Reviewer note</strong>
                    <p>{mainSubmission.reviewerNote}</p>
                  </div>
                )}
                <button className="btn btn-secondary mt-4" onClick={() => router.push('/dashboard/tasks')}>
                  Back to Tasks
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.submitForm}>
                {mainSubmission?.status === 'rejected' && (
                  <div className={styles.revisionPanel}>
                    <strong>Submission needs revision</strong>
                    <p>Your previous attempt was marked for revision. Use the feedback below and try again.</p>
                    {mainSubmission.reviewerNote && (
                      <div className={styles.reviewerNote}>
                        <strong>Reviewer note</strong>
                        <p>{mainSubmission.reviewerNote}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="input-group">
                  <label style={{ marginBottom: '8px', display: 'block' }}>Submission Type</label>
                  <CustomDropdown
                    value={submissionType}
                    options={submissionOptions}
                    onChange={(val) => {
                      setSubmissionType(val);
                      setSubmissionContent(val === 'multichoice' ? [] : '');
                    }}
                  />
                </div>

                <div className={styles.editorArea}>
                  {renderSubmissionField({
                    type: submissionType,
                    value: submissionContent,
                    onChange: setSubmissionContent,
                    options: task.multichoiceOptions,
                  })}
                </div>

                <button type="submit" className="btn btn-primary w-full mt-4" disabled={isMainDisabled}>
                  {submitting ? 'Submitting...' : 'Submit Final Task'}
                </button>
              </form>
            )}
          </GlassCard>
        )}
      </div>
<Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={`Submit: ${activeSubtask?.title || 'Subtask'}`}>
        <form onSubmit={handleSubtaskSubmit} className={styles.modalForm}>
          <div className={styles.editorArea}>
            {renderSubmissionField({
              // Fallback to 'link'
              type: activeSubtask?.submissionType || 'link',
              value: subtaskContent,
              onChange: setSubtaskContent,
              options: activeSubtask?.multichoiceOptions,
              rows: 6,
            })}
          </div>

          <button type="submit" className="btn btn-primary w-full mt-2" disabled={isSubDisabled}>
            {submittingSubtask ? 'Submitting...' : 'Submit Subtask'}
          </button>
        </form>
      </Modal>
    </div>
  );
}