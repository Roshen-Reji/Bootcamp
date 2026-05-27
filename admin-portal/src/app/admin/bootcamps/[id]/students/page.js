'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getBootcamp, subscribeToStudents, subscribeToVolunteers, subscribeToTeams, getTeams, createTeam, updateTeam, deleteTeam, updateStudent } from '@/lib/db';
import { TASK_LEVELS } from '@/shared/constants';
import * as XLSX from 'xlsx';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import GlassCard from '@/components/ui/GlassCard';
import Modal from '@/components/ui/Modal';
import CustomDropdown from '@/components/ui/CustomDropdown';
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

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedStudentForPassword, setSelectedStudentForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Bulk Upload State
  const [previewData, setPreviewData] = useState([]);
  const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const fileInputRef = useRef(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [editForm, setEditForm] = useState({ displayName: '', email: '', teamId: '' });
  const [isEditingUser, setIsEditingUser] = useState(false);

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

  const [manageTeamsModalOpen, setManageTeamsModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editingTeamName, setEditingTeamName] = useState('');

  const handleUpdateTeam = async (teamId) => {
    if (!editingTeamName) return;
    try {
      await updateTeam(id, teamId, { name: editingTeamName });
      setEditingTeamId(null);
      setEditingTeamName('');
    } catch (err) {
      console.error(err);
      alert('Failed to update team');
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    if (!confirm(`Are you sure you want to delete the team "${teamName}"? This will not delete the students, but they will be left without a team.`)) return;
    try {
      await deleteTeam(id, teamId);
    } catch (err) {
      console.error(err);
      alert('Failed to delete team');
    }
  };

  const handleLevelUpdate = async (studentId, newLevel) => {
    try {
      await updateStudent(id, studentId, { level: newLevel });
    } catch (err) {
      console.error(err);
      alert("Failed to update student level");
    }
  };

  const handleVolunteerUpdate = async (studentId, newVolunteerId) => {
    try {
      await updateStudent(id, studentId, { volunteerId: newVolunteerId });
    } catch (err) {
      console.error(err);
      alert("Failed to assign volunteer");
    }
  };

  const handleTeamUpdate = async (studentId, newTeamId) => {
    try {
      await updateStudent(id, studentId, { teamId: newTeamId });
    } catch (err) {
      console.error(err);
      alert("Failed to assign team");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!selectedStudentForPassword || !newPassword) return;

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/users/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: selectedStudentForPassword.uid || selectedStudentForPassword.id,
          newPassword: newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Password updated successfully!');
      setPasswordModalOpen(false);
      setNewPassword('');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;

    setIsEditingUser(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: selectedUserForEdit.uid || selectedUserForEdit.id,
          displayName: editForm.displayName,
          email: editForm.email,
          teamId: editForm.teamId,
          role: 'student',
          bootcampId: id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      setEditModalOpen(false);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsEditingUser(false);
    }
  };

  const openPasswordModal = (student) => {
    setSelectedStudentForPassword(student);
    setNewPassword('');
    setPasswordModalOpen(true);
  };

  const openEditModal = (student) => {
    setSelectedUserForEdit(student);
    setEditForm({ displayName: student.displayName, email: student.email, teamId: student.teamId || '' });
    setEditModalOpen(true);
  };

  const handleDelete = async (uid, name) => {
    if (!confirm(`Are you sure you want to remove ${name} from this bootcamp?`)) return;
    try {
      const res = await fetch(`/api/users?uid=${uid}&bootcampId=${id}&role=student`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete student');
      }
      // UI updates automatically via subscription
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const normalizedData = json.map((row, index) => {
        const rowKeys = Object.keys(row);
        const emailKey = rowKeys.find(k => k.toLowerCase().includes('email')) || rowKeys[1] || 'Email';
        const nameKey = rowKeys.find(k => k.toLowerCase().includes('name')) || rowKeys[0] || 'Name';
        const passwordKey = rowKeys.find(k => k.toLowerCase().includes('password'));

        return {
          slNo: index + 1,
          name: row[nameKey] || `Student ${index + 1}`,
          email: row[emailKey] || '',
          password: (passwordKey && row[passwordKey]) ? row[passwordKey].toString() : Math.random().toString(36).slice(-8),
          level: TASK_LEVELS.BEGINNER,
        };
      }).filter(row => row.email);

      setPreviewData(normalizedData);
      setPreviewModalOpen(true);
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePreviewRow = (index) => {
    const newData = [...previewData];
    newData.splice(index, 1);
    setPreviewData(newData);
  };

  const handleBatchUpload = async () => {
    setIsUploadingBatch(true);
    let successCount = 0;
    let failCount = 0;

    for (const student of previewData) {
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: student.name,
            email: student.email,
            password: student.password,
            role: 'student',
            level: student.level,
            bootcampId: id,
            volunteerId: '', // Unassigned
            teamId: ''
          }),
        });

        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (e) {
        console.error("Batch upload error:", e);
        failCount++;
      }
    }

    setIsUploadingBatch(false);
    setPreviewModalOpen(false);
    setPreviewData([]);
    alert(`Batch upload complete! \nSuccessful: ${successCount}\nFailed: ${failCount}`);
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
          <input
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/plain"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            ref={fileInputRef}
          />
          <button 
            className="btn btn-secondary" 
            onClick={() => fileInputRef.current?.click()}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Bulk Upload
          </button>
          {bootcamp.teamConfig?.enabled && (
            <>
              <button className="btn btn-secondary" onClick={() => setManageTeamsModalOpen(true)}>
                Manage Teams
              </button>
              <button className="btn btn-secondary" onClick={() => setTeamModalOpen(true)}>
                + New Team
              </button>
            </>
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
                      <div style={{ width: '135px' }}>
                        <CustomDropdown
                          small={true}
                          value={student.level || 'beginner'}
                          onChange={(val) => handleLevelUpdate(student.uid || student.id, val)}
                          options={[
                            { value: 'beginner', label: 'Beginner' },
                            { value: 'intermediate', label: 'Intermediate' },
                            { value: 'advanced', label: 'Advanced' }
                          ]}
                        />
                      </div>
                    </td>
                    <td>
                      <div style={{ width: '160px' }}>
                        {bootcamp.teamConfig?.enabled ? (
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Managed by Team</span>
                        ) : (
                          <CustomDropdown
                            small={true}
                            value={student.volunteerId || ''}
                            onChange={(val) => handleVolunteerUpdate(student.uid || student.id, val)}
                            options={[
                              { value: '', label: 'Unassigned' },
                              ...volunteers.map(v => ({ value: v.id, label: v.displayName }))
                            ]}
                          />
                        )}
                      </div>
                    </td>
                    {bootcamp.teamConfig?.enabled && (
                      <td>
                        <div style={{ width: '160px' }}>
                          <CustomDropdown
                            small={true}
                            value={student.teamId || ''}
                            onChange={(val) => handleTeamUpdate(student.uid || student.id, val)}
                            options={[
                              { value: '', label: 'Unassigned' },
                              ...teams.map(t => ({ value: t.id, label: t.name }))
                            ]}
                          />
                        </div>
                      </td>
                    )}
                    <td className={styles.pointsCell}>
                      {student.totalPoints || 0}
                      <button
                        onClick={() => openEditModal(student)}
                        className="btn btn-secondary btn-sm"
                        style={{ marginLeft: '12px', padding: '4px 8px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openPasswordModal(student)}
                        className="btn btn-secondary btn-sm"
                        style={{ marginLeft: '12px', padding: '4px 8px' }}
                      >
                        Key
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ color: '#ff4757', marginLeft: '8px', padding: '4px 8px' }}
                        onClick={() => handleDelete(student.uid || student.id, student.displayName)}
                        title="Remove Student"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </td>
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
            <label style={{ display: 'block', marginBottom: '8px' }}>Level</label>
            <CustomDropdown
              value={form.level}
              onChange={(val) => setForm({ ...form, level: val })}
              options={[
                { value: TASK_LEVELS.BEGINNER, label: 'Beginner' },
                { value: TASK_LEVELS.INTERMEDIATE, label: 'Intermediate' },
                { value: TASK_LEVELS.ADVANCED, label: 'Advanced' }
              ]}
            />
          </div>

          {!bootcamp.teamConfig?.enabled && (
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px' }}>Assign Volunteer</label>
              <CustomDropdown
                value={form.volunteerId}
                onChange={(val) => setForm({ ...form, volunteerId: val })}
                options={[
                  { value: '', label: '-- Unassigned --' },
                  ...volunteers.map(v => ({ value: v.id, label: v.displayName }))
                ]}
              />
            </div>
          )}

          {bootcamp.teamConfig?.enabled && (
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px' }}>Assign Team</label>
              <CustomDropdown
                value={form.teamId}
                onChange={(val) => setForm({ ...form, teamId: val })}
                options={[
                  { value: '', label: '-- No Team --' },
                  ...teams.map(t => ({ value: t.id, label: t.name }))
                ]}
              />
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

      {/* Manage Teams Modal */}
      <Modal isOpen={manageTeamsModalOpen} onClose={() => setManageTeamsModalOpen(false)} title="Manage Teams">
        <div className="flex-col gap-md" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {teams.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>No teams found.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {teams.map(team => (
                <li key={team.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {editingTeamId === team.id ? (
                    <div style={{ display: 'flex', gap: '8px', flex: 1, marginRight: '12px' }}>
                      <input
                        className="input"
                        style={{ flex: 1, padding: '4px 8px' }}
                        value={editingTeamName}
                        onChange={e => setEditingTeamName(e.target.value)}
                        autoFocus
                      />
                      <button className="btn btn-primary btn-sm" onClick={() => handleUpdateTeam(team.id)}>Save</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditingTeamId(null); setEditingTeamName(''); }}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <span style={{ color: 'var(--color-text)' }}>{team.name}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px' }}
                          onClick={() => {
                            setEditingTeamId(team.id);
                            setEditingTeamName(team.name);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#ff4757', padding: '4px 8px' }}
                          onClick={() => handleDeleteTeam(team.id, team.name)}
                          title="Delete Team"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title={`Change Password: ${selectedStudentForPassword?.displayName}`}
      >
        <form onSubmit={handleChangePassword} className="flex-col gap-md">
          <div className="input-group">
            <label>New Password</label>
            <input
              required
              minLength={6}
              type="password"
              className="input"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary mt-4" disabled={isChangingPassword}>
            {isChangingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Student: ${selectedUserForEdit?.displayName}`}
      >
        <form onSubmit={handleEditUser} className="flex-col gap-md">
          <div className="input-group">
            <label>Display Name</label>
            <input
              required
              className="input"
              value={editForm.displayName}
              onChange={e => setEditForm({ ...editForm, displayName: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label>Email Address</label>
            <input
              required
              type="email"
              className="input"
              value={editForm.email}
              onChange={e => setEditForm({ ...editForm, email: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary mt-4" disabled={isEditingUser}>
            {isEditingUser ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </Modal>

      {/* Bulk Upload Preview Modal */}
      <Modal isOpen={isPreviewModalOpen} onClose={() => setPreviewModalOpen(false)} title="Bulk Upload Preview" maxWidth="800px">
        <div style={{ maxHeight: '60vh', overflowY: 'auto', marginBottom: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--color-text)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '12px 8px' }}>Sl.No</th>
                <th style={{ padding: '12px 8px' }}>Name</th>
                <th style={{ padding: '12px 8px' }}>Email Address</th>
                <th style={{ padding: '12px 8px' }}>Temp Password</th>
                <th style={{ padding: '12px 8px' }}>Level</th>
                <th style={{ padding: '12px 8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 8px' }}>{row.slNo}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <input 
                      className="input" 
                      style={{ padding: '4px 8px' }} 
                      value={row.name} 
                      onChange={e => {
                        const newData = [...previewData];
                        newData[idx].name = e.target.value;
                        setPreviewData(newData);
                      }} 
                    />
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <input 
                      className="input" 
                      style={{ padding: '4px 8px' }} 
                      value={row.email} 
                      onChange={e => {
                        const newData = [...previewData];
                        newData[idx].email = e.target.value;
                        setPreviewData(newData);
                      }} 
                    />
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <input 
                      className="input" 
                      style={{ padding: '4px 8px' }} 
                      value={row.password} 
                      onChange={e => {
                        const newData = [...previewData];
                        newData[idx].password = e.target.value;
                        setPreviewData(newData);
                      }} 
                    />
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <select
                      className="select"
                      style={{ padding: '4px 8px' }}
                      value={row.level}
                      onChange={e => {
                        const newData = [...previewData];
                        newData[idx].level = e.target.value;
                        setPreviewData(newData);
                      }}
                    >
                      <option value={TASK_LEVELS.BEGINNER}>Beginner</option>
                      <option value={TASK_LEVELS.INTERMEDIATE}>Intermediate</option>
                      <option value={TASK_LEVELS.ADVANCED}>Advanced</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      style={{ color: '#ff4757' }} 
                      onClick={() => removePreviewRow(idx)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {previewData.length === 0 && (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)' }}>No valid data found or all rows removed.</p>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
          <button className="btn btn-ghost" onClick={() => setPreviewModalOpen(false)}>Cancel</button>
          <button 
            className="btn btn-primary" 
            onClick={handleBatchUpload} 
            disabled={isUploadingBatch || previewData.length === 0}
          >
            {isUploadingBatch ? 'Uploading...' : `Add ${previewData.length} Students`}
          </button>
        </div>
      </Modal>
    </div>
  );
}