'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getBootcamp, subscribeToLeaderboard, subscribeToStudents, subscribeToTeams } from '@/lib/db';
import SocietyBackground from '@/components/backgrounds/SocietyBackground';
import GlassCard from '@/components/ui/GlassCard';
import styles from './page.module.css';

export default function LeaderboardPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [bootcamp, setBootcamp] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const loadBc = async () => {
      const bc = await getBootcamp(id);
      if (bc) setBootcamp(bc);
    };
    loadBc();
    
    const unsubLb = subscribeToLeaderboard(id, setLeaderboard);
    const unsubSt = subscribeToStudents(id, setStudents);
    const unsubTm = subscribeToTeams(id, setTeams);
    
    return () => {
      unsubLb();
      unsubSt();
      unsubTm();
    };
  }, [id]);

  if (!bootcamp) return null;

  // Aggregate by team if team mode is enabled
  let finalLeaderboard = [...leaderboard];
  
  if (bootcamp?.teamConfig?.enabled) {
    const teamScores = {};
    
    const studentToTeam = {};
    students.forEach(s => {
      if (s.teamId) studentToTeam[s.uid || s.id] = s.teamId;
    });

    leaderboard.forEach(entry => {
      const teamId = studentToTeam[entry.id];
      if (teamId) {
        teamScores[teamId] = (teamScores[teamId] || 0) + (entry.totalPoints || 0);
      }
    });

    finalLeaderboard = teams.map(team => ({
      id: team.id,
      displayName: team.name,
      totalPoints: teamScores[team.id] || 0,
      type: 'team'
    }));
  }

  // Sorting
  const sortedLeaderboard = finalLeaderboard.sort((a, b) => {
    const pointsA = a.totalPoints || 0;
    const pointsB = b.totalPoints || 0;
    if (pointsA !== pointsB) return pointsB - pointsA;
    return (a.displayName || '').localeCompare(b.displayName || '');
  });

  // Calculate dense ranks
  let currentRank = 1;
  let currentPoints = sortedLeaderboard[0]?.totalPoints ?? -1;
  
  const rankedLeaderboard = sortedLeaderboard.map((entry) => {
    const pts = entry.totalPoints || 0;
    if (pts < currentPoints) {
      currentRank++;
      currentPoints = pts;
    } else if (currentPoints === -1) {
      currentPoints = pts;
    }
    return { ...entry, displayRank: currentRank };
  });

  const getPlaceClass = (rank) => {
    if (rank === 1) return styles.firstPlace;
    if (rank === 2) return styles.secondPlace;
    return styles.thirdPlace;
  };

  const getMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    return '🥉';
  };

  return (
    <div className={styles.container}>
      <SocietyBackground society={bootcamp.society} customColor={bootcamp.colorTheme?.primary} />
      
      <div className={styles.header}>
        <div>
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => router.push(`/admin/bootcamps/${id}`)}>
            ← Back to Dashboard
          </button>
          <h1 className={styles.title}>Leaderboard</h1>
          <p className={styles.subtitle}>Top performers in {bootcamp.name}</p>
        </div>
      </div>

      <div className={styles.podium}>
        {/* Render top 3 if available */}
        {rankedLeaderboard.length >= 2 && (
          <motion.div className={`${styles.podiumItem} ${getPlaceClass(rankedLeaderboard[1].displayRank)}`} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className={styles.podiumAvatar}>{getMedal(rankedLeaderboard[1].displayRank)}</div>
            <div className={styles.podiumBar}>
              <span className={styles.podiumName}>{rankedLeaderboard[1].displayName}</span>
              <span className={styles.podiumPoints}>{rankedLeaderboard[1].totalPoints} pts</span>
            </div>
          </motion.div>
        )}
        
        {rankedLeaderboard.length >= 1 && (
          <motion.div className={`${styles.podiumItem} ${getPlaceClass(rankedLeaderboard[0].displayRank)}`} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className={styles.podiumAvatar}>{getMedal(rankedLeaderboard[0].displayRank)}</div>
            <div className={styles.podiumBar}>
              <span className={styles.podiumName}>{rankedLeaderboard[0].displayName}</span>
              <span className={styles.podiumPoints}>{rankedLeaderboard[0].totalPoints} pts</span>
            </div>
          </motion.div>
        )}

        {rankedLeaderboard.length >= 3 && (
          <motion.div className={`${styles.podiumItem} ${getPlaceClass(rankedLeaderboard[2].displayRank)}`} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className={styles.podiumAvatar}>{getMedal(rankedLeaderboard[2].displayRank)}</div>
            <div className={styles.podiumBar}>
              <span className={styles.podiumName}>{rankedLeaderboard[2].displayName}</span>
              <span className={styles.podiumPoints}>{rankedLeaderboard[2].totalPoints} pts</span>
            </div>
          </motion.div>
        )}
      </div>

      <GlassCard hover={false} padding="lg">
        <div className={styles.list}>
          {rankedLeaderboard.slice(3).map((entry, i) => (
            <motion.div 
              key={entry.id}
              className={styles.listItem}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + (i * 0.05) }}
            >
              <div className={styles.rank}>{entry.displayRank}</div>
              <div className={styles.userInfo}>
                <span className={styles.name}>{entry.displayName}</span>
                {entry.type === 'team' && <span className="badge badge-info">Team</span>}
              </div>
              <div className={styles.points}>{entry.totalPoints || 0} pts</div>
            </motion.div>
          ))}
          {rankedLeaderboard.length <= 3 && (
            <div className="empty-state">
              <p>No more participants to display.</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
