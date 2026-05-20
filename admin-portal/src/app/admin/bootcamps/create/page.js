'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { createBootcamp } from '@/lib/db';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import GlassCard from '@/components/ui/GlassCard';
import styles from './page.module.css';

const SOCIETIES = [
  { id: 'computer_society', name: 'Computer Society', icon: '💻', color: '#0076D6', desc: 'Code rain background effect' },
  { id: 'student_branch', name: 'Student Branch', icon: '🎓', color: '#00629B', desc: 'Node network background effect' },
  { id: 'women_in_engineering', name: 'Women In Engineering', icon: '👩‍💻', color: '#6B2D8B', desc: 'Aurora borealis background effect' },
  { id: 'robotics', name: 'Robotics & Automation', icon: '🤖', color: '#E74C3C', desc: 'Circuit board background effect' },
  { id: 'industrial_applications', name: 'Industrial Applications', icon: '⚙️', color: '#F39C12', desc: 'Blueprint grid background effect' },
];

const DEFAULT_THEMES = {
  computer_society: { primary: '#0076D6', secondary: '#004A8F', accent: '#00D4FF' },
  student_branch: { primary: '#00629B', secondary: '#003D61', accent: '#4ECDC4' },
  women_in_engineering: { primary: '#6B2D8B', secondary: '#3D1952', accent: '#E040FB' },
  robotics: { primary: '#E74C3C', secondary: '#922B21', accent: '#FF7675' },
  industrial_applications: { primary: '#F39C12', secondary: '#B7770D', accent: '#FFEAA7' },
};

