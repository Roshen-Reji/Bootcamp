'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { getBootcamp, subscribeToTasks, subscribeToSubmissions, subscribeToStudent } from '@/lib/db';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import GlassCard from '@/components/ui/GlassCard';
import styles from './page.module.css';

export default function StudentTasksPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [bootcamp, setBootcamp] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user?.bootcampId || !user?.uid) return;

    const loadBc = async () => {
      const bc = await getBootcamp(user.bootcampId);
      if (bc) setBootcamp(bc);
    };
    loadBc();

    const unsubTasks = subscribeToTasks(user.bootcampId, setTasks);
    const unsubSubs = subscribeToSubmissions(user.bootcampId, (allSubs) => {
      setSubmissions(allSubs.filter(s => s.studentId === user.uid));
    });

    const unsubStudent = subscribeToStudent(user.bootcampId, user.uid, setStudentProfile);

    return () => {
      unsubTasks();
      unsubSubs();
      unsubStudent(); // Cleanup
    };
  }, [user]);

  if (!bootcamp) return null;

  // Find user's status for each task
  const taskStatuses = tasks.map(task => {
    const sub = submissions.find(s => s.taskId === task.id);
    let status = 'todo';
    if (sub) {
      status = sub.status; // 'pending', 'approved', 'rejected'
    }
    return { ...task, userStatus: status };
  });

  const currentLevel = studentProfile?.level || user?.level || 'beginner';

  const availableTasks = taskStatuses.filter(t => t.level === currentLevel);

  const filteredTasks = filter === 'all'
    ? availableTasks
    : availableTasks.filter(t =>
      filter === 'completed' ? t.userStatus === 'approved' :
        filter === 'pending' ? t.userStatus === 'pending' :
          t.userStatus === 'todo' || t.userStatus === 'rejected'
    );

  return (
    <div className={styles.container}>
      <SocietyBackground society={bootcamp.society} customColor={bootcamp.colorTheme?.primary} />

      <div className={styles.header}>
        <div>
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => router.push('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1 className={styles.title}>My Tasks</h1>
          <p className={styles.subtitle}>Complete tasks to earn points and climb the leaderboard</p>
        </div>
      </div>

      <div className={styles.filters}>
        {[
          { id: 'all', label: 'All Tasks' },
          { id: 'todo', label: 'To Do' },
          { id: 'pending', label: 'Pending Review' },
          { id: 'completed', label: 'Completed' },
        ].map(f => (
          <button
            key={f.id}
            className={`${styles.filterBtn} ${filter === f.id ? styles.filterActive : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {filteredTasks.length === 0 ? (
          <GlassCard hover={false} padding="xl">
            <div className="empty-state">
              <span className="empty-state-icon">📋</span>
              <h3>No tasks found</h3>
              <p className="empty-state-text">You do not have any tasks in this category.</p>
            </div>
          </GlassCard>
        ) : (
          filteredTasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard
                padding="lg"
                hover={true}
                onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
              >
                <div className={styles.taskCard}>
                  <div className={styles.taskHeader}>
                    <div>
                      <h3 className={styles.taskTitle}>{task.title}</h3>
                      <div className={styles.badges}>
                        <span className={`badge ${task.level === 'advanced' ? 'badge-danger' :
                          task.level === 'intermediate' ? 'badge-warning' : 'badge-success'
                          }`}>
                          {task.level}
                        </span>
                        {task.userStatus === 'approved' && <span className="badge badge-success">Completed</span>}
                        {task.userStatus === 'pending' && <span className="badge badge-warning">Under Review</span>}
                        {task.userStatus === 'rejected' && <span className="badge badge-danger">Needs Work</span>}
                      </div>
                    </div>
                    <div className={styles.points}>🏆 {task.points} pts</div>
                  </div>

                  <p className={styles.taskDesc}>{task.description}</p>

                  <div className={styles.taskFooter}>
                    <span className={styles.startBtn}>
                      {task.userStatus === 'todo' ? 'Start Task →' :
                        task.userStatus === 'rejected' ? 'Retry Task →' : 'View Task →'}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
