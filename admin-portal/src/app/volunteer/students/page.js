'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getBootcamp, subscribeToStudents, subscribeToTeams, updateStudent } from '@/lib/db';
import { TASK_LEVELS } from '@/shared/constants';
import GlassCard from '@/components/ui/GlassCard';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import Modal from '@/components/ui/Modal';
import styles from '../page.module.css';

export default function VolunteerStudents() {
  const { user } = useAuth();
  const [bootcamp, setBootcamp] = useState(null);
  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);

  // Modal & Form State
  const [isModalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    level: TASK_LEVELS.BEGINNER,
    teamId: ''
  });

  useEffect(() => {
    if (!user || !user.bootcampId) return;

    const loadBc = async () => {
      const bc = await getBootcamp(user.bootcampId);
      if (bc) setBootcamp(bc);
    };
    loadBc();

    const unsubStudents = subscribeToStudents(user.bootcampId, (allStudents) => {
      // Only show students assigned to this volunteer
      setStudents(allStudents.filter(s => s.volunteerId === user.uid));
    });

    const unsubTeams = subscribeToTeams(user.bootcampId, setTeams);

    return () => {
      unsubStudents();
      unsubTeams();
    };
  }, [user]);

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.displayName) return;

    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          role: 'student',
          bootcampId: user.bootcampId,
          volunteerId: user.uid, // Auto-assign to the logged-in volunteer
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create student');
      }

      setModalOpen(false);
      setForm({ displayName: '', email: '', password: '', level: TASK_LEVELS.BEGINNER, teamId: '' });
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ADDED: Function to update the student's level instantly
  const handleLevelUpdate = async (studentId, newLevel) => {
    try {
      await updateStudent(user.bootcampId, studentId, { level: newLevel });
    } catch (err) {
      console.error(err);
      alert("Failed to update student level");
    }
  };

  if (!bootcamp) return null;

  return (
    <div className={styles.container}>
      <SocietyBackground society={bootcamp.society} customColor={bootcamp.colorTheme?.primary} />

      <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className={styles.title}>My Students</h1>
          <p className={styles.subtitle}>Manage your assigned students</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Add Student
        </button>
      </div>

      <div className={styles.content}>
        <GlassCard hover={false} padding="lg">
          <h2 className={styles.sectionTitle}>Students List</h2>
          {students.length === 0 ? (
            <p className="text-secondary mt-2">You currently have no assigned students.</p>
          ) : (
            <div className={styles.actionList}>
              {students.map(student => (
                <div key={student.uid || student.id} className={styles.actionItem}>
                  <div>
                    <span className={styles.studentName}>{student.name || student.displayName || student.email}</span>
                    <span className={styles.taskName}>
                      Role: {student.role}
                      {student.teamId && ` • Team: ${teams.find(t => t.id === student.teamId)?.name || 'Unknown'}`}
                    </span>
                  </div>
                  {/* CHANGED: Swapped static badge for an interactive dropdown */}
                  <select
                    className="select"
                    value={student.level || 'beginner'}
                    onChange={(e) => handleLevelUpdate(student.uid || student.id, e.target.value)}
                    style={{
                      padding: '4px 28px 4px 12px',
                      fontSize: '0.75rem',
                      height: 'auto',
                      borderRadius: 'var(--radius-full)',
                      width: 'auto'
                    }}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Add Student Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Add Student">
        <form onSubmit={handleCreateStudent} className="flex-col gap-md">
          <div className="input-group">
            <label>Full Name</label>
            <input required className="input" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input required type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Temporary Password</label>
            <input required type="password" className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>

          <div className="input-group">
            <label>Level</label>
            <select className="select" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
              <option value={TASK_LEVELS.BEGINNER}>Beginner</option>
              <option value={TASK_LEVELS.INTERMEDIATE}>Intermediate</option>
              <option value={TASK_LEVELS.ADVANCED}>Advanced</option>
            </select>
          </div>

          {bootcamp.teamConfig?.enabled && (
            <div className="input-group">
              <label>Assign Team</label>
              <select className="select" value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })}>
                <option value="">-- No Team --</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
            {loading ? 'Creating...' : 'Create Student'}
          </button>
        </form>
      </Modal>
    </div>
  );
}