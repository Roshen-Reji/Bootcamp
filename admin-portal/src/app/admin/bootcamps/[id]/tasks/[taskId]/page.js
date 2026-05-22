// admin-portal/src/app/admin/bootcamps/[id]/tasks/[taskId]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { getBootcamp, subscribeToTutorials, subscribeToSubtasks, createTutorial, createSubtask, deleteTask, deleteTutorial } from '@/lib/db';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import GlassCard from '@/components/ui/GlassCard';
import Modal from '@/components/ui/Modal';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { TUTORIAL_CONTENT_TYPES, SUBMISSION_TYPES } from '@/shared/constants';
import styles from './page.module.css';

export default function TaskDetailPage() {
  const { id, taskId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [bootcamp, setBootcamp] = useState(null);
  const [task, setTask] = useState(null);
  const [tutorials, setTutorials] = useState([]);
  const [subtasks, setSubtasks] = useState([]);

  // Modals state
  const [isTutorialModalOpen, setTutorialModalOpen] = useState(false);
  const [isSubtaskModalOpen, setSubtaskModalOpen] = useState(false);
  const [selectedTutorialId, setSelectedTutorialId] = useState(null);

  const [tutorialForm, setTutorialForm] = useState({ title: '', description: '', content: [{ type: 'link', value: '' }] });
  
  // Changed default submissionType to 'link'
  const [subtaskForm, setSubtaskForm] = useState({ title: '', description: '', points: 10, submissionType: 'link', multichoiceOptions: [{ text: '', isCorrect: true }] });

  useEffect(() => {
    const loadData = async () => {
      const bc = await getBootcamp(id);
      if (bc) setBootcamp(bc);

      const taskDoc = await getDoc(doc(db, 'bootcamps', id, 'tasks', taskId));
      if (taskDoc.exists()) setTask({ id: taskDoc.id, ...taskDoc.data() });
    };
    loadData();

    const unsubTuts = subscribeToTutorials(id, taskId, setTutorials);
    const unsubSub = subscribeToSubtasks(id, taskId, setSubtasks);

    return () => {
      unsubTuts();
      unsubSub();
    };
  }, [id, taskId]);

  const handleCreateTutorial = async (e) => {
    e.preventDefault();
    if (!tutorialForm.title) return;
    try {
      await createTutorial(id, taskId, {
        ...tutorialForm,
        order: tutorials.length,
        createdBy: user.uid,
      });
      setTutorialModalOpen(false);
      setTutorialForm({ title: '', description: '', content: [{ type: 'link', value: '' }] });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubtask = async (e) => {
    e.preventDefault();
    if (!subtaskForm.title || !selectedTutorialId) return;
    try {
      await createSubtask(id, taskId, {
        ...subtaskForm,
        tutorialId: selectedTutorialId,
        order: subtasks.filter(s => s.tutorialId === selectedTutorialId).length,
        createdBy: user.uid,
      });
      setSubtaskModalOpen(false);
      // Changed default back to 'link' on successful save
      setSubtaskForm({ title: '', description: '', points: 10, submissionType: 'link', multichoiceOptions: [{ text: '', isCorrect: true }] });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm('Are you sure you want to completely delete this task? This cannot be undone.')) return;
    try {
      await deleteTask(id, taskId);
      router.push(`/admin/bootcamps/${id}/tasks`);
    } catch (err) {
      console.error(err);
      alert('Failed to delete task.');
    }
  };

  const handleDeleteTutorial = async (tutorialId) => {
    if (!confirm('Are you sure you want to delete this tutorial?')) return;
    try {
      await deleteTutorial(id, taskId, tutorialId);
    } catch (err) {
      console.error(err);
      alert('Failed to delete tutorial.');
    }
  };

  if (!bootcamp || !task) return null;

  return (
    <div className={styles.container}>
      <SocietyBackground society={bootcamp.society} customColor={bootcamp.colorTheme?.primary} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.header}>
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => router.push(`/admin/bootcamps/${id}/tasks`)}>
            ← Back to Tasks
          </button>

          <div className={styles.titleRow} style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 className={styles.title}>{task.title}</h1>
              <span className="badge badge-primary">{task.level}</span>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ color: '#ff4757', border: '1px solid rgba(255,71,87,0.3)' }} onClick={handleDeleteTask}>
              🗑️ Delete Task
            </button>
          </div>

          <p className={styles.subtitle}>{task.description}</p>
        </div>

        <div className={styles.grid}>
          <div className={styles.mainContent}>
            <GlassCard hover={false} padding="lg" className="mb-6">
              <h3 className={styles.sectionTitle}>Task Details</h3>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Points</span>
                  <span className={styles.detailValue}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
                    {task.points}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Assignment</span>
                  <span className={styles.detailValue}>{task.assignmentMode}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Allowed Submissions</span>
                  <div className={styles.tags}>
                    {task.submissionTypes?.map(t => <span key={t} className="badge">{t}</span>)}
                  </div>
                </div>
              </div>
              {task.guidelines && (
                <div className={styles.guidelines}>
                  <h4>Guidelines</h4>
                  <p>{task.guidelines}</p>
                </div>
              )}
            </GlassCard>

            <div className={styles.hierarchySection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Tutorials & Subtasks</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setTutorialModalOpen(true)}>
                  + Add Tutorial
                </button>
              </div>

              {tutorials.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                  </span>
                  <p>No tutorials added yet. Tutorials are the learning material for this task.</p>
                </div>
              ) : (
                <div className={styles.tutorialsList}>
                  {tutorials.map((tut, i) => (
                    <GlassCard key={tut.id} padding="lg" hover={false} className={styles.tutorialCard}>
                      <div className={styles.tutorialHeader}>
                        <div>
                          <h4 className={styles.tutorialTitle}>
                            <span className={styles.stepNumber}>{i + 1}</span>
                            {tut.title}
                          </h4>
                          <p className={styles.tutorialDesc}>{tut.description}</p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: '#ff4757' }}
                            onClick={() => handleDeleteTutorial(tut.id)}
                          >
                            Delete
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedTutorialId(tut.id);
                              setSubtaskModalOpen(true);
                            }}
                          >
                            + Add Subtask
                          </button>
                        </div>
                      </div>

                      <div className={styles.subtasksList}>
                        {subtasks.filter(s => s.tutorialId === tut.id).map((sub, j) => (
                          <div key={sub.id} className={styles.subtaskItem}>
                            <div className={styles.subtaskMain}>
                              <span className={styles.subIcon}>
                                {sub.submissionType === 'multichoice' ? (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                                ) : sub.submissionType === 'link' ? (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                                )}
                              </span>
                              <div>
                                <h5 className={styles.subTitle}>{sub.title}</h5>
                                <span className={styles.subType}>{sub.submissionType}</span>
                              </div>
                            </div>
                            <span className={styles.subPoints}>{sub.points} pts</span>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tutorial Modal */}
      <Modal isOpen={isTutorialModalOpen} onClose={() => setTutorialModalOpen(false)} title="Add Tutorial">
        <form onSubmit={handleCreateTutorial} className="flex-col gap-md">
          <div className="input-group">
            <label>Tutorial Title</label>
            <input required className="input" value={tutorialForm.title} onChange={e => setTutorialForm({ ...tutorialForm, title: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Description</label>
            <textarea className="textarea" value={tutorialForm.description} onChange={e => setTutorialForm({ ...tutorialForm, description: e.target.value })} />
          </div>
          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px' }}>Content Type</label>
            <CustomDropdown
              value={tutorialForm.content[0].type}
              onChange={val => {
                const newContent = [...tutorialForm.content];
                newContent[0].type = val;
                setTutorialForm({ ...tutorialForm, content: newContent });
              }}
              options={Object.values(TUTORIAL_CONTENT_TYPES).map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
            />
          </div>
          <div className="input-group">
            <label>URL / Content</label>
            <input required className="input" placeholder="https://..." value={tutorialForm.content[0].value} onChange={e => {
              const newContent = [...tutorialForm.content];
              newContent[0].value = e.target.value;
              setTutorialForm({ ...tutorialForm, content: newContent });
            }} />
          </div>
          <button type="submit" className="btn btn-primary mt-4">Save Tutorial</button>
        </form>
      </Modal>

      {/* Subtask Modal */}
      <Modal isOpen={isSubtaskModalOpen} onClose={() => setSubtaskModalOpen(false)} title="Add Subtask">
        <form onSubmit={handleCreateSubtask} className="flex-col gap-md">
          <div className="input-group">
            <label>Subtask Title</label>
            <input required className="input" value={subtaskForm.title} onChange={e => setSubtaskForm({ ...subtaskForm, title: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Points</label>
            <input type="number" required className="input" value={subtaskForm.points} onChange={e => setSubtaskForm({ ...subtaskForm, points: Number(e.target.value) })} />
          </div>
          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px' }}>Submission Type</label>
            <CustomDropdown
              value={subtaskForm.submissionType}
              onChange={val => setSubtaskForm({ ...subtaskForm, submissionType: val })}
              options={Object.values(SUBMISSION_TYPES).map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
            />
          </div>
          {subtaskForm.submissionType === 'multichoice' && (
            <div className="input-group">
              <label>Options</label>
              {subtaskForm.multichoiceOptions.map((opt, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={opt.isCorrect}
                    onChange={e => {
                      const opts = [...subtaskForm.multichoiceOptions];
                      opts[idx].isCorrect = e.target.checked;
                      setSubtaskForm({ ...subtaskForm, multichoiceOptions: opts });
                    }}
                    title="Is Correct?"
                  />
                  <input
                    required
                    className="input"
                    placeholder={`Option ${idx + 1}`}
                    value={opt.text}
                    onChange={e => {
                      const opts = [...subtaskForm.multichoiceOptions];
                      opts[idx].text = e.target.value;
                      setSubtaskForm({ ...subtaskForm, multichoiceOptions: opts });
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      const opts = subtaskForm.multichoiceOptions.filter((_, i) => i !== idx);
                      setSubtaskForm({ ...subtaskForm, multichoiceOptions: opts });
                    }}
                    title="Remove Option"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSubtaskForm({
                    ...subtaskForm,
                    multichoiceOptions: [...subtaskForm.multichoiceOptions, { text: '', isCorrect: false }]
                  });
                }}
              >
                + Add Option
              </button>
            </div>
          )}
          <button type="submit" className="btn btn-primary mt-4">Save Subtask</button>
        </form>
      </Modal>
    </div>
  );
}