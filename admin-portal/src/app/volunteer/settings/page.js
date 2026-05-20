'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import GlassCard from '@/components/ui/GlassCard';

const UserIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const LogoutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;

export default function VolunteerSettingsPage() {
    const { user, logout } = useAuth();

    return (
        <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 8px 0' }}>Settings</h1>
                    <p style={{ color: '#94a3b8', margin: 0 }}>View your profile information</p>
                </div>

                <GlassCard hover={false} padding="lg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ background: 'rgba(108, 99, 255, 0.15)', color: '#6C63FF', padding: '12px', borderRadius: '12px' }}>
                            <UserIcon />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', margin: '0 0 4px 0' }}>Profile Information</h2>
                            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>Your current account details</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#cbd5e1' }}>Full Name</label>
                            <div style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}>
                                {user?.displayName || 'Unknown Volunteer'}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#cbd5e1' }}>Email Address</label>
                            <div style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}>
                                {user?.email || 'N/A'}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#cbd5e1' }}>Role</label>
                            <div style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', textTransform: 'capitalize' }}>
                                Volunteer / Reviewer
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <button
                            type="button"
                            onClick={logout}
                            className="btn"
                            style={{ background: 'rgba(255, 71, 87, 0.1)', color: '#ff4757', border: '1px solid rgba(255, 71, 87, 0.3)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', width: '100%', justifyContent: 'center' }}
                        >
                            <LogoutIcon />
                            Sign Out
                        </button>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
}