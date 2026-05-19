'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getBootcamp, subscribeToStudents, subscribeToVolunteers, subscribeToTeams, getTeams, createTeam, updateStudent } from '@/lib/db';
import { TASK_LEVELS } from '@/shared/constants';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import GlassCard from '@/components/ui/GlassCard';
import Modal from '@/components/ui/Modal';
import styles from './page.module.css';

export default function StudentsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [bootcamp, setBootcamp] = useState(null);
  const [students, setStudents] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [teams, setTeams] = useState([]);

  const [isModalOpen, setModalOpen] = useState(false);
  const [isTeamModalOpen, setTeamModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    level: TASK_LEVELS.BEGINNER,
    volunteerId: '',
    teamId: ''
  });

  const [teamForm, setTeamForm] = useState({ name: '' });

  useEffect(() => {
    const loadBc = async () => {
      const bc = await getBootcamp(id);
      if (bc) setBootcamp(bc);
    };
    loadBc();

    const unsubS = subscribeToStudents(id, setStudents);
    const unsubV = subscribeToVolunteers(id, setVolunteers);
    const unsubT = subscribeToTeams(id, setTeams);

    return () => {
      unsubS();
      unsubV();
      unsubT();
    };
  }, [id]);

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
          bootcampId: id,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create student');
      }

      setModalOpen(false);
      setForm({ displayName: '', email: '', password: '', level: TASK_LEVELS.BEGINNER, volunteerId: '', teamId: '' });
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamForm.name) return;
    setLoading(true);
    try {
      await createTeam(id, { name: teamForm.name, members: [] });
      setTeamModalOpen(false);
      setTeamForm({ name: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ADDED: Function to update the student's level instantly
  const handleLevelUpdate = async (studentId, newLevel) => {
    try {
      await updateStudent(id, studentId, { level: newLevel });
    } catch (err) {
      console.error(err);
      alert("Failed to update student level");
    }
  };

  if (!bootcamp) return null;

  return (
    <div className={styles.container}>
      <SocietyBackground society={bootcamp.society} customColor={bootcamp.colorTheme?.primary} />

      <div className={styles.header}>
        <div>
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => router.push(`/admin/bootcamps/${id}`)}>
            ← Back to Dashboard
          </button>
          <h1 className={styles.title}>Students</h1>
          <p className={styles.subtitle}>Manage students for {bootcamp.name}</p>
        </div>
        <div className={styles.actions}>
          {bootcamp.teamConfig?.enabled && (
            <button className="btn btn-secondary" onClick={() => setTeamModalOpen(true)}>
              + New Team
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            + Add Student
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <GlassCard hover={false} padding="none">
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Level</th>
                  <th>Volunteer</th>
                  {bootcamp.teamConfig?.enabled && <th>Team</th>}
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.uid || student.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.avatar}>{student.displayName.charAt(0)}</div>
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>{student.displayName}</span>
                          <span className={styles.userEmail}>{student.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
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
                    </td>
                    <td>
                      <span className={styles.volunteerName}>
                        {volunteers.find(v => v.id === student.volunteerId)?.displayName || 'Unassigned'}
                      </span>
                    </td>
                    {bootcamp.teamConfig?.enabled && (
                      <td>
                        {teams.find(t => t.id === student.teamId)?.name || '-'}
                      </td>
                    )}
                    <td className={styles.pointsCell}>{student.totalPoints || 0}</td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={bootcamp.teamConfig?.enabled ? 5 : 4} className={styles.emptyRow}>
                      No students found. Add one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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

          <div className="input-group">
            <label>Assign Volunteer</label>
            <select className="select" value={form.volunteerId} onChange={e => setForm({ ...form, volunteerId: e.target.value })}>
              <option value="">-- Unassigned --</option>
              {volunteers.map(v => <option key={v.id} value={v.id}>{v.displayName}</option>)}
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

      {/* Add Team Modal */}
      <Modal isOpen={isTeamModalOpen} onClose={() => setTeamModalOpen(false)} title="Create Team">
        <form onSubmit={handleCreateTeam} className="flex-col gap-md">
          <div className="input-group">
            <label>Team Name</label>
            <input required className="input" value={teamForm.name} onChange={e => setTeamForm({ name: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
            {loading ? 'Creating...' : 'Create Team'}
          </button>
        </form>
      </Modal>
    </div>
  );
}