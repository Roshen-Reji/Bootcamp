# IEEE Bootcamp Management Platform

A comprehensive, multi-portal web application designed to manage, assign, and track tasks for IEEE Bootcamps. The system is divided into two completely independent and self-contained Next.js portals connected to a unified Firebase backend.

---

## 🔗 GitHub Repositories

This platform is hosted across two separate GitHub repositories for independent version control, CI/CD, and Vercel deployments:

1. 👑 **[IEEE Bootcamp Admin Portal](https://github.com/YOUR_GITHUB_USERNAME/ieee-bootcamp-admin)** (Managed under `admin-portal/`)
2. 🎓 **[IEEE Bootcamp Student Portal](https://github.com/YOUR_GITHUB_USERNAME/ieee-bootcamp-student)** (Managed under `student-portal/`)

---

## 🏗 System Architecture

The platform consists of two standalone Next.js 14 applications:

1. **`admin-portal`** (Port 3000): 
   - Used by the Main Admin and Volunteers.
   - **Admin Features:** Create Bootcamps, manage users (creating students & volunteers), build hierarchical task structures (Core Tasks -> Tutorials -> Subtasks), and configure team-based learning.
   - **Volunteer Features:** Review student submissions, assign points, and track student progress.
   - **GitHub Repo:** `https://github.com/YOUR_GITHUB_USERNAME/ieee-bootcamp-admin`
2. **`student-portal`** (Port 3001):
   - Used exclusively by Students.
   - Features a dynamic, themeable dashboard based on the student's IEEE Society.
   - **Features:** Real-time Leaderboard, "Up Next" AI task recommendations, an integrated Monaco Code Editor for in-browser coding, and multimedia tutorial viewing.
   - **GitHub Repo:** `https://github.com/YOUR_GITHUB_USERNAME/ieee-bootcamp-student`

Both portals are fully modularized and contain their own copies of shared constants inside their respective `src/shared` directories, allowing them to be developed, updated, and deployed completely independently.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed.
- A Google Firebase Account.

### 1. Firebase Setup
You must create a Firebase project and enable the necessary services:
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Go to **Build -> Authentication** and enable the **Email/Password** sign-in provider. *(Important: Without this, you cannot log in or create users).*
3. Go to **Build -> Firestore Database** and click **Create Database**. Start in **Test Mode** for local development.

### 2. Environment Variables
Both portals require `.env.local` files to connect to Firebase.
- Locate the `.env.local` files in both the `admin-portal` and `student-portal` directories.
- Paste your Firebase Web App configuration into the `NEXT_PUBLIC_...` variables in **both** files.
- For the `admin-portal` only, generate a Service Account Private Key from **Project Settings -> Service Accounts** and paste the Client Email and Private Key into the variables at the bottom of the file.

### 3. Creating Your First Admin Account
Because the platform is secure, you cannot simply "sign up" for an admin account on the website. You must create the first user manually:
1. Go to your Firebase Console -> **Authentication** -> **Users** tab.
2. Click **Add User**.
3. Set the email to: `admin@ieee.org`
4. Set the password to: `AdminPassword123!`
5. Go to your **Firestore Database**.
6. Create a collection named `users`.
7. Add a document where the **Document ID** is exactly the UID of the user you just created in Authentication.
8. Add the following fields to the document:
   - `email` (string): `admin@ieee.org`
   - `role` (string): `admin`
   - `displayName` (string): `Super Admin`

You can now log into the Admin Portal using `admin@ieee.org` / `AdminPassword123!`. Once logged in, you can create Bootcamps, Volunteers, and Students directly from the UI without doing this manually again!

### 4. Running the Servers
Open two separate terminal windows.

**Terminal 1 (Admin):**
```bash
cd admin-portal
npm install
npm run dev
```
Visit the Admin Portal at: `http://localhost:3000/` (Use an Incognito window if your browser tries to redirect you to `/dashboard`).

**Terminal 2 (Student):**
```bash
cd student-portal
npm install
npm run dev -- -p 3001
```
Visit the Student Portal at: `http://localhost:3001/dashboard`

---

## 🎨 Design & Theming
The platform uses a dynamic Glassmorphism UI. The UI automatically adapts based on the active Bootcamp's IEEE Society (e.g., Computer Society gets a blue theme with a falling "Code Rain" background animation, while Robotics gets a red circuit board theme).

Built with Framer Motion, Next.js App Router, and Firebase.
