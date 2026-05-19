'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { getBootcamp, createTask } from '@/lib/db';
import { TASK_LEVELS, SUBMISSION_TYPES, ASSIGNMENT_MODES } from '@/shared/constants';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import GlassCard from '@/components/ui/GlassCard';
import styles from './page.module.css';

export default function CreateTaskPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [bootcamp, setBootcamp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    level: TASK_LEVELS.BEGINNER,
    points: 100,
    guidelines: '',
    submissionTypes: ['text'],
    assignmentMode: ASSIGNMENT_MODES.RANDOM,
  });

  useEffect(() => {
    const loadBc = async () => {
      const bc = await getBootcamp(id);
      if (bc) setBootcamp(bc);
    };
    loadBc();
  }, [id]);

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleSubmissionType = (type) => {
    setForm(prev => {
      const types = [...prev.submissionTypes];
      if (types.includes(type)) {
        return { ...prev, submissionTypes: types.filter(t => t !== type) };
      }
      return { ...prev, submissionTypes: [...types, type] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || form.submissionTypes.length === 0) return;
    
    setLoading(true);
    try {
      await createTask(id, {
        ...form,
        createdBy: user.uid,
      });
      router.push(`/admin/bootcamps/${id}/tasks`);
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  if (!bootcamp) return null;

  return (
    <div className={styles.container}>
      <SocietyBackground society={bootcamp.society} customColor={bootcamp.colorTheme?.primary} />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.header}>
          <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>
            ← Back to Tasks
          </button>
          <h1 className={styles.title}>Create Core Task</h1>
          <p className={styles.subtitle}>Add a new main task for {bootcamp.name}</p>
        </div>

        <GlassCard hover={false} padding="xl">
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.grid2}>
              <div className="input-group">
                <label>Task Title *</label>
                <input
                  required
                  className="input"
                  placeholder="e.g., Build a Portfolio Website"
                  value={form.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Difficulty Level</label>
                <select
                  className="select"
                  value={form.level}
                  onChange={(e) => updateForm('level', e.target.value)}
                >
                  <option value={TASK_LEVELS.BEGINNER}>Beginner</option>
                  <option value={TASK_LEVELS.INTERMEDIATE}>Intermediate</option>
                  <option value={TASK_LEVELS.ADVANCED}>Advanced</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Description *</label>
              <textarea
                required
                className="textarea"
                placeholder="What is this task about?"
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="input-group">
              <label>Guidelines / Instructions</label>
              <textarea
                className="textarea"
                placeholder="Step-by-step instructions, rules, etc."
                value={form.guidelines}
                onChange={(e) => updateForm('guidelines', e.target.value)}
                rows={4}
              />
            </div>

            <div className={styles.grid2}>
              <div className="input-group">
                <label>Points Awarded</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.points}
                  onChange={(e) => updateForm('points', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="input-group">
                <label>Assignment Mode</label>
                <select
                  className="select"
                  value={form.assignmentMode}
                  onChange={(e) => updateForm('assignmentMode', e.target.value)}
                >
                  <option value={ASSIGNMENT_MODES.RANDOM}>Randomly Assigned</option>
                  <option value={ASSIGNMENT_MODES.MANUAL}>Manually Assigned</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Allowed Submission Types *</label>
              <div className={styles.typesGrid}>
                {Object.values(SUBMISSION_TYPES).filter(t => t !== 'multichoice').map(type => (
                  <label key={type} className={`${styles.typeCard} ${form.submissionTypes.includes(type) ? styles.typeSelected : ''}`}>
                    <input
                      type="checkbox"
                      checked={form.submissionTypes.includes(type)}
                      onChange={() => toggleSubmissionType(type)}
                      className={styles.hiddenCheckbox}
                    />
                    <span className={styles.typeIcon}>
                      {type === 'code' ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> : type === 'video' ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> : type === 'image' ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
                    </span>
                    <span className={styles.typeLabel}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
              {form.submissionTypes.length === 0 && (
                <span className={styles.errorText}>Select at least one submission type</span>
              )}
            </div>

            <div className={styles.actions}>
              <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading || !form.title || form.submissionTypes.length === 0}
              >
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
