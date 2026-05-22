/**
 * Authentication Helpers
 * Handles login, signup, role verification, and session management.
 */

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

/**
 * Sign in with email and password
 */
export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const userData = await getUserProfile(userCredential.user.uid);
  return { ...userCredential.user, ...userData };
}

/**
 * Sign in with Google Popup
 */
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const userData = await getUserProfile(result.user.uid);
  
  // If the user profile doesn't exist, they are not registered as an admin/volunteer
  if (!userData) {
    await signOut(auth);
    throw new Error('No registered admin or volunteer account found for this Google email.');
  }
  
  return { ...result.user, ...userData };
}

/**
 * Sign out current user
 */
export async function logoutUser() {
  await signOut(auth);
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid) {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;
  return { id: userDoc.id, ...userDoc.data() };
}

/**
 * Create a new user account (used by admin/volunteer to create accounts)
 * Note: This creates both Firebase Auth account and Firestore profile.
 * For creating users without signing out the current admin, we use the 
 * Firebase Admin SDK approach via API route.
 */
export async function createUserProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Listen to auth state changes
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userData = await getUserProfile(user.uid);
        callback({ ...user, ...userData });
      } catch (err) {
        console.error('Failed to get user profile:', err);
        callback({ ...user, role: 'unknown', error: 'permissions-denied' });
      }
    } else {
      callback(null);
    }
  });
}

/**
 * Check if user has required role
 */
export function hasRole(user, requiredRole) {
  if (!user) return false;
  if (requiredRole === 'admin') return user.role === 'admin';
  if (requiredRole === 'volunteer') return user.role === 'volunteer' || user.role === 'admin';
  if (requiredRole === 'student') return user.role === 'student';
  return false;
}
