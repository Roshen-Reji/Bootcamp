'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import Modal from '@/components/ui/Modal';
import { Briefcase } from 'lucide-react';

export default function OrganisersPage() {
  const [organisers, setOrganisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditPasswordOpen, setEditPasswordOpen] = useState(false);
  const [selectedOrganiserId, setSelectedOrganiserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });

  const fetchOrganisers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/global-users?role=organiser');
      if (res.ok) {
        const data = await res.json();
        setOrganisers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganisers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.displayName) return;
    
    setFormLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          role: 'organiser',
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create organiser');
      }
      
      setModalOpen(false);
      setForm({ displayName: '', email: '', password: '' });
      fetchOrganisers(); // Refresh list
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (uid, name) => {
    if (!confirm(`Are you sure you want to delete organiser ${name}?`)) return;
    try {
      const res = await fetch(`/api/global-users?uid=${uid}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete organiser');
      }
      fetchOrganisers();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !selectedOrganiserId) return;
    setFormLoading(true);
    try {
      const res = await fetch('/api/global-users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: selectedOrganiserId, password: newPassword }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update password');
      }
      setEditPasswordOpen(false);
      setNewPassword('');
      alert('Password updated successfully');
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>Organisers Directory</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Manage organisers who can create and control bootcamps.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Add Organiser
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
          Loading organisers...
        </div>
      ) : organisers.length === 0 ? (
        <GlassCard hover={false} padding="xl">
          <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '48px 0' }}>
            <div style={{ opacity: 0.5 }}><Briefcase size={48} strokeWidth={1.5} /></div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>No Organisers Yet</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>Add an organiser to allow them to manage their own bootcamps.</p>
          </div>
        </GlassCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {organisers.map((org, i) => (
            <motion.div
              key={org.uid}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard padding="lg">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: 'var(--color-primary)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '600', fontSize: '1.5rem', flexShrink: 0
                  }}>
                    {org.displayName?.charAt(0).toUpperCase() || 'O'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {org.displayName}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {org.email}
                    </p>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      style={{ padding: '6px' }}
                      onClick={() => {
                        setSelectedOrganiserId(org.uid);
                        setEditPasswordOpen(true);
                      }}
                      title="Edit Password"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </button>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      style={{ color: '#ff4757', padding: '6px' }}
                      onClick={() => handleDelete(org.uid, org.displayName)}
                      title="Remove Organiser"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Add Organiser">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <div className="input-group">
            <label>Full Name</label>
            <input 
              required
              className="input" 
              placeholder="e.g. John Smith"
              value={form.displayName} 
              onChange={e => setForm({...form, displayName: e.target.value})} 
            />
          </div>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              required
              type="email"
              className="input" 
              placeholder="john@example.com"
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
            />
          </div>
          <div className="input-group">
            <label>Temporary Password</label>
            <input 
              required
              type="password"
              className="input" 
              placeholder="Minimum 6 characters"
              value={form.password} 
              onChange={e => setForm({...form, password: e.target.value})} 
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '16px' }} disabled={formLoading}>
            {formLoading ? 'Creating...' : 'Create Organiser'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={isEditPasswordOpen} onClose={() => setEditPasswordOpen(false)} title="Update Password">
        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <div className="input-group">
            <label>New Password</label>
            <input 
              required
              type="password"
              className="input" 
              placeholder="Minimum 6 characters"
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '16px' }} disabled={formLoading}>
            {formLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
