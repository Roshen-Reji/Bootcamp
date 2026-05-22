'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getBootcamp, subscribeToVolunteers } from '@/lib/db';
import * as XLSX from 'xlsx';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import GlassCard from '@/components/ui/GlassCard';
import Modal from '@/components/ui/Modal';
import { Shield } from 'lucide-react';
import styles from './page.module.css';

export default function VolunteersPage() {
  const { id } = useParams();
  const router = useRouter();
  const [bootcamp, setBootcamp] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });

  // Bulk Upload State
  const [previewData, setPreviewData] = useState([]);
  const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const fileInputRef = useRef(null);
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
          name: row[nameKey] || `Volunteer ${index + 1}`,
          email: row[emailKey] || '',
          password: (passwordKey && row[passwordKey]) ? row[passwordKey].toString() : Math.random().toString(36).slice(-8),
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

    for (const vol of previewData) {
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: vol.name,
            email: vol.email,
            password: vol.password,
            role: 'volunteer',
            bootcampId: id,
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
          <h1 className={styles.title}>Volunteers</h1>
          <p className={styles.subtitle}>Manage volunteers for {bootcamp.name}</p>
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
            + Add Volunteer
          </button>
        </div>
      </div>

      {volunteers.length === 0 ? (
        <GlassCard hover={false} padding="xl">
          <div className="empty-state">
            <div className="empty-state-icon"><Shield size={48} strokeWidth={1.5} /></div>
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
            {isUploadingBatch ? 'Uploading...' : `Add ${previewData.length} Volunteers`}
          </button>
        </div>
      </Modal>
    </div>
  );
}
