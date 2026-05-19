import { NextResponse } from 'next/server';
import { authAdmin, dbAdmin } from '@/lib/firebaseAdmin';

export async function POST(request) {
  try {
    const data = await request.json();
    const { email, password, displayName, role, bootcampId, volunteerId, teamId, level } = data;

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create user in Firebase Auth
    const userRecord = await authAdmin.createUser({
      email,
      password,
      displayName,
    });

    const uid = userRecord.uid;

    // Create user profile in Firestore
    const userData = {
      email,
      displayName,
      role,
      createdAt: new Date(),
    };

    if (bootcampId) userData.bootcampId = bootcampId;
    if (volunteerId) userData.volunteerId = volunteerId;
    if (teamId) userData.teamId = teamId;
    if (level) userData.level = level;

    // Root users collection for auth routing
    await dbAdmin.collection('users').doc(uid).set(userData);

    // Specific bootcamp subcollections
    if (bootcampId) {
      if (role === 'volunteer') {
        await dbAdmin.collection('bootcamps').doc(bootcampId).collection('volunteers').doc(uid).set({
          uid,
          email,
          displayName,
          createdAt: new Date(),
        });
      } else if (role === 'student') {
        await dbAdmin.collection('bootcamps').doc(bootcampId).collection('students').doc(uid).set({
          uid,
          email,
          displayName,
          volunteerId: volunteerId || null,
          teamId: teamId || null,
          level: level || 'beginner',
          totalPoints: 0,
          createdAt: new Date(),
        });
        
        // Init leaderboard entry
        await dbAdmin.collection('bootcamps').doc(bootcampId).collection('leaderboard').doc(uid).set({
          type: 'student',
          displayName,
          teamId: teamId || null,
          totalPoints: 0,
          lastUpdated: new Date(),
        });
      }
    }

    return NextResponse.json({ success: true, uid }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
