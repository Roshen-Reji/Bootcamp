'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { getBootcamp, subscribeToLeaderboard } from '@/lib/db';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import GlassCard from '@/components/ui/GlassCard';
import styles from './page.module.css';

export default function StudentLeaderboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [bootcamp, setBootcamp] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (!user?.bootcampId) return;

    const loadBc = async () => {
      const bc = await getBootcamp(user.bootcampId);
      if (bc) setBootcamp(bc);
    };
    loadBc();

    const unsub = subscribeToLeaderboard(user.bootcampId, setLeaderboard);
    return () => unsub();
  }, [user]);

  if (!bootcamp) return null;

  // Sorting
  const sortedLeaderboard = [...leaderboard].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));

  // Find current user's rank
  const myEntry = sortedLeaderboard.find(entry => entry.id === user?.uid);
  const myRank = myEntry ? sortedLeaderboard.indexOf(myEntry) + 1 : 0;
  const myPoints = myEntry?.totalPoints || 0;

  return (
    <div className={styles.container}>
      <SocietyBackground society={bootcamp.society} customColor={bootcamp.colorTheme?.primary} />

      <div className={styles.header}>
        <div>
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => router.push('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1 className={styles.title}>Leaderboard</h1>
          <p className={styles.subtitle}>See how you stack up against the competition</p>
        </div>
      </div>

      <div className={styles.podium}>
        {sortedLeaderboard.length >= 2 && (
          <motion.div className={`${styles.podiumItem} ${styles.secondPlace}`} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className={styles.podiumAvatar}>🥈</div>
            <div className={styles.podiumBar}>
              <span className={styles.podiumName}>{sortedLeaderboard[1].displayName}</span>
              <span className={styles.podiumPoints}>{sortedLeaderboard[1].totalPoints} pts</span>
            </div>
          </motion.div>
        )}

        {sortedLeaderboard.length >= 1 && (
          <motion.div className={`${styles.podiumItem} ${styles.firstPlace}`} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className={styles.podiumAvatar}>🥇</div>
            <div className={styles.podiumBar}>
              <span className={styles.podiumName}>{sortedLeaderboard[0].displayName}</span>
              <span className={styles.podiumPoints}>{sortedLeaderboard[0].totalPoints} pts</span>
            </div>
          </motion.div>
        )}

        {sortedLeaderboard.length >= 3 && (
          <motion.div className={`${styles.podiumItem} ${styles.thirdPlace}`} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className={styles.podiumAvatar}>🥉</div>
            <div className={styles.podiumBar}>
              <span className={styles.podiumName}>{sortedLeaderboard[2].displayName}</span>
              <span className={styles.podiumPoints}>{sortedLeaderboard[2].totalPoints} pts</span>
            </div>
          </motion.div>
        )}
      </div>

      <GlassCard hover={false} padding="lg">
        {myRank > 0 && (
          <div className={styles.myRankAlert}>
            <span>You are currently ranked <strong>#{myRank}</strong> with <strong>{myPoints} pts</strong>!</span>
          </div>
        )}

        <div className={styles.list}>
          {sortedLeaderboard.slice(3).map((entry, i) => (
            <motion.div
              key={entry.id}
              className={`${styles.listItem} ${entry.id === user?.uid ? styles.listItemMe : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + (i * 0.05) }}
            >
              <div className={styles.rank}>{i + 4}</div>
              <div className={styles.userInfo}>
                <span className={styles.name}>{entry.displayName} {entry.id === user?.uid && '(You)'}</span>
                {entry.type === 'team' && <span className="badge badge-info">Team</span>}
              </div>
              <div className={styles.points}>{entry.totalPoints || 0} pts</div>
            </motion.div>
          ))}
          {sortedLeaderboard.length <= 3 && (
            <div className="empty-state">
              <p>No more participants to display.</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
