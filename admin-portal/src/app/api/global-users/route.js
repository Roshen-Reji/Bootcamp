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
