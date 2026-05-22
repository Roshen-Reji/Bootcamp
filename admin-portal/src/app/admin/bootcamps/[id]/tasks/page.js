'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getBootcamp, subscribeToTasks } from '@/lib/db';
import GlassCard from '@/components/ui/GlassCard';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import styles from './page.module.css';

export default function TasksPage() {
  const { id } = useParams();
  const router = useRouter();
  const [bootcamp, setBootcamp] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filterLevel, setFilterLevel] = useState('all');

  useEffect(() => {
    const loadBootcamp = async () => {
      const bc = await getBootcamp(id);
      if (bc) setBootcamp(bc);
    };
    loadBootcamp();
    
    const unsub = subscribeToTasks(id, setTasks);
    return () => unsub();
  }, [id]);

  if (!bootcamp) return null;

  const filteredTasks = filterLevel === 'all' 
    ? tasks 
    : tasks.filter(t => t.level === filterLevel);

  // Group by level for visual hierarchy
  const levels = ['advanced', 'intermediate', 'beginner'];
  
  const getLevelColor = (level) => {
    switch(level) {
      case 'advanced': return '#ff4757';
      case 'intermediate': return '#ffa502';
      case 'beginner': return '#2ed573';
      default: return '#6C63FF';
    }
  };

  return (
    <div className={styles.container}>
      <SocietyBackground society={bootcamp.society} customColor={bootcamp.colorTheme?.primary} />
      
      <div className={styles.header}>
        <div>
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => router.push(`/admin/bootcamps/${id}`)}>
            ← Back to Dashboard
          </button>
          <h1 className={styles.title}>Task Pool</h1>
          <p className={styles.subtitle}>Manage core tasks, tutorials, and subtasks for {bootcamp.name}</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => router.push(`/admin/bootcamps/${id}/tasks/create`)}
        >
          + Create Core Task
        </button>
      </div>

      <div className={styles.filters}>
        {['all', 'advanced', 'intermediate', 'beginner'].map(lvl => (
          <button
            key={lvl}
            className={`${styles.filterBtn} ${filterLevel === lvl ? styles.filterActive : ''}`}
            onClick={() => setFilterLevel(lvl)}
          >
            {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.tasksContainer}>
        {filteredTasks.length === 0 ? (
          <GlassCard hover={false} padding="xl">
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <h3>No Tasks Found</h3>
              <p className="empty-state-text">Get started by creating your first core task.</p>
            </div>
          </GlassCard>
        ) : (
          <div className={styles.taskList}>
            {filteredTasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard padding="lg" hover={true} onClick={() => router.push(`/admin/bootcamps/${id}/tasks/${task.id}`)}>
                  <div className={styles.taskCard}>
                    <div className={styles.taskHeader}>
                      <div className={styles.taskTitleGroup}>
                        <h3 className={styles.taskTitle}>{task.title}</h3>
                        <span 
                          className="badge" 
                          style={{ 
                            background: `${getLevelColor(task.level)}20`, 
                            color: getLevelColor(task.level),
                            border: `1px solid ${getLevelColor(task.level)}40`
                          }}
                        >
                          {task.level}
                        </span>
                        {task.status === 'archived' && (
                          <span className="badge badge-danger">Archived</span>
                        )}
                      </div>
                      <div className={styles.taskPoints}>
                        <span className={styles.pointsIcon}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                        </span>
                        <span className={styles.pointsValue}>{task.points} pts</span>
                      </div>
                    </div>
                    
                    <p className={styles.taskDesc}>{task.description}</p>
                    
                    <div className={styles.taskFooter}>
                      <div className={styles.submissionTypes}>
                        {task.submissionTypes?.map(type => (
                          <span key={type} className={styles.typeTag}>
                            {type === 'code' ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> : type === 'video' ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> : type === 'image' ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> : type === 'link' ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>} <span style={{marginLeft: 4}}>{type}</span>
                          </span>
                        ))}
                      </div>
                      <div className={styles.assignmentInfo}>
                        Assignment: {task.assignmentMode === 'random' ? (
                          <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4}}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><circle cx="15.5" cy="15.5" r="1.5"/><circle cx="15.5" cy="8.5" r="1.5"/><circle cx="8.5" cy="15.5" r="1.5"/></svg> Random</>
                        ) : (
                          <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Manual</>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
