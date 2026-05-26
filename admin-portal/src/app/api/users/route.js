import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { authAdmin, dbAdmin } from '@/lib/firebaseAdmin';
import { isRealEmailDomain } from '@/lib/emailValidator';

export async function POST(request) {
  try {
    const data = await request.json();
    const { email, password, displayName, role, bootcampId, volunteerId, teamId, level } = data;

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate email domain has real MX records
    const emailCheck = await isRealEmailDomain(email);
    if (!emailCheck.valid) {
      return NextResponse.json({ error: emailCheck.message }, { status: 400 });
    }

    let userRecord;
    try {
      // Create user in Firebase Auth
      userRecord = await authAdmin.createUser({
        email,
        password,
        displayName,
      });
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        userRecord = await authAdmin.getUserByEmail(email);
        // Optionally update their password if provided? The user might just want to add them.
        // We'll leave the password alone since they already have an account.
      } else {
        throw err;
      }
    }

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

    const userDocRef = dbAdmin.collection('users').doc(uid);
    const userDoc = await userDocRef.get();
    let existingBootcampId = null;
    if (userDoc.exists) {
      existingBootcampId = userDoc.data().bootcampId;
    }

    // Root users collection for auth routing
    const updatePayload = { ...userData };
    if (bootcampId) {
      const bootcampsToAdd = [bootcampId];
      if (existingBootcampId && existingBootcampId !== bootcampId) {
        bootcampsToAdd.push(existingBootcampId);
      }
      updatePayload.activeBootcamps = admin.firestore.FieldValue.arrayUnion(...bootcampsToAdd);
    }
    await userDocRef.set(updatePayload, { merge: true });

    // Specific bootcamp subcollections
    if (bootcampId) {
      if (role === 'volunteer') {
        await dbAdmin.collection('bootcamps').doc(bootcampId).collection('volunteers').doc(uid).set({
          uid,
          email,
          displayName,
          createdAt: new Date(),
        }, { merge: true });
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
        }, { merge: true });
        
        // Init leaderboard entry
        await dbAdmin.collection('bootcamps').doc(bootcampId).collection('leaderboard').doc(uid).set({
          type: 'student',
          displayName,
          teamId: teamId || null,
          totalPoints: 0,
          lastUpdated: new Date(),
        }, { merge: true });
      }
    }

    return NextResponse.json({ success: true, uid }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const bootcampId = searchParams.get('bootcampId');
    const role = searchParams.get('role');

    if (!uid || !bootcampId || !role) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (role === 'volunteer') {
      await dbAdmin.collection('bootcamps').doc(bootcampId).collection('volunteers').doc(uid).delete();
    } else if (role === 'student') {
      await dbAdmin.collection('bootcamps').doc(bootcampId).collection('students').doc(uid).delete();
      await dbAdmin.collection('bootcamps').doc(bootcampId).collection('leaderboard').doc(uid).delete();
    }

    // Remove from activeBootcamps
    try {
      await dbAdmin.collection('users').doc(uid).update({
        activeBootcamps: admin.firestore.FieldValue.arrayRemove(bootcampId)
      });
    } catch (e) {
      console.warn('Could not update activeBootcamps for user', uid, e.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user from bootcamp:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

