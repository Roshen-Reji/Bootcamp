/**
 * Firestore Database Helpers
 * All CRUD operations for bootcamps, tasks, tutorials, users, submissions, etc.
 */

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  increment,
  limit,
  startAfter,
} from 'firebase/firestore';
import { db } from './firebase';

// ==================== BOOTCAMPS ====================

export async function createBootcamp(data) {
  const docRef = await addDoc(collection(db, 'bootcamps'), {
    ...data,
    status: 'active',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getBootcamp(bootcampId) {
  const docSnap = await getDoc(doc(db, 'bootcamps', bootcampId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

export async function getBootcampsByIds(bootcampIds) {
  if (!bootcampIds || bootcampIds.length === 0) return [];
  // Use Promise.all to fetch multiple bootcamps (avoids 10-item limit of 'in' queries)
  const promises = bootcampIds.map(id => getDoc(doc(db, 'bootcamps', id)));
  const snaps = await Promise.all(promises);
  return snaps.filter(snap => snap.exists()).map(snap => ({ id: snap.id, ...snap.data() }));
}

export async function getAllBootcamps() {
  const snap = await getDocs(query(collection(db, 'bootcamps'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateBootcamp(bootcampId, data) {
  await updateDoc(doc(db, 'bootcamps', bootcampId), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteBootcamp(bootcampId) {
  await deleteDoc(doc(db, 'bootcamps', bootcampId));
}

export function subscribeToBootcamps(callback) {
  return onSnapshot(
    query(collection(db, 'bootcamps'), orderBy('createdAt', 'desc')),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

// ==================== VOLUNTEERS ====================

export async function addVolunteer(bootcampId, data) {
  const docRef = await addDoc(collection(db, 'bootcamps', bootcampId, 'volunteers'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getVolunteers(bootcampId) {
  const snap = await getDocs(
    query(collection(db, 'bootcamps', bootcampId, 'volunteers'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function subscribeToVolunteers(bootcampId, callback) {
  return onSnapshot(
    query(collection(db, 'bootcamps', bootcampId, 'volunteers'), orderBy('createdAt', 'desc')),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export async function deleteVolunteer(bootcampId, volunteerId) {
  await deleteDoc(doc(db, 'bootcamps', bootcampId, 'volunteers', volunteerId));
}

// ==================== STUDENTS ====================

export async function addStudent(bootcampId, data) {
  const docRef = await addDoc(collection(db, 'bootcamps', bootcampId, 'students'), {
    ...data,
    totalPoints: 0,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getStudents(bootcampId) {
  const snap = await getDocs(
    query(collection(db, 'bootcamps', bootcampId, 'students'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getPaginatedStudents(bootcampId, pageSize = 10, lastVisible = null) {
  let constraints = [orderBy('createdAt', 'desc')];
  if (lastVisible) constraints.push(startAfter(lastVisible));
  constraints.push(limit(pageSize));

  const snap = await getDocs(
    query(collection(db, 'bootcamps', bootcampId, 'students'), ...constraints)
  );
  
  return {
    data: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    lastVisible: snap.docs[snap.docs.length - 1] || null
  };
}

export async function getStudentsByVolunteer(bootcampId, volunteerId) {
  const snap = await getDocs(
    query(
      collection(db, 'bootcamps', bootcampId, 'students'),
      where('volunteerId', '==', volunteerId),
      orderBy('createdAt', 'desc')
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function subscribeToStudents(bootcampId, callback) {
  return onSnapshot(
    query(collection(db, 'bootcamps', bootcampId, 'students'), orderBy('createdAt', 'desc')),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export async function updateStudent(bootcampId, studentId, data) {
  const batch = writeBatch(db);

  // 1. Update the student document within the specific bootcamp
  const studentRef = doc(db, 'bootcamps', bootcampId, 'students', studentId);
  batch.update(studentRef, data);

  // 2. Sync global properties (like 'level') to the root users collection
  // so the AuthContext and Student Dashboard pick up the change immediately
  if (data.level) {
    const userRef = doc(db, 'users', studentId);
    batch.update(userRef, { level: data.level });
  }

  await batch.commit();
}

export async function deleteStudent(bootcampId, studentId) {
  await deleteDoc(doc(db, 'bootcamps', bootcampId, 'students', studentId));
}

export async function updateOwnBootcampProfile(bootcampId, uid, role, data) {
  const batch = writeBatch(db);

  if (role === 'student') {
    batch.set(doc(db, 'bootcamps', bootcampId, 'students', uid), data, { merge: true });
    if (data.displayName) {
      batch.set(
        doc(db, 'bootcamps', bootcampId, 'leaderboard', uid),
        { displayName: data.displayName, lastUpdated: serverTimestamp() },
        { merge: true }
      );
    }
  }

  if (role === 'volunteer') {
    batch.set(doc(db, 'bootcamps', bootcampId, 'volunteers', uid), data, { merge: true });
  }

  await batch.commit();
}

// ==================== TEAMS ====================

export async function createTeam(bootcampId, data) {
  const docRef = await addDoc(collection(db, 'bootcamps', bootcampId, 'teams'), {
    ...data,
    totalPoints: 0,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getTeams(bootcampId) {
  const snap = await getDocs(
    query(collection(db, 'bootcamps', bootcampId, 'teams'), orderBy('name'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function subscribeToTeams(bootcampId, callback) {
  return onSnapshot(
    query(collection(db, 'bootcamps', bootcampId, 'teams'), orderBy('totalPoints', 'desc')),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

// ==================== TASKS (Core) ====================

export async function createTask(bootcampId, data) {
  const docRef = await addDoc(collection(db, 'bootcamps', bootcampId, 'tasks'), {
    ...data,
    type: 'core',
    status: 'active',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getTasks(bootcampId) {
  const snap = await getDocs(
    query(
      collection(db, 'bootcamps', bootcampId, 'tasks'),
      orderBy('createdAt', 'desc')
    )
  );
  const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return tasks.filter(t => t.status === 'active');
}

export async function getPaginatedTasks(bootcampId, pageSize = 10, lastVisible = null) {
  let constraints = [
    orderBy('createdAt', 'desc')
  ];
  if (lastVisible) constraints.push(startAfter(lastVisible));
  constraints.push(limit(pageSize));

  const snap = await getDocs(
    query(collection(db, 'bootcamps', bootcampId, 'tasks'), ...constraints)
  );
  
  const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return {
    data: tasks.filter(t => t.status === 'active'),
    lastVisible: snap.docs[snap.docs.length - 1] || null
  };
}

export function subscribeToTasks(bootcampId, callback) {
  return onSnapshot(
    query(
      collection(db, 'bootcamps', bootcampId, 'tasks'),
      orderBy('createdAt', 'desc')
    ),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export async function updateTask(bootcampId, taskId, data) {
  await updateDoc(doc(db, 'bootcamps', bootcampId, 'tasks', taskId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(bootcampId, taskId) {
  await updateDoc(doc(db, 'bootcamps', bootcampId, 'tasks', taskId), {
    status: 'archived',
  });
}
export function subscribeToStudent(bootcampId, studentId, callback) {
  return onSnapshot(
    doc(db, 'bootcamps', bootcampId, 'students', studentId),
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() });
      }
    }
  );
}

// ==================== TUTORIALS (Child of Task) ====================

export async function createTutorial(bootcampId, taskId, data) {
  const docRef = await addDoc(
    collection(db, 'bootcamps', bootcampId, 'tasks', taskId, 'tutorials'),
    { ...data, createdAt: serverTimestamp() }
  );
  return docRef.id;
}

export async function getTutorials(bootcampId, taskId) {
  const snap = await getDocs(
    query(
      collection(db, 'bootcamps', bootcampId, 'tasks', taskId, 'tutorials'),
      orderBy('order', 'asc')
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function subscribeToTutorials(bootcampId, taskId, callback) {
  return onSnapshot(
    query(
      collection(db, 'bootcamps', bootcampId, 'tasks', taskId, 'tutorials'),
      orderBy('order', 'asc')
    ),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export async function updateTutorial(bootcampId, taskId, tutorialId, data) {
  await updateDoc(
    doc(db, 'bootcamps', bootcampId, 'tasks', taskId, 'tutorials', tutorialId),
    data
  );
}

export async function deleteTutorial(bootcampId, taskId, tutorialId) {
  await deleteDoc(
    doc(db, 'bootcamps', bootcampId, 'tasks', taskId, 'tutorials', tutorialId)
  );
}

// ==================== SUBTASKS (Child of Task, linked to Tutorial) ====================

export async function createSubtask(bootcampId, taskId, data) {
  const docRef = await addDoc(
    collection(db, 'bootcamps', bootcampId, 'tasks', taskId, 'subtasks'),
    { ...data, createdAt: serverTimestamp() }
  );
  return docRef.id;
}

export async function getSubtasks(bootcampId, taskId) {
  const snap = await getDocs(
    query(
      collection(db, 'bootcamps', bootcampId, 'tasks', taskId, 'subtasks'),
      orderBy('order', 'asc')
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function subscribeToSubtasks(bootcampId, taskId, callback) {
  return onSnapshot(
    query(
      collection(db, 'bootcamps', bootcampId, 'tasks', taskId, 'subtasks'),
      orderBy('order', 'asc')
    ),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export async function updateSubtask(bootcampId, taskId, subtaskId, data) {
  await updateDoc(
    doc(db, 'bootcamps', bootcampId, 'tasks', taskId, 'subtasks', subtaskId),
    data
  );
}

export async function deleteSubtask(bootcampId, taskId, subtaskId) {
  await deleteDoc(
    doc(db, 'bootcamps', bootcampId, 'tasks', taskId, 'subtasks', subtaskId)
  );
}

// ==================== SUBMISSIONS ====================

export async function createSubmission(bootcampId, data) {
  const docRef = await addDoc(collection(db, 'bootcamps', bootcampId, 'submissions'), {
    ...data,
    status: 'pending',
    pointsAwarded: 0,
    submittedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getSubmissions(bootcampId, filters = {}) {
  let q = collection(db, 'bootcamps', bootcampId, 'submissions');
  const constraints = [orderBy('submittedAt', 'desc')];

  const snap = await getDocs(query(q, ...constraints));
  let submissions = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (filters.taskId) submissions = submissions.filter(s => s.taskId === filters.taskId);
  if (filters.studentId) submissions = submissions.filter(s => s.studentId === filters.studentId);
  if (filters.status) submissions = submissions.filter(s => s.status === filters.status);

  return submissions;
}

export async function getPaginatedSubmissions(bootcampId, filters = {}, pageSize = 10, lastVisible = null) {
  const constraints = [orderBy('submittedAt', 'desc')];

  if (lastVisible) constraints.push(startAfter(lastVisible));
  constraints.push(limit(pageSize));

  const snap = await getDocs(
    query(collection(db, 'bootcamps', bootcampId, 'submissions'), ...constraints)
  );
  
  let submissions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  if (filters.taskId) submissions = submissions.filter(s => s.taskId === filters.taskId);
  if (filters.studentId) submissions = submissions.filter(s => s.studentId === filters.studentId);
  if (filters.status) submissions = submissions.filter(s => s.status === filters.status);

  return {
    data: submissions,
    lastVisible: snap.docs[snap.docs.length - 1] || null
  };
}

export function subscribeToSubmissions(bootcampId, callback, filters = {}) {
  let constraints = [orderBy('submittedAt', 'desc')];

  return onSnapshot(
    query(collection(db, 'bootcamps', bootcampId, 'submissions'), ...constraints),
    (snap) => {
      let submissions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (filters.taskId) submissions = submissions.filter(s => s.taskId === filters.taskId);
      if (filters.studentId) submissions = submissions.filter(s => s.studentId === filters.studentId);
      if (filters.status) submissions = submissions.filter(s => s.status === filters.status);
      
      callback(submissions);
    }
  );
}

export async function reviewSubmission(bootcampId, submissionId, reviewData) {
  const submissionRef = doc(db, 'bootcamps', bootcampId, 'submissions', submissionId);
  const submissionDoc = await getDoc(submissionRef);

  if (!submissionDoc.exists()) return;
  const submission = submissionDoc.data();
  const wasApproved = submission.status === 'approved';
  const isApproving = reviewData.status === 'approved';
  const shouldAwardPoints = isApproving && !wasApproved && (reviewData.pointsAwarded || 0) > 0;

  const batch = writeBatch(db);

  batch.update(submissionRef, {
    ...reviewData,
    reviewedAt: serverTimestamp(),
  });

  if (shouldAwardPoints) {
    const studentRef = doc(db, 'bootcamps', bootcampId, 'students', submission.studentId);
    batch.update(studentRef, {
      totalPoints: increment(reviewData.pointsAwarded),
    });

    // Update leaderboard entry
    const leaderboardRef = doc(db, 'bootcamps', bootcampId, 'leaderboard', submission.studentId);
    const lbDoc = await getDoc(leaderboardRef);
    if (lbDoc.exists()) {
      batch.update(leaderboardRef, {
        totalPoints: increment(reviewData.pointsAwarded),
        lastUpdated: serverTimestamp(),
      });
    }
  }

  await batch.commit();
}

// ==================== LEADERBOARD ====================

export function subscribeToLeaderboard(bootcampId, callback) {
  return onSnapshot(
    query(
      collection(db, 'bootcamps', bootcampId, 'leaderboard'),
      orderBy('totalPoints', 'desc')
    ),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export async function initLeaderboardEntry(bootcampId, entityId, data) {
  await setDoc(doc(db, 'bootcamps', bootcampId, 'leaderboard', entityId), {
    ...data,
    totalPoints: 0,
    lastUpdated: serverTimestamp(),
  });
}
