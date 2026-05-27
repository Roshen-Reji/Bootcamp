'use client';

import { useState, useEffect } from 'react';
import { getAllBootcamps } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import GlassCard from '@/components/ui/GlassCard';
import Modal from '@/components/ui/Modal';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { Users } from 'lucide-react';
import styles from './page.module.css';

export default function GlobalStudentsPage() {
  const [students, setStudents] = useState([]);
  const [bootcamps, setBootcamps] = useState([]);
  const [loading, setLoading] = useState(true);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [editForm, setEditForm] = useState({ displayName: '', email: '' });
  const [isEditingUser, setIsEditingUser] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [usersRes, bcRes] = await Promise.all([
          fetch('/api/global-users?role=student'),
          getAllBootcamps()
        ]);
        
        const bcData = user.role === 'organiser' 
            ? (bcRes || []).filter(bc => bc.createdBy === user.uid)
            : (bcRes || []);
            
        setBootcamps(bcData);

        if (usersRes.ok) {
          const data = await usersRes.json();
          const allowedBootcampIds = bcData.map(b => b.id);
          const filteredStudents = user.role === 'organiser'
              ? data.users.filter(s => allowedBootcampIds.includes(s.bootcampId))
              : data.users;
          setStudents(filteredStudents);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleBootcampChange = async (uid, newBootcampId) => {
    try {
      const res = await fetch('/api/global-users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, bootcampId: newBootcampId })
      });
      
      if (!res.ok) throw new Error('Failed to update active bootcamp');
      
      setStudents(students.map(s => s.uid === uid ? { ...s, bootcampId: newBootcampId } : s));
      alert('Active bootcamp updated successfully. The student will be redirected to this bootcamp on next login.');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleDelete = async (uid, name) => {
    if (!confirm(`Are you sure you want to completely delete ${name} from the system?`)) return;
    try {
      const res = await fetch(`/api/global-users?uid=${uid}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete student');
      }
      setStudents(students.filter(s => s.uid !== uid));
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!selectedUserForPassword || !newPassword) return;

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/global-users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: selectedUserForPassword.uid,
          password: newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

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
          uid: selectedUserForEdit.uid,
          displayName: editForm.displayName,
          email: editForm.email
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      setStudents(students.map(s => s.uid === selectedUserForEdit.uid ? { ...s, displayName: editForm.displayName, email: editForm.email } : s));
      setEditModalOpen(false);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsEditingUser(false);
    }
  };

  const openPasswordModal = (user) => {
    setSelectedUserForPassword(user);
    setNewPassword('');
    setPasswordModalOpen(true);
  };

  const openEditModal = (user) => {
    setSelectedUserForEdit(user);
    setEditForm({ displayName: user.displayName, email: user.email });
    setEditModalOpen(true);
  };

  const bootcampOptions = bootcamps.map(bc => ({
    value: bc.id,
    label: bc.name
  }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Global Students Directory</h1>
          <p className={styles.subtitle}>Manage all registered students across the platform</p>
        </div>
      </div>

      <div className={styles.content}>
        <GlassCard hover={false} padding="none">
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Registered Email</th>
                  <th>Active Bootcamp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-secondary)' }}>
                      Loading students...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <Users size={48} strokeWidth={1.5} opacity={0.5} />
                        <p>No students found in the database.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map(student => (
                    <tr key={student.uid}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'var(--color-primary)', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '600', fontSize: '1.2rem'
                          }}>
                            {student.displayName?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>{student.displayName}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                              Joined: {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>
                        {student.email}
                      </td>
                      <td>
                        <div style={{ width: '220px' }}>
                          <CustomDropdown
                            value={student.bootcampId || ''}
                            onChange={(val) => handleBootcampChange(student.uid, val)}
                            options={[
                              { value: '', label: '-- No Active Bootcamp --' },
                              ...bootcampOptions
                            ]}
                          />
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => openEditModal(student)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 12px' }}
                            title="Edit Student"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openPasswordModal(student)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 12px' }}
                            title="Reset Password"
                          >
                            Key
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ color: '#ff4757', padding: '6px 12px' }}
                            onClick={() => handleDelete(student.uid, student.displayName)}
                            title="Delete Student"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title={`Change Password: ${selectedUserForPassword?.displayName}`}
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
    </div>
  );
}
