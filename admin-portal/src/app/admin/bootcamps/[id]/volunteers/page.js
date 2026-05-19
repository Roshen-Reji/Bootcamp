'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getBootcamp, subscribeToVolunteers } from '@/lib/db';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import GlassCard from '@/components/ui/GlassCard';
import Modal from '@/components/ui/Modal';
import styles from './page.module.css';

export default function VolunteersPage() {
  const { id } = useParams();
  const router = useRouter();
  const [bootcamp, setBootcamp] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });

  useEffect(() => {
    const loadBc = async () => {
      const bc = await getBootcamp(id);
      if (bc) setBootcamp(bc);
    };
    loadBc();
    
    const unsub = subscribeToVolunteers(id, setVolunteers);
    return () => unsub();
  }, [id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.displayName) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          role: 'volunteer',
          bootcampId: id,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create volunteer');
      }
      
      setModalOpen(false);
      setForm({ displayName: '', email: '', password: '' });
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
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
          <h1 className={styles.title}>Volunteers</h1>
          <p className={styles.subtitle}>Manage volunteers for {bootcamp.name}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Add Volunteer
        </button>
      </div>

      {volunteers.length === 0 ? (
        <GlassCard hover={false} padding="xl">
          <div className="empty-state">
            <div className="empty-state-icon">🛡️</div>
            <h3>No Volunteers Yet</h3>
            <p className="empty-state-text">Add volunteers to help manage students and review tasks.</p>
          </div>
        </GlassCard>
      ) : (
        <div className={styles.grid}>
          {volunteers.map((vol, i) => (
            <motion.div
              key={vol.uid}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard padding="lg">
                <div className={styles.volCard}>
                  <div className={styles.volAvatar}>
                    {vol.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.volInfo}>
                    <h3 className={styles.volName}>{vol.displayName}</h3>
                    <p className={styles.volEmail}>{vol.email}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Add Volunteer">
        <form onSubmit={handleCreate} className={styles.form}>
          <div className="input-group">
            <label>Full Name</label>
            <input 
              required
              className="input" 
              placeholder="e.g. Jane Doe"
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
              placeholder="jane@ieee.org"
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
          <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
