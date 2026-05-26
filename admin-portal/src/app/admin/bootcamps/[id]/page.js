'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getBootcamp, updateBootcamp } from '@/lib/db';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import GlassCard from '@/components/ui/GlassCard';
import Modal from '@/components/ui/Modal';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { getSocietyLabel } from '@/shared/societies';
import styles from './page.module.css';

const SOCIETIES = [
  { id: 'computer_society', name: 'Computer Society', icon: '💻', color: '#0076D6' },
  { id: 'student_branch', name: 'Student Branch', icon: '🎓', color: '#00629B' },
  { id: 'women_in_engineering', name: 'Women In Engineering', icon: '👩‍💻', color: '#6B2D8B' },
  { id: 'robotics', name: 'Robotics & Automation', icon: '🤖', color: '#E74C3C' },
  { id: 'industrial_applications', name: 'Industrial Applications', icon: '⚙️', color: '#F39C12' },
];

const TABS = [
  { id: 'overview', label: 'Overview', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { id: 'tasks', label: 'Tasks', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
  { id: 'volunteers', label: 'Volunteers', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { id: 'students', label: 'Students', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id: 'submissions', label: 'Submissions', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
  { id: 'leaderboard', label: 'Leaderboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg> },
];

export default function BootcampDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [bootcamp, setBootcamp] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Edit bootcamp modal
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', description: '', icon: '',
    society: [],
    colorTheme: { primary: '#6C63FF', secondary: '#FF6584', accent: '#00D9FF', fontFamily: 'Inter' },
    teamConfig: { enabled: false, individualSubmissions: true },
  });

  // Delete confirmation
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadBootcamp = async () => {
      const bc = await getBootcamp(id);
      if (!bc) {
        router.push('/admin/bootcamps');
        return;
      }
      setBootcamp(bc);
      setLoading(false);
    };
    loadBootcamp();
  }, [id, router]);

  const handleArchive = async () => {
    if (confirm('Are you sure you want to archive this bootcamp?')) {
      try {
        await updateBootcamp(id, { status: 'archived' });
        setBootcamp({ ...bootcamp, status: 'archived' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUnarchive = async () => {
    if (confirm('Are you sure you want to reactivate this bootcamp?')) {
      try {
        await updateBootcamp(id, { status: 'active' });
        setBootcamp({ ...bootcamp, status: 'active' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePermanentDelete = async () => {
    if (deleteConfirmName !== bootcamp.name) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/bootcamps/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete bootcamp');
      }
      router.push('/admin/bootcamps');
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = () => {
    setEditForm({
      name: bootcamp.name || '',
      description: bootcamp.description || '',
      icon: bootcamp.icon || '',
      society: bootcamp.society || [],
      colorTheme: bootcamp.colorTheme || { primary: '#6C63FF', secondary: '#FF6584', accent: '#00D9FF', fontFamily: 'Inter' },
      teamConfig: bootcamp.teamConfig || { enabled: false, individualSubmissions: true },
    });
    setEditModalOpen(true);
  };

  const handleUpdateBootcamp = async (e) => {
    e.preventDefault();
    if (!editForm.name || editForm.society.length === 0) return;
    try {
      await updateBootcamp(id, editForm);
      setBootcamp({ ...bootcamp, ...editForm });
      setEditModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update bootcamp.');
    }
  };

  const toggleEditSociety = (societyId) => {
    let current = [...editForm.society];
    if (current.includes(societyId)) {
      current = current.filter(s => s !== societyId);
    } else {
      current.push(societyId);
    }
    setEditForm({ ...editForm, society: current });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!bootcamp) return null;

  return (
    <div className={styles.container}>
      <SocietyBackground society={bootcamp.society} customColor={bootcamp.colorTheme?.primary} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Bootcamp Header */}
        <div className={styles.bcHeader}>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/admin/bootcamps')}>
            ← All Bootcamps
          </button>
          <div className={styles.bcInfo}>
            <span className={styles.bcIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            </span>
            <div>
              <h1 className={styles.bcName}>{bootcamp.name}</h1>
              <div className={styles.bcMeta}>
                <span className={styles.societyBadge} style={{ color: bootcamp.colorTheme?.primary }}>
                  {getSocietyLabel(bootcamp.society)}
                </span>
                {bootcamp.teamConfig?.enabled && (
                  <span className="badge badge-info">Team-based</span>
                )}
                <span className={`badge ${bootcamp.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                  {bootcamp.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats removed as requested */}

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => {
                if (tab.id === 'tasks') router.push(`/admin/bootcamps/${id}/tasks`);
                else if (tab.id === 'volunteers') router.push(`/admin/bootcamps/${id}/volunteers`);
                else if (tab.id === 'students') router.push(`/admin/bootcamps/${id}/students`);
                else if (tab.id === 'submissions') router.push(`/admin/bootcamps/${id}/submissions`);
                else if (tab.id === 'leaderboard') router.push(`/admin/bootcamps/${id}/leaderboard`);
                else setActiveTab(tab.id);
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Content */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.overviewGrid}
          >
            {/* Quick Actions */}
            <GlassCard hover={false} padding="lg">
              <h3 className={styles.sectionTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8, display: 'inline-block'}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Quick Actions
              </h3>
              <div className={styles.quickActions}>
                <button className="btn btn-secondary" onClick={openEditModal}>
                  ✏️ Edit Bootcamp
                </button>
                <button className="btn btn-primary" onClick={() => router.push(`/admin/bootcamps/${id}/volunteers`)}>
                  + Add Volunteer
                </button>
                <button className="btn btn-secondary" onClick={() => router.push(`/admin/bootcamps/${id}/students`)}>
                  + Add Student
                </button>
                <button className="btn btn-secondary" onClick={() => router.push(`/admin/bootcamps/${id}/tasks`)}>
                  + Create Task
                </button>
                {bootcamp.status === 'active' && (
                  <button className="btn btn-ghost" style={{color: '#ffa502', borderColor: '#ffa502'}} onClick={handleArchive}>
                    📦 Archive Bootcamp
                  </button>
                )}
                {bootcamp.status === 'archived' && (
                  <button className="btn btn-ghost" style={{color: '#2ed573', borderColor: '#2ed573'}} onClick={handleUnarchive}>
                    🔄 Unarchive Bootcamp
                  </button>
                )}
                <button
                  className="btn btn-ghost"
                  style={{color: '#ff4757', borderColor: '#ff4757'}}
                  onClick={() => { setDeleteConfirmName(''); setDeleteModalOpen(true); }}
                >
                  🗑️ Delete Permanently
                </button>
              </div>
            </GlassCard>

            {/* Bootcamp Info */}
            {bootcamp.description && (
              <GlassCard hover={false} padding="lg">
                <h3 className={styles.sectionTitle}>Description</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{bootcamp.description}</p>
              </GlassCard>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Edit Bootcamp Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Bootcamp" maxWidth="700px">
        <form onSubmit={handleUpdateBootcamp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label>Bootcamp Name *</label>
            <input required className="input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Description</label>
            <textarea className="textarea" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
          </div>
          <div className="input-group">
            <label>Custom Icon (emoji)</label>
            <input className="input" value={editForm.icon} onChange={e => setEditForm({ ...editForm, icon: e.target.value })} maxLength={4} />
          </div>

          {/* Societies */}
          <div className="input-group">
            <label>Societies *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {SOCIETIES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  style={{
                    padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: editForm.society.includes(s.id) ? `${s.color}20` : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${editForm.society.includes(s.id) ? s.color : 'rgba(255,255,255,0.1)'}`,
                    color: editForm.society.includes(s.id) ? s.color : 'var(--color-text-secondary)',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => toggleEditSociety(s.id)}
                >
                  <span>{s.icon}</span>
                  <span style={{ fontSize: '0.85rem' }}>{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label>Primary</label>
              <input type="color" className="input" value={editForm.colorTheme.primary} style={{ height: '40px', padding: '4px' }}
                onChange={e => setEditForm({ ...editForm, colorTheme: { ...editForm.colorTheme, primary: e.target.value } })} />
            </div>
            <div className="input-group">
              <label>Secondary</label>
              <input type="color" className="input" value={editForm.colorTheme.secondary} style={{ height: '40px', padding: '4px' }}
                onChange={e => setEditForm({ ...editForm, colorTheme: { ...editForm.colorTheme, secondary: e.target.value } })} />
            </div>
            <div className="input-group">
              <label>Accent</label>
              <input type="color" className="input" value={editForm.colorTheme.accent} style={{ height: '40px', padding: '4px' }}
                onChange={e => setEditForm({ ...editForm, colorTheme: { ...editForm.colorTheme, accent: e.target.value } })} />
            </div>
          </div>

          {/* Team Config */}
          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px' }}>Team Configuration</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: '👤 Individual', config: { enabled: false, individualSubmissions: true } },
                { label: '👥 Team + Individual', config: { enabled: true, individualSubmissions: true } },
                { label: '🤝 Team + Collective', config: { enabled: true, individualSubmissions: false } },
              ].map(opt => {
                const isSelected = editForm.teamConfig.enabled === opt.config.enabled &&
                  editForm.teamConfig.individualSubmissions === opt.config.individualSubmissions;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    style={{
                      padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                      background: isSelected ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                      color: isSelected ? '#fff' : 'var(--color-text-secondary)',
                      border: `1px solid ${isSelected ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'}`,
                      transition: 'all 0.2s',
                    }}
                    onClick={() => setEditForm({ ...editForm, teamConfig: opt.config })}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }} disabled={!editForm.name || editForm.society.length === 0}>
            Save Changes
          </button>
        </form>
      </Modal>

      {/* Permanent Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="⚠️ Permanently Delete Bootcamp">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            padding: '16px', borderRadius: '8px',
            background: 'rgba(255, 71, 87, 0.1)', border: '1px solid rgba(255, 71, 87, 0.3)',
          }}>
            <p style={{ color: '#ff4757', fontWeight: '600', marginBottom: '8px' }}>
              This action is irreversible!
            </p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              This will permanently delete <strong style={{ color: 'var(--color-text)' }}>{bootcamp.name}</strong> and all associated data including:
            </p>
            <ul style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '8px', paddingLeft: '20px' }}>
              <li>All students enrolled in this bootcamp</li>
              <li>All volunteer assignments</li>
              <li>All tasks, tutorials, and subtasks</li>
              <li>All submissions and leaderboard data</li>
              <li>All team data</li>
            </ul>
          </div>

          <div className="input-group">
            <label>Type <strong style={{ color: '#ff4757' }}>{bootcamp.name}</strong> to confirm:</label>
            <input
              className="input"
              placeholder="Type bootcamp name to confirm"
              value={deleteConfirmName}
              onChange={e => setDeleteConfirmName(e.target.value)}
              style={{ borderColor: deleteConfirmName === bootcamp.name ? '#2ed573' : undefined }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </button>
            <button
              className="btn"
              style={{
                background: deleteConfirmName === bootcamp.name ? '#ff4757' : 'rgba(255,71,87,0.2)',
                color: '#fff',
                cursor: deleteConfirmName === bootcamp.name ? 'pointer' : 'not-allowed',
              }}
              disabled={deleteConfirmName !== bootcamp.name || isDeleting}
              onClick={handlePermanentDelete}
            >
              {isDeleting ? 'Deleting...' : '🗑️ Delete Forever'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
