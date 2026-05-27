'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  getBootcamp,
  subscribeToTeams,
  subscribeToStudents,
  subscribeToVolunteers,
  subscribeToSubmissions,
  subscribeToTasks,
  createTeam,
  updateTeam,
  deleteTeam,
  updateStudent
} from '@/lib/db';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import GlassCard from '@/components/ui/GlassCard';
import Modal from '@/components/ui/Modal';
import CustomDropdown from '@/components/ui/CustomDropdown';
import styles from '../page.module.css'; // Reuse bootcamp page styles

export default function AdminTeamsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [bootcamp, setBootcamp] = useState(null);
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [tasks, setTasks] = useState([]);

  // Create Team Modal
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Manage Team Modal
  const [manageTeam, setManageTeam] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingVolunteerId, setEditingVolunteerId] = useState('');
  const [manageTab, setManageTab] = useState('members'); // 'members', 'submissions'

  useEffect(() => {
    const loadBc = async () => {
      const bc = await getBootcamp(id);
      if (bc) {
        if (!bc.teamConfig?.enabled) {
          router.push(`/admin/bootcamps/${id}`);
        } else {
          setBootcamp(bc);
        }
      }
    };
    loadBc();

    const unsubT = subscribeToTeams(id, setTeams);
    const unsubS = subscribeToStudents(id, setStudents);
    const unsubV = subscribeToVolunteers(id, setVolunteers);
    const unsubSubs = subscribeToSubmissions(id, setSubmissions);
    const unsubTasks = subscribeToTasks(id, setTasks);

    return () => {
      unsubT();
      unsubS();
      unsubV();
      unsubSubs();
      unsubTasks();
    };
  }, [id, router]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName) return;
    setIsCreating(true);
    try {
      await createTeam(id, { name: newTeamName, volunteerId: '' });
      setCreateModalOpen(false);
      setNewTeamName('');
    } catch (err) {
      console.error(err);
      alert('Failed to create team');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (!manageTeam || !editingName) return;
    try {
      await updateTeam(id, manageTeam.id, {
        name: editingName,
        volunteerId: editingVolunteerId
      });
      // Update local state for immediate feedback
      setManageTeam({ ...manageTeam, name: editingName, volunteerId: editingVolunteerId });
      alert('Team updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to update team');
    }
  };

  const handleDeleteTeam = async () => {
    if (!manageTeam) return;
    if (!confirm(`Are you sure you want to delete ${manageTeam.name}? Students will be left without a team.`)) return;
    try {
      await deleteTeam(id, manageTeam.id);
      setManageTeam(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete team');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      await updateStudent(id, studentId, { teamId: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to remove student from team');
    }
  };

  const handleAddStudent = async (studentId) => {
    if (!studentId || !manageTeam) return;
    try {
      await updateStudent(id, studentId, { teamId: manageTeam.id });
    } catch (err) {
      console.error(err);
      alert('Failed to add student to team');
    }
  };

  if (!bootcamp) return null;

  const teamMembers = manageTeam ? students.filter(s => s.teamId === manageTeam.id) : [];
  const unassignedStudents = students.filter(s => !s.teamId);
  
  const teamSubmissions = manageTeam ? submissions.filter(sub => teamMembers.some(m => (m.uid || m.id) === sub.studentId)) : [];
  
  const getTaskName = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    return task ? task.title : 'Unknown Task';
  };
  const getStudentName = (studentId) => {
    const s = students.find(s => (s.uid || s.id) === studentId);
    return s ? s.displayName : 'Unknown';
  };

  return (
    <div className={styles.container}>
      <SocietyBackground society={bootcamp.society} customColor={bootcamp.colorTheme?.primary} />

      <div className={styles.bcHeader}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/admin/bootcamps/${id}`)}>
          ← Back to Dashboard
        </button>
        <div className={styles.bcInfo}>
          <div>
            <h1 className={styles.bcName}>Teams</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Manage teams for {bootcamp.name}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
          + New Team
        </button>
      </div>

      <GlassCard hover={false} padding="none">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '16px' }}>Team Name</th>
              <th style={{ padding: '16px' }}>Members</th>
              <th style={{ padding: '16px' }}>Assigned Volunteer</th>
              <th style={{ padding: '16px' }}>Total Points</th>
              <th style={{ padding: '16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => {
              const members = students.filter(s => s.teamId === team.id);
              const volunteer = volunteers.find(v => v.id === team.volunteerId);
              return (
                <tr key={team.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px', fontWeight: 'bold' }}>{team.name}</td>
                  <td style={{ padding: '16px' }}>{members.length} students</td>
                  <td style={{ padding: '16px' }}>{volunteer ? volunteer.displayName : <span style={{ opacity: 0.5 }}>Unassigned</span>}</td>
                  <td style={{ padding: '16px' }}>{team.totalPoints || 0}</td>
                  <td style={{ padding: '16px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setManageTeam(team);
                        setEditingName(team.name);
                        setEditingVolunteerId(team.volunteerId || '');
                        setManageTab('members');
                      }}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              );
            })}
            {teams.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', opacity: 0.5 }}>
                  No teams created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>

      {/* Create Team Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Team">
        <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label>Team Name</label>
            <input required className="input" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary mt-4" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Team'}
          </button>
        </form>
      </Modal>

      {/* Manage Team Modal */}
      <Modal isOpen={!!manageTeam} onClose={() => setManageTeam(null)} title={`Manage: ${manageTeam?.name}`} maxWidth="800px">
        {manageTeam && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Team Settings (Name & Volunteer) */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
                <label>Team Name</label>
                <input className="input" value={editingName} onChange={e => setEditingName(e.target.value)} />
              </div>
              <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>Assign Volunteer</label>
                <CustomDropdown
                  value={editingVolunteerId}
                  onChange={(val) => setEditingVolunteerId(val)}
                  options={[
                    { value: '', label: '-- Unassigned --' },
                    ...volunteers.map(v => ({ value: v.id, label: v.displayName }))
                  ]}
                />
              </div>
              <button className="btn btn-primary" onClick={handleUpdateTeam} disabled={!editingName || (editingName === manageTeam.name && editingVolunteerId === (manageTeam.volunteerId || ''))}>
                Save Details
              </button>
            </div>

            {/* Tabs for Members / Submissions */}
            <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
              <button 
                onClick={() => setManageTab('members')}
                style={{ background: 'transparent', border: 'none', color: manageTab === 'members' ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: 'bold', cursor: 'pointer', padding: '8px 0' }}
              >
                Team Members ({teamMembers.length})
              </button>
              <button 
                onClick={() => setManageTab('submissions')}
                style={{ background: 'transparent', border: 'none', color: manageTab === 'submissions' ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: 'bold', cursor: 'pointer', padding: '8px 0' }}
              >
                Submissions ({teamSubmissions.length})
              </button>
            </div>

            {/* Tab Content: Members */}
            {manageTab === 'members' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <select id="addStudentSelect" className="select" style={{ flex: 1 }}>
                    <option value="">-- Select student to add --</option>
                    {unassignedStudents.map(s => (
                      <option key={s.uid || s.id} value={s.uid || s.id}>{s.displayName} ({s.email})</option>
                    ))}
                  </select>
                  <button className="btn btn-secondary" onClick={() => {
                    const select = document.getElementById('addStudentSelect');
                    if (select.value) {
                      handleAddStudent(select.value);
                      select.value = '';
                    }
                  }}>
                    Add to Team
                  </button>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {teamMembers.map(member => (
                    <li key={member.uid || member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                      <div>
                        <strong>{member.displayName}</strong>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{member.email}</div>
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{ color: '#ff4757' }} onClick={() => handleRemoveStudent(member.uid || member.id)}>
                        Remove
                      </button>
                    </li>
                  ))}
                  {teamMembers.length === 0 && <p style={{ color: 'var(--color-text-secondary)' }}>No members in this team.</p>}
                </ul>
              </div>
            )}

            {/* Tab Content: Submissions */}
            {manageTab === 'submissions' && (
              <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {teamSubmissions.map(sub => (
                  <div key={sub.id} style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <strong>{getTaskName(sub.taskId)}</strong>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>By {getStudentName(sub.studentId)}</div>
                      </div>
                      <span className={`badge ${sub.status === 'approved' ? 'badge-success' : sub.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {sub.status}
                      </span>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                      {sub.type === 'link' ? <a href={sub.content} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>View Link</a> : <span style={{ opacity: 0.8 }}>{typeof sub.content === 'string' ? sub.content.substring(0, 50) + '...' : 'Submission content'}</span>}
                    </div>
                  </div>
                ))}
                {teamSubmissions.length === 0 && <p style={{ color: 'var(--color-text-secondary)' }}>No submissions from this team.</p>}
              </div>
            )}

            {/* Delete Action */}
            <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,71,87,0.3)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" style={{ color: '#ff4757', border: '1px solid #ff4757' }} onClick={handleDeleteTeam}>
                Delete Team
              </button>
            </div>

          </div>
        )}
      </Modal>
    </div>
  );
}
