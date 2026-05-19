import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const envConfig = fs.readFileSync('.env.local', 'utf8');
envConfig.split('\n').forEach(line => {
  const match = line.match(/^([^#\s][^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[match[1].trim()] = val;
  }
});

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const auth = getAuth();
const db = getFirestore();

async function createInitialAdmin() {
  const email = 'admin@ieee.org';
  const password = 'AdminPassword123!';
  const displayName = 'Super Admin';

  try {
    console.log(`Checking if ${email} already exists...`);
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('User already exists in Auth.');
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        console.log('Creating new user in Firebase Auth...');
        userRecord = await auth.createUser({
          email,
          password,
          displayName,
        });
        console.log('Successfully created new user:', userRecord.uid);
      } else {
        throw e;
      }
    }

    // Set custom claims (optional but good practice)
    await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });

    // Create Firestore Profile
    console.log('Creating Firestore profile for Admin...');
    await db.collection('users').doc(userRecord.uid).set({
      email,
      displayName,
      role: 'admin',
      createdAt: new Date(),
    });

    console.log('\n======================================');
    console.log('✅ Admin User Created Successfully!');
    console.log('======================================');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('======================================\n');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createInitialAdmin();
