'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  getBootcamp,
  subscribeToTeams,
  subscribeToStudents,
  subscribeToSubmissions,
  subscribeToTasks,
  updateTeam,
  deleteTeam,
  updateStudent
} from '@/lib/db';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import GlassCard from '@/components/ui/GlassCard';
import Modal from '@/components/ui/Modal';
import styles from '../page.module.css'; // Reuse volunteer dashboard styles

export default function VolunteerTeamsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [bootcamp, setBootcamp] = useState(null);
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [tasks, setTasks] = useState([]);

  // Manage Team Modal
  const [manageTeam, setManageTeam] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [manageTab, setManageTab] = useState('members'); // 'members', 'submissions'

  useEffect(() => {
    if (!user || !user.bootcampId) return;

    const loadBc = async () => {
      const bc = await getBootcamp(user.bootcampId);
      if (bc) {
        if (!bc.teamConfig?.enabled) {
          router.push('/volunteer');
        } else {
          setBootcamp(bc);
        }
      }
    };
    loadBc();

    const unsubT = subscribeToTeams(user.bootcampId, (allTeams) => {
      setTeams(allTeams.filter(t => t.volunteerId === user.uid));
    });
    const unsubS = subscribeToStudents(user.bootcampId, setStudents);
    const unsubSubs = subscribeToSubmissions(user.bootcampId, setSubmissions);
    const unsubTasks = subscribeToTasks(user.bootcampId, setTasks);

    return () => {
      unsubT();
      unsubS();
      unsubSubs();
      unsubTasks();
    };
  }, [user, router]);

  const handleUpdateTeam = async () => {
    if (!manageTeam || !editingName) return;
    try {
      await updateTeam(user.bootcampId, manageTeam.id, { name: editingName });
      setManageTeam({ ...manageTeam, name: editingName });
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
      await deleteTeam(user.bootcampId, manageTeam.id);
      setManageTeam(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete team');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      await updateStudent(user.bootcampId, studentId, { teamId: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to remove student from team');
    }
  };

  const handleAddStudent = async (studentId) => {
    if (!studentId || !manageTeam) return;
    try {
      await updateStudent(user.bootcampId, studentId, { teamId: manageTeam.id });
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

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Teams</h1>
          <p className={styles.subtitle}>Manage your assigned teams for {bootcamp.name}</p>
        </div>
      </div>

      <GlassCard hover={false} padding="none">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '16px' }}>Team Name</th>
              <th style={{ padding: '16px' }}>Members</th>
              <th style={{ padding: '16px' }}>Total Points</th>
              <th style={{ padding: '16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => {
              const members = students.filter(s => s.teamId === team.id);
              return (
                <tr key={team.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px', fontWeight: 'bold' }}>{team.name}</td>
                  <td style={{ padding: '16px' }}>{members.length} students</td>
                  <td style={{ padding: '16px' }}>{team.totalPoints || 0}</td>
                  <td style={{ padding: '16px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setManageTeam(team);
                        setEditingName(team.name);
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
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', opacity: 0.5 }}>
                  You are not assigned to any teams yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>

      {/* Manage Team Modal */}
      <Modal isOpen={!!manageTeam} onClose={() => setManageTeam(null)} title={`Manage: ${manageTeam?.name}`} maxWidth="800px">
        {manageTeam && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Team Settings (Name) */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
                <label>Team Name</label>
                <input className="input" value={editingName} onChange={e => setEditingName(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={handleUpdateTeam} disabled={!editingName || editingName === manageTeam.name}>
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