export default function CreateBootcampPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [previewSocieties, setPreviewSocieties] = useState([]);

  const [form, setForm] = useState({
    name: '',
    description: '',
    society: [], // NOW AN ARRAY
    icon: '',
    colorTheme: { primary: '#6C63FF', secondary: '#FF6584', accent: '#00D9FF' },
    teamConfig: { enabled: false, individualSubmissions: true },
  });

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleSociety = (societyId) => {
    let currentSocieties = [...form.society];

    // Toggle logic
    if (currentSocieties.includes(societyId)) {
      currentSocieties = currentSocieties.filter(id => id !== societyId);
    } else {
      currentSocieties.push(societyId);
    }

    const primarySociety = currentSocieties[0];
    const icon = currentSocieties.length > 1 ? '🌐' : (SOCIETIES.find(s => s.id === primarySociety)?.icon || '');
    const theme = primarySociety ? (DEFAULT_THEMES[primarySociety] || form.colorTheme) : { primary: '#6C63FF', secondary: '#FF6584', accent: '#00D9FF' };

    setForm(prev => ({
      ...prev,
      society: currentSocieties,
      icon,
      colorTheme: theme
    }));

    setPreviewSocieties(currentSocieties);
  };

  const handleSubmit = async () => {
    if (!form.name || form.society.length === 0) return;
    setLoading(true);
    try {
      const id = await createBootcamp({
        ...form,
        createdBy: user.uid,
      });
      router.push(`/admin/bootcamps/${id}`);
    } catch (error) {
      console.error('Error creating bootcamp:', error);
      alert('Failed to create bootcamp. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Live background preview */}
      <AnimatePresence>
        {previewSocieties.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SocietyBackground society={previewSocieties} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className={styles.header}>
          <button className="btn btn-ghost" onClick={() => router.back()}>
            ← Back
          </button>
          <h1 className={styles.title}>Create Bootcamp</h1>
          <p className={styles.subtitle}>Set up a new IEEE bootcamp with customized design</p>
        </div>

        {/* Step Indicator */}
        <div className={styles.steps}>
          {['Details', 'Societies', 'Theme', 'Teams'].map((label, i) => (
            <button
              key={label}
              className={`${styles.step} ${step === i + 1 ? styles.stepActive : ''} ${step > i + 1 ? styles.stepDone : ''}`}
              onClick={() => setStep(i + 1)}
            >
              <span className={styles.stepNum}>{step > i + 1 ? '✓' : i + 1}</span>
              <span className={styles.stepLabel}>{label}</span>
            </button>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard hover={false} padding="xl">
                <h2 className={styles.stepTitle}>Bootcamp Details</h2>
                <div className={styles.formGrid}>
                  <div className="input-group">
                    <label>Bootcamp Name *</label>
                    <input
                      className="input"
                      placeholder="e.g., Web Development Bootcamp 2026"
                      value={form.name}
                      onChange={(e) => updateForm('name', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Description</label>
                    <textarea
                      className="textarea"
                      placeholder="Describe the bootcamp, its goals, and what students will learn..."
                      value={form.description}
                      onChange={(e) => updateForm('description', e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="input-group">
                    <label>Custom Icon (emoji or leave blank for society default)</label>
                    <input
                      className="input"
                      placeholder="🚀"
                      value={form.icon}
                      onChange={(e) => updateForm('icon', e.target.value)}
                      maxLength={4}
                    />
                  </div>
                </div>
                <div className={styles.stepActions}>
                  <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!form.name}>
                    Next: Choose Societies →
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard hover={false} padding="xl">
                <h2 className={styles.stepTitle}>Choose IEEE Societies</h2>
                <p className={styles.stepDesc}>
                  Select one or more societies. Choosing multiple unlocks the Antigravity background!
                </p>
                <div className={styles.societyGrid}>
                  {SOCIETIES.map((society) => (
                    <motion.button
                      key={society.id}
                      className={`${styles.societyCard} ${form.society.includes(society.id) ? styles.societySelected : ''}`}
                      onClick={() => toggleSociety(society.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        borderColor: form.society.includes(society.id) ? society.color : undefined,
                        boxShadow: form.society.includes(society.id) ? `0 0 20px ${society.color}30` : undefined,
                      }}
                    >
                      <span className={styles.societyIcon}>{society.icon}</span>
                      <span className={styles.societyName}>{society.name}</span>
                      <span className={styles.societyDesc}>{society.desc}</span>
                      <div
                        className={styles.societyColorBar}
                        style={{ background: society.color }}
                      />
                    </motion.button>
                  ))}
                </div>
                <div className={styles.stepActions}>
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn btn-primary" onClick={() => setStep(3)} disabled={form.society.length === 0}>
                    Next: Customize Theme →
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard hover={false} padding="xl">
                <h2 className={styles.stepTitle}>Customize Color Theme</h2>
                <p className={styles.stepDesc}>
                  Fine-tune the colors or keep the society defaults.
                </p>
                <div className={styles.colorGrid}>
                  <div className={styles.colorPicker}>
                    <label>Primary Color</label>
                    <div className={styles.colorInputWrap}>
                      <input
                        type="color"
                        value={form.colorTheme.primary}
                        onChange={(e) => updateForm('colorTheme', { ...form.colorTheme, primary: e.target.value })}
                        className={styles.colorInput}
                      />
                      <span className={styles.colorHex}>{form.colorTheme.primary}</span>
                    </div>
                  </div>
                  <div className={styles.colorPicker}>
                    <label>Secondary Color</label>
                    <div className={styles.colorInputWrap}>
                      <input
                        type="color"
                        value={form.colorTheme.secondary}
                        onChange={(e) => updateForm('colorTheme', { ...form.colorTheme, secondary: e.target.value })}
                        className={styles.colorInput}
                      />
                      <span className={styles.colorHex}>{form.colorTheme.secondary}</span>
                    </div>
                  </div>
                  <div className={styles.colorPicker}>
                    <label>Accent Color</label>
                    <div className={styles.colorInputWrap}>
                      <input
                        type="color"
                        value={form.colorTheme.accent}
                        onChange={(e) => updateForm('colorTheme', { ...form.colorTheme, accent: e.target.value })}
                        className={styles.colorInput}
                      />
                      <span className={styles.colorHex}>{form.colorTheme.accent}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.themePreview}>
                  <h4>Preview</h4>
                  <div className={styles.previewBar}>
                    <div style={{ background: form.colorTheme.primary, flex: 3 }} />
                    <div style={{ background: form.colorTheme.secondary, flex: 2 }} />
                    <div style={{ background: form.colorTheme.accent, flex: 1 }} />
                  </div>
                  <div
                    className={styles.previewGradient}
                    style={{
                      background: `linear-gradient(135deg, ${form.colorTheme.primary}, ${form.colorTheme.accent}, ${form.colorTheme.secondary})`,
                    }}
                  />
                </div>
                <div className={styles.stepActions}>
                  <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                  <button className="btn btn-primary" onClick={() => setStep(4)}>
                    Next: Team Config →
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard hover={false} padding="xl">
                <h2 className={styles.stepTitle}>Team Configuration</h2>
                <p className={styles.stepDesc}>
                  Configure how students work — individually or in teams.
                </p>

                <div className={styles.teamOptions}>
                  <motion.button
                    className={`${styles.teamOption} ${!form.teamConfig.enabled ? styles.teamSelected : ''}`}
                    onClick={() => updateForm('teamConfig', { enabled: false, individualSubmissions: true })}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className={styles.teamIcon}>👤</span>
                    <span className={styles.teamTitle}>Individual</span>
                    <span className={styles.teamDesc}>
                      Students work independently. Leaderboard shows individual rankings.
                    </span>
                  </motion.button>

                  <motion.button
                    className={`${styles.teamOption} ${form.teamConfig.enabled && form.teamConfig.individualSubmissions ? styles.teamSelected : ''}`}
                    onClick={() => updateForm('teamConfig', { enabled: true, individualSubmissions: true })}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className={styles.teamIcon}>👥</span>
                    <span className={styles.teamTitle}>Team + Individual Scores</span>
                    <span className={styles.teamDesc}>
                      Students in teams, each submits individually. Team leaderboard shows total; click to expand member scores.
                    </span>
                  </motion.button>

                  <motion.button
                    className={`${styles.teamOption} ${form.teamConfig.enabled && !form.teamConfig.individualSubmissions ? styles.teamSelected : ''}`}
                    onClick={() => updateForm('teamConfig', { enabled: true, individualSubmissions: false })}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className={styles.teamIcon}>🤝</span>
                    <span className={styles.teamTitle}>Team + Collective</span>
                    <span className={styles.teamDesc}>
                      Teams submit as one unit. Leaderboard shows team rankings only, no individual breakdown.
                    </span>
                  </motion.button>
                </div>

                <div className={styles.stepActions}>
                  <button className="btn btn-secondary" onClick={() => setStep(3)}>← Back</button>
                  <motion.button
                    className="btn btn-primary btn-lg"
                    onClick={handleSubmit}
                    disabled={loading || !form.name || form.society.length === 0}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {loading ? 'Creating...' : '🚀 Create Bootcamp'}
                  </motion.button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}