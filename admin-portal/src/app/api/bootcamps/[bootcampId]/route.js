import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebaseAdmin';

/**
 * Recursively deletes all documents in a collection.
 */
async function deleteCollection(collectionRef) {
  const snapshot = await collectionRef.get();
  if (snapshot.empty) return;

  const batch = dbAdmin.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}

/**
 * DELETE handler — permanently deletes a bootcamp and all its subcollections.
 */
export async function DELETE(request, { params }) {
  try {
    const { bootcampId } = await params;

    if (!bootcampId) {
      return NextResponse.json({ error: 'Missing bootcampId' }, { status: 400 });
    }

    // Check bootcamp exists
    const bootcampDoc = await dbAdmin.collection('bootcamps').doc(bootcampId).get();
    if (!bootcampDoc.exists) {
      return NextResponse.json({ error: 'Bootcamp not found' }, { status: 404 });
    }

    // Delete all subcollections
    const subcollections = ['students', 'volunteers', 'submissions', 'leaderboard', 'teams'];
    
    for (const sub of subcollections) {
      await deleteCollection(dbAdmin.collection('bootcamps').doc(bootcampId).collection(sub));
    }

    // Delete tasks and their nested tutorials & subtasks
    const tasksSnapshot = await dbAdmin.collection('bootcamps').doc(bootcampId).collection('tasks').get();
    for (const taskDoc of tasksSnapshot.docs) {
      // Delete tutorials under each task
      await deleteCollection(
        dbAdmin.collection('bootcamps').doc(bootcampId).collection('tasks').doc(taskDoc.id).collection('tutorials')
      );
      // Delete subtasks under each task
      await deleteCollection(
        dbAdmin.collection('bootcamps').doc(bootcampId).collection('tasks').doc(taskDoc.id).collection('subtasks')
      );
    }
    // Delete all tasks
    await deleteCollection(dbAdmin.collection('bootcamps').doc(bootcampId).collection('tasks'));

    // Delete the bootcamp document itself
    await dbAdmin.collection('bootcamps').doc(bootcampId).delete();

    return NextResponse.json({ success: true, message: 'Bootcamp and all associated data permanently deleted.' });
  } catch (error) {
    console.error('Error permanently deleting bootcamp:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
