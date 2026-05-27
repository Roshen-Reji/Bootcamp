'use client';

import { useState, useEffect } from 'react';
import { getAllBootcamps } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import GlassCard from '@/components/ui/GlassCard';
import Modal from '@/components/ui/Modal';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { Users } from 'lucide-react';
import styles from './page.module.css';

export default function GlobalVolunteersPage() {
  const [volunteers, setVolunteers] = useState([]);
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
          fetch('/api/global-users?role=volunteer'),
          getAllBootcamps()
        ]);
        
        const bcData = user.role === 'organiser' 
            ? (bcRes || []).filter(bc => bc.createdBy === user.uid)
            : (bcRes || []);
            
        setBootcamps(bcData);

        if (usersRes.ok) {
          const data = await usersRes.json();
          const allowedBootcampIds = bcData.map(b => b.id);
          const filteredVolunteers = user.role === 'organiser'
              ? data.users.filter(s => allowedBootcampIds.includes(s.bootcampId))
              : data.users;
          setVolunteers(filteredVolunteers);
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
      
      setVolunteers(volunteers.map(v => v.uid === uid ? { ...v, bootcampId: newBootcampId } : v));
      alert('Active bootcamp updated successfully. The volunteer will be redirected to this bootcamp on next login.');
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
        throw new Error(error.error || 'Failed to delete volunteer');
      }
      setVolunteers(volunteers.filter(s => s.uid !== uid));
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

      setVolunteers(volunteers.map(v => v.uid === selectedUserForEdit.uid ? { ...v, displayName: editForm.displayName, email: editForm.email } : v));
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
          <h1 className={styles.title}>Global Volunteers Directory</h1>
          <p className={styles.subtitle}>Manage all registered volunteers across the platform</p>
        </div>
      </div>

      <div className={styles.content}>
        <GlassCard hover={false} padding="none">
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Volunteer Info</th>
                  <th>Registered Email</th>
                  <th>Active Bootcamp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-secondary)' }}>
                      Loading volunteers...
                    </td>
                  </tr>
                ) : volunteers.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <Users size={48} strokeWidth={1.5} opacity={0.5} />
                        <p>No volunteers found in the database.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  volunteers.map(volunteer => (
                    <tr key={volunteer.uid}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'var(--color-primary)', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '600', fontSize: '1.2rem'
                          }}>
                            {volunteer.displayName?.charAt(0).toUpperCase() || 'V'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>{volunteer.displayName}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                              Joined: {volunteer.createdAt ? new Date(volunteer.createdAt).toLocaleDateString() : 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>
                        {volunteer.email}
                      </td>
                      <td>
                        <div style={{ width: '220px' }}>
                          <CustomDropdown
                            value={volunteer.bootcampId || ''}
                            onChange={(val) => handleBootcampChange(volunteer.uid, val)}
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
                            onClick={() => openEditModal(volunteer)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 12px' }}
                            title="Edit Volunteer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openPasswordModal(volunteer)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 12px' }}
                            title="Reset Password"
                          >
                            Key
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ color: '#ff4757', padding: '6px 12px' }}
                            onClick={() => handleDelete(volunteer.uid, volunteer.displayName)}
                            title="Delete Volunteer"
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
        title={`Edit Volunteer: ${selectedUserForEdit?.displayName}`}
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
