'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomDropdown({ value, options, onChange, small = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentOption = options.find(o => o.value === value) || options[0] || { label: value, value };

    return (
        <div ref={dropdownRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 50 : 1 }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    padding: small ? '6px 12px' : '12px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: small ? '6px' : '8px',
                    color: '#fff',
                    fontSize: small ? '0.85rem' : '0.95rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? '0 0 0 2px rgba(108, 99, 255, 0.4)' : 'none',
                    outline: 'none',
                    minHeight: small ? '32px' : '48px'
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentOption.icon && <span style={{ color: 'var(--color-primary, #6c63ff)', display: 'flex' }}>{currentOption.icon}</span>}
                    {currentOption.label}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', opacity: 0.6, flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            right: 0,
                            background: 'rgba(20, 25, 35, 0.95)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                            maxHeight: '250px',
                            overflowY: 'auto'
                        }}
                    >
                        {options.map((opt) => (
                            <div
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                style={{
                                    padding: small ? '8px 12px' : '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    cursor: 'pointer',
                                    background: value === opt.value ? 'rgba(108, 99, 255, 0.15)' : 'transparent',
                                    color: value === opt.value ? '#fff' : '#cbd5e1',
                                    transition: 'background 0.2s',
                                    fontSize: small ? '0.85rem' : '0.95rem'
                                }}
                                onMouseEnter={(e) => { if (value !== opt.value) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)' }}
                                onMouseLeave={(e) => { if (value !== opt.value) e.currentTarget.style.background = 'transparent' }}
                            >
                                {opt.icon && (
                                    <span style={{ color: value === opt.value ? 'var(--color-primary, #6c63ff)' : '#94a3b8', display: 'flex' }}>
                                        {opt.icon}
                                    </span>
                                )}
                                <span style={{ fontWeight: value === opt.value ? 600 : 400 }}>{opt.label}</span>
                                {value === opt.value && (
                                    <svg style={{ marginLeft: 'auto', color: 'var(--color-primary, #6c63ff)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                )}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}