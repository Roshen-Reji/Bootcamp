// admin-portal/src/app/admin/bootcamps/[id]/tasks/[taskId]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  getBootcamp, subscribeToTutorials, subscribeToSubtasks,
  createTutorial, createSubtask, deleteTask, deleteTutorial,
  updateTask, updateTutorial, updateSubtask, deleteSubtask
} from '@/lib/db';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import GlassCard from '@/components/ui/GlassCard';
import Modal from '@/components/ui/Modal';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { TUTORIAL_CONTENT_TYPES, SUBMISSION_TYPES, TASK_LEVELS, ASSIGNMENT_MODES } from '@/shared/constants';
import { validateTutorialLink } from '@/lib/linkValidator';
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

  // Link validation warning
  const [linkWarning, setLinkWarning] = useState(null); // { message, onBypass }

  // Edit states
  const [isEditTaskModalOpen, setEditTaskModalOpen] = useState(false);
  const [isEditTutorialModalOpen, setEditTutorialModalOpen] = useState(false);
  const [isEditSubtaskModalOpen, setEditSubtaskModalOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState(null);
  const [editingSubtask, setEditingSubtask] = useState(null);

  const [tutorialForm, setTutorialForm] = useState({ title: '', description: '', content: [{ type: 'link', value: '' }] });
  
  const [subtaskForm, setSubtaskForm] = useState({ title: '', description: '', points: 10, submissionType: 'link', multichoiceOptions: [{ text: '', isCorrect: true }] });

  // Edit task form
  const [editTaskForm, setEditTaskForm] = useState({
    title: '', description: '', level: 'beginner', points: 100,
    guidelines: '', deadline: '', submissionTypes: ['text'], assignmentMode: 'random'
  });

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

  // --- Tutorial CRUD ---

  const handleCreateTutorial = async (e) => {
    e.preventDefault();
    if (!tutorialForm.title) return;

    // Validate tutorial link
    const contentType = tutorialForm.content[0].type;
    const contentUrl = tutorialForm.content[0].value;
    const validation = validateTutorialLink(contentType, contentUrl);

    if (!validation.valid) {
      setLinkWarning({
        message: validation.message,
        onBypass: async () => {
          setLinkWarning(null);
          await saveTutorial();
        }
      });
      return;
    }

    await saveTutorial();
  };

  const saveTutorial = async () => {
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

  const handleEditTutorial = (tut) => {
    setEditingTutorial(tut);
    setTutorialForm({
      title: tut.title || '',
      description: tut.description || '',
      content: tut.content || [{ type: 'link', value: '' }],
    });
    setEditTutorialModalOpen(true);
  };

  const handleUpdateTutorial = async (e) => {
    e.preventDefault();
    if (!editingTutorial || !tutorialForm.title) return;

    // Validate link
    const contentType = tutorialForm.content[0].type;
    const contentUrl = tutorialForm.content[0].value;
    const validation = validateTutorialLink(contentType, contentUrl);

    if (!validation.valid) {
      setLinkWarning({
        message: validation.message,
        onBypass: async () => {
          setLinkWarning(null);
          await saveEditTutorial();
        }
      });
      return;
    }

    await saveEditTutorial();
  };

  const saveEditTutorial = async () => {
    try {
      await updateTutorial(id, taskId, editingTutorial.id, {
        title: tutorialForm.title,
        description: tutorialForm.description,
        content: tutorialForm.content,
      });
      setEditTutorialModalOpen(false);
      setEditingTutorial(null);
      setTutorialForm({ title: '', description: '', content: [{ type: 'link', value: '' }] });
    } catch (err) {
      console.error(err);
      alert('Failed to update tutorial.');
    }
  };

  const handleDeleteTutorial = async (tutorialId) => {
    if (!confirm('Are you sure you want to delete this tutorial and its subtasks?')) return;
    try {
      // Delete associated subtasks first
      const relatedSubtasks = subtasks.filter(s => s.tutorialId === tutorialId);
      for (const sub of relatedSubtasks) {
        await deleteSubtask(id, taskId, sub.id);
      }
      await deleteTutorial(id, taskId, tutorialId);
    } catch (err) {
      console.error(err);
      alert('Failed to delete tutorial.');
    }
  };

  // --- Subtask CRUD ---

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
      setSubtaskForm({ title: '', description: '', points: 10, submissionType: 'link', multichoiceOptions: [{ text: '', isCorrect: true }] });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSubtask = (sub) => {
    setEditingSubtask(sub);
    setSubtaskForm({
      title: sub.title || '',
      description: sub.description || '',
      points: sub.points || 10,
      submissionType: sub.submissionType || 'link',
      multichoiceOptions: sub.multichoiceOptions || [{ text: '', isCorrect: true }],
    });
    setEditSubtaskModalOpen(true);
  };

  const handleUpdateSubtask = async (e) => {
    e.preventDefault();
    if (!editingSubtask || !subtaskForm.title) return;
    try {
      await updateSubtask(id, taskId, editingSubtask.id, {
        title: subtaskForm.title,
        description: subtaskForm.description,
        points: subtaskForm.points,
        submissionType: subtaskForm.submissionType,
        ...(subtaskForm.submissionType === 'multichoice' ? { multichoiceOptions: subtaskForm.multichoiceOptions } : {}),
      });
      setEditSubtaskModalOpen(false);
      setEditingSubtask(null);
      setSubtaskForm({ title: '', description: '', points: 10, submissionType: 'link', multichoiceOptions: [{ text: '', isCorrect: true }] });
    } catch (err) {
      console.error(err);
      alert('Failed to update subtask.');
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!confirm('Are you sure you want to delete this subtask?')) return;
    try {
      await deleteSubtask(id, taskId, subtaskId);
    } catch (err) {
      console.error(err);
      alert('Failed to delete subtask.');
    }
  };

  // --- Task CRUD ---

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

  const openEditTaskModal = () => {
    setEditTaskForm({
      title: task.title || '',
      description: task.description || '',
      level: task.level || 'beginner',
      points: task.points || 100,
      guidelines: task.guidelines || '',
      deadline: task.deadline || '',
      submissionTypes: task.submissionTypes || ['text'],
      assignmentMode: task.assignmentMode || 'random',
    });
    setEditTaskModalOpen(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editTaskForm.title || editTaskForm.submissionTypes.length === 0) return;
    try {
      await updateTask(id, taskId, editTaskForm);
      setTask({ ...task, ...editTaskForm });
      setEditTaskModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update task.');
    }
  };

  const toggleEditSubmissionType = (type) => {
    setEditTaskForm(prev => {
      const types = [...prev.submissionTypes];
      if (types.includes(type)) {
        return { ...prev, submissionTypes: types.filter(t => t !== type) };
      }
      return { ...prev, submissionTypes: [...types, type] };
    });
  };

  if (!bootcamp || !task) return null;

  // --- Render helpers ---
  const renderSubtaskForm = (formData, setFormData, isEdit = false) => (
    <>
      <div className="input-group">
        <label>Subtask Title</label>
        <input required className="input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
      </div>
      <div className="input-group">
        <label>Points</label>
        <input type="number" required className="input" value={formData.points} onChange={e => setFormData({ ...formData, points: Number(e.target.value) })} />
      </div>
      <div className="input-group">
        <label style={{ display: 'block', marginBottom: '8px' }}>Submission Type</label>
        <CustomDropdown
          value={formData.submissionType}
          onChange={val => setFormData({ ...formData, submissionType: val })}
          options={Object.values(SUBMISSION_TYPES).map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
        />
      </div>
      {formData.submissionType === 'multichoice' && (
        <div className="input-group">
          <label>Options</label>
          {formData.multichoiceOptions.map((opt, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={opt.isCorrect}
                onChange={e => {
                  const opts = [...formData.multichoiceOptions];
                  opts[idx].isCorrect = e.target.checked;
                  setFormData({ ...formData, multichoiceOptions: opts });
                }}
                title="Is Correct?"
              />
              <input
                required
                className="input"
                placeholder={`Option ${idx + 1}`}
                value={opt.text}
                onChange={e => {
                  const opts = [...formData.multichoiceOptions];
                  opts[idx].text = e.target.value;
                  setFormData({ ...formData, multichoiceOptions: opts });
                }}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  const opts = formData.multichoiceOptions.filter((_, i) => i !== idx);
                  setFormData({ ...formData, multichoiceOptions: opts });
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
              setFormData({
                ...formData,
                multichoiceOptions: [...formData.multichoiceOptions, { text: '', isCorrect: false }]
              });
            }}
          >
            + Add Option
          </button>
        </div>
      )}
    </>
  );

  const renderTutorialForm = (formData, setFormData) => (
    <>
      <div className="input-group">
        <label>Tutorial Title</label>
        <input required className="input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
      </div>
      <div className="input-group">
        <label>Description</label>
        <textarea className="textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
      </div>
      <div className="input-group">
        <label style={{ display: 'block', marginBottom: '8px' }}>Content Type</label>
        <CustomDropdown
          value={formData.content[0].type}
          onChange={val => {
            const newContent = [...formData.content];
            newContent[0].type = val;
            setFormData({ ...formData, content: newContent });
          }}
          options={Object.values(TUTORIAL_CONTENT_TYPES).map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
        />
      </div>
      <div className="input-group">
        <label>URL / Content</label>
        <input required className="input" placeholder="https://..." value={formData.content[0].value} onChange={e => {
          const newContent = [...formData.content];
          newContent[0].value = e.target.value;
          setFormData({ ...formData, content: newContent });
        }} />
      </div>
    </>
  );

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
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={openEditTaskModal}>
                ✏️ Edit Task
              </button>
              <button className="btn btn-ghost btn-sm" style={{ color: '#ff4757', border: '1px solid rgba(255,71,87,0.3)' }} onClick={handleDeleteTask}>
                🗑️ Delete Task
              </button>
            </div>
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
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Deadline</span>
                  <span className={styles.detailValue}>
                    {task.deadline ? new Date(task.deadline).toLocaleString() : 'No Deadline'}
                  </span>
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
                            style={{ color: 'var(--color-primary)' }}
                            onClick={() => handleEditTutorial(tut)}
                          >
                            ✏️ Edit
                          </button>
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
                              setSubtaskForm({ title: '', description: '', points: 10, submissionType: 'link', multichoiceOptions: [{ text: '', isCorrect: true }] });
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className={styles.subPoints}>{sub.points} pts</span>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '4px', color: 'var(--color-primary)' }}
                                onClick={() => handleEditSubtask(sub)}
                                title="Edit Subtask"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '4px', color: '#ff4757' }}
                                onClick={() => handleDeleteSubtask(sub.id)}
                                title="Delete Subtask"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </button>
                            </div>
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

      {/* Tutorial Modal - Create */}
      <Modal isOpen={isTutorialModalOpen} onClose={() => setTutorialModalOpen(false)} title="Add Tutorial">
        <form onSubmit={handleCreateTutorial} className="flex-col gap-md">
          {renderTutorialForm(tutorialForm, setTutorialForm)}
          <button type="submit" className="btn btn-primary mt-4">Save Tutorial</button>
        </form>
      </Modal>

      {/* Tutorial Modal - Edit */}
      <Modal isOpen={isEditTutorialModalOpen} onClose={() => { setEditTutorialModalOpen(false); setEditingTutorial(null); }} title="Edit Tutorial">
        <form onSubmit={handleUpdateTutorial} className="flex-col gap-md">
          {renderTutorialForm(tutorialForm, setTutorialForm)}
          <button type="submit" className="btn btn-primary mt-4">Update Tutorial</button>
        </form>
      </Modal>

      {/* Subtask Modal - Create */}
      <Modal isOpen={isSubtaskModalOpen} onClose={() => setSubtaskModalOpen(false)} title="Add Subtask">
        <form onSubmit={handleCreateSubtask} className="flex-col gap-md">
          {renderSubtaskForm(subtaskForm, setSubtaskForm)}
          <button type="submit" className="btn btn-primary mt-4">Save Subtask</button>
        </form>
      </Modal>

      {/* Subtask Modal - Edit */}
      <Modal isOpen={isEditSubtaskModalOpen} onClose={() => { setEditSubtaskModalOpen(false); setEditingSubtask(null); }} title="Edit Subtask">
        <form onSubmit={handleUpdateSubtask} className="flex-col gap-md">
          {renderSubtaskForm(subtaskForm, setSubtaskForm, true)}
          <button type="submit" className="btn btn-primary mt-4">Update Subtask</button>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal isOpen={isEditTaskModalOpen} onClose={() => setEditTaskModalOpen(false)} title="Edit Task">
        <form onSubmit={handleUpdateTask} className="flex-col gap-md">
          <div className="input-group">
            <label>Task Title *</label>
            <input required className="input" value={editTaskForm.title} onChange={e => setEditTaskForm({ ...editTaskForm, title: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Description *</label>
            <textarea required className="textarea" value={editTaskForm.description} onChange={e => setEditTaskForm({ ...editTaskForm, description: e.target.value })} rows={3} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px' }}>Difficulty Level</label>
              <CustomDropdown
                value={editTaskForm.level}
                onChange={val => setEditTaskForm({ ...editTaskForm, level: val })}
                options={[
                  { value: TASK_LEVELS.BEGINNER, label: 'Beginner' },
                  { value: TASK_LEVELS.INTERMEDIATE, label: 'Intermediate' },
                  { value: TASK_LEVELS.ADVANCED, label: 'Advanced' }
                ]}
              />
            </div>
            <div className="input-group">
              <label>Points</label>
              <input type="number" min="0" className="input" value={editTaskForm.points} onChange={e => setEditTaskForm({ ...editTaskForm, points: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="input-group">
            <label>Guidelines</label>
            <textarea className="textarea" value={editTaskForm.guidelines} onChange={e => setEditTaskForm({ ...editTaskForm, guidelines: e.target.value })} rows={3} />
          </div>
          <div className="input-group">
            <label>Deadline</label>
            <input type="datetime-local" className="input" value={editTaskForm.deadline} onChange={e => setEditTaskForm({ ...editTaskForm, deadline: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px' }}>Assignment Mode</label>
              <CustomDropdown
                value={editTaskForm.assignmentMode}
                onChange={val => setEditTaskForm({ ...editTaskForm, assignmentMode: val })}
                options={[
                  { value: ASSIGNMENT_MODES.RANDOM, label: 'Randomly Assigned' },
                  { value: ASSIGNMENT_MODES.MANUAL, label: 'Manually Assigned' }
                ]}
              />
            </div>
          </div>
          <div className="input-group">
            <label>Allowed Submission Types *</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Object.values(SUBMISSION_TYPES).filter(t => t !== 'multichoice').map(type => (
                <label key={type} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                  borderRadius: '8px', cursor: 'pointer',
                  background: editTaskForm.submissionTypes.includes(type) ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                  color: editTaskForm.submissionTypes.includes(type) ? '#fff' : 'var(--color-text-secondary)',
                  border: `1px solid ${editTaskForm.submissionTypes.includes(type) ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'}`,
                  transition: 'all 0.2s ease',
                }}>
                  <input
                    type="checkbox"
                    checked={editTaskForm.submissionTypes.includes(type)}
                    onChange={() => toggleEditSubmissionType(type)}
                    style={{ display: 'none' }}
                  />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary mt-4" disabled={!editTaskForm.title || editTaskForm.submissionTypes.length === 0}>
            Update Task
          </button>
        </form>
      </Modal>

      {/* Link Warning Modal */}
      <Modal isOpen={!!linkWarning} onClose={() => setLinkWarning(null)} title="⚠️ Link Mismatch Warning">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            {linkWarning?.message}
          </p>
          <div style={{
            padding: '12px 16px', borderRadius: '8px',
            background: 'rgba(255, 165, 2, 0.1)', border: '1px solid rgba(255, 165, 2, 0.3)',
            color: '#ffa502', fontSize: '0.9rem'
          }}>
            You can bypass this check if you're sure the link is correct.
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setLinkWarning(null)}>
              Cancel — Fix Link
            </button>
            <button
              className="btn btn-secondary"
              style={{ borderColor: '#ffa502', color: '#ffa502' }}
              onClick={linkWarning?.onBypass}
            >
              Bypass & Save Anyway
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}