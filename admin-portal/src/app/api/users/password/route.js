// admin-portal/src/app/api/users/password/route.js
import { authAdmin } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

/**
 * Checks if the newPassword matches the user's current password
 * by attempting sign-in via Firebase REST API.
 */
async function isPasswordSame(email, newPassword) {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
        console.warn('Firebase API key not available, skipping password reuse check');
        return false;
    }

    try {
        const res = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password: newPassword,
                    returnSecureToken: false,
                }),
            }
        );

        // If sign-in succeeds, the new password matches the current one
        return res.ok;
    } catch (error) {
        // If the request fails entirely, skip the check
        console.warn('Password comparison check failed:', error.message);
        return false;
    }
}

export async function POST(req) {
    try {
        const { uid, newPassword } = await req.json();

        if (!uid || !newPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Get the user's email to check password reuse
        const userRecord = await authAdmin.getUser(uid);
        
        // Check if new password is same as current
        const isSame = await isPasswordSame(userRecord.email, newPassword);
        if (isSame) {
            return NextResponse.json(
                { error: 'New password must be different from the current password.' },
                { status: 400 }
            );
        }

        // Update password using Firebase Admin SDK
        await authAdmin.updateUser(uid, { password: newPassword });

        return NextResponse.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password Update Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}