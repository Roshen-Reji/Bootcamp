'use client';

import { useState, useEffect } from 'react';
import { getAllBootcamps } from '@/lib/db';
import GlassCard from '@/components/ui/GlassCard';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { Users } from 'lucide-react';
import styles from './page.module.css';

export default function GlobalStudentsPage() {
  const [students, setStudents] = useState([]);
  const [bootcamps, setBootcamps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, bcRes] = await Promise.all([
          fetch('/api/global-users?role=student'),
          getAllBootcamps()
        ]);
        
        if (usersRes.ok) {
          const data = await usersRes.json();
          setStudents(data.users);
        }
        setBootcamps(bcRes || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
                    <td colSpan={3} style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
