'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getBootcamp, subscribeToStudents, subscribeToTeams, updateStudent } from '@/lib/db';
import { TASK_LEVELS } from '@/shared/constants';
import * as XLSX from 'xlsx';
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

  // Password Update State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedStudentForPassword, setSelectedStudentForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Bulk Upload State
  const [previewData, setPreviewData] = useState([]);
  const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleLevelUpdate = async (studentId, newLevel) => {
    try {
      await updateStudent(user.bootcampId, studentId, { level: newLevel });
    } catch (err) {
      console.error(err);
      alert("Failed to update student level");
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

  const openPasswordModal = (student) => {
    setSelectedStudentForPassword(student);
    setNewPassword('');
    setPasswordModalOpen(true);
  };

  const handleDelete = async (uid, name) => {
    if (!confirm(`Are you sure you want to remove ${name} from this bootcamp?`)) return;
    try {
      const res = await fetch(`/api/users?uid=${uid}&bootcampId=${user.bootcampId}&role=student`, {
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
      }).filter(row => row.email); // Only keep rows with an email

      setPreviewData(normalizedData);
      setPreviewModalOpen(true);
    };
    reader.readAsBinaryString(file);
    // Reset input
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
            bootcampId: user.bootcampId,
            volunteerId: user.uid,
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

      <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className={styles.title}>My Students</h1>
          <p className={styles.subtitle}>Manage your assigned students</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
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
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            + Add Student
          </button>
        </div>
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
                  <div style={{ display: 'flex', alignItems: 'center' }}>
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
                      <button
                        onClick={() => openPasswordModal(student)}
                        className="btn btn-secondary btn-sm"
                        style={{ marginLeft: '8px', padding: '4px 8px' }}
                      >
                        Key
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ color: '#ff4757', marginLeft: '8px', padding: '4px 8px' }}
                        onClick={() => handleDelete(student.uid || student.id, student.displayName || student.name)}
                        title="Remove Student"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
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