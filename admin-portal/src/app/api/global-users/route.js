import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    let query = dbAdmin.collection('users');
    if (role) {
      query = query.where('role', '==', role);
    }

    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      let createdAt = null;
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate().toISOString();
        } else if (data.createdAt instanceof Date) {
          createdAt = data.createdAt.toISOString();
        } else {
          createdAt = new Date(data.createdAt).toISOString();
        }
      }
      
      return {
        uid: doc.id,
        ...data,
        createdAt
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching global users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { uid, bootcampId } = await request.json();

    if (!uid || !bootcampId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    await dbAdmin.collection('users').doc(uid).update({
      bootcampId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating global user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    // Clean up bootcamp subcollections first
    const userDoc = await dbAdmin.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const bootcamps = userData.activeBootcamps || (userData.bootcampId ? [userData.bootcampId] : []);
      const role = userData.role;

      for (const bcId of bootcamps) {
        if (role === 'volunteer') {
          await dbAdmin.collection('bootcamps').doc(bcId).collection('volunteers').doc(uid).delete().catch(() => {});
        } else if (role === 'student') {
          await dbAdmin.collection('bootcamps').doc(bcId).collection('students').doc(uid).delete().catch(() => {});
          await dbAdmin.collection('bootcamps').doc(bcId).collection('leaderboard').doc(uid).delete().catch(() => {});
        }
      }
    }

    // Delete from Firestore
    await dbAdmin.collection('users').doc(uid).delete();
    
    // Delete from Firebase Auth
    const { authAdmin } = await import('@/lib/firebaseAdmin');
    await authAdmin.deleteUser(uid);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting global user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { uid, password } = await request.json();

    if (!uid || !password) {
      return NextResponse.json({ error: 'Missing uid or password' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const { authAdmin } = await import('@/lib/firebaseAdmin');

    // Get user's email to check password reuse
    const userRecord = await authAdmin.getUser(uid);
    
    // Check if new password matches current via Firebase REST API sign-in
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (apiKey) {
      try {
        const signInRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userRecord.email,
              password: password,
              returnSecureToken: false,
            }),
          }
        );
        if (signInRes.ok) {
          return NextResponse.json(
            { error: 'New password must be different from the current password.' },
            { status: 400 }
          );
        }
      } catch (err) {
        console.warn('Password reuse check failed, proceeding:', err.message);
      }
    }

    await authAdmin.updateUser(uid, { password });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating global user password:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

