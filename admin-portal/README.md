# IEEE Bootcamp - Admin & Volunteer Portal

A professional Next.js 14 management portal designed for the Main Admin and Volunteers to oversee, configure, and grade the IEEE Bootcamps.

## 🔗 GitHub Repository
* **Repository URL:** `https://github.com/YOUR_GITHUB_USERNAME/ieee-bootcamp-admin`

---

## ✨ Features

### 👑 Admin Features
- **Bootcamp Management:** Create, configure, and archive bootcamps with unique custom color themes and society branding (Computer Society, Robotics, etc.).
- **User Provisioning:** Instantly create and manage Volunteers and Students directly from the UI.
- **Hierarchical Tasks:** Design comprehensive paths for students:
  `Core Task` ➔ `Tutorials` ➔ `Level-Specific Subtasks` (Beginner, Intermediate, Advanced).
- **Team Configuration:** Toggle team-based learning options and group students dynamically.

### 🛡️ Volunteer Features
- **Submission Tracking:** Review real-time student task submissions.
- **Subtask Insight:** Deep-dive into detailed student submissions including links, code snippets, and comments.
- **Grading & Feedback:** Grade task submissions, award points, and provide constructive feedback.

---

## 🛠️ Step-by-Step GitHub Setup

Follow these commands to push this portal as a **standalone** repository on GitHub:

1. Open your terminal and navigate to the `admin-portal` directory:
   ```bash
   cd admin-portal
   ```
2. Initialize a new Git repository:
   ```bash
   git init
   ```
3. Add the files to staging:
   ```bash
   git add .
   ```
4. Commit your changes:
   ```bash
   git commit -m "Initial commit of IEEE Bootcamp Admin Portal"
   ```
5. Create your repository on GitHub named `ieee-bootcamp-admin`.
6. Link and push to your new remote repository:
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ieee-bootcamp-admin.git
   git branch -M main
   git push -u origin main
   ```

---

## 🚀 Getting Started

### 📋 Prerequisites
- Node.js 18+ installed.
- Firebase Account and Web App credentials.
- Firebase Admin SDK Service Account.

### 🔑 Configuration
Create a `.env.local` file in the root of the `admin-portal` folder and fill in the following credentials:

```env
# Firebase Client SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID

# Firebase Admin SDK Configuration
FIREBASE_CLIENT_EMAIL=YOUR_SERVICE_ACCOUNT_EMAIL
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### 💻 Running Locally
Install the dependencies and start the dev server:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view it.

---

## ☁️ Vercel Deployment

Deploying the standalone Admin Portal to Vercel is extremely straightforward:
1. Go to the **Vercel Dashboard** and click **Add New > Project**.
2. Import the `ieee-bootcamp-admin` repository.
3. Keep the **Root Directory** as the root (`./`) since it is a standalone repository.
4. Add all environment variables from `.env.local` to the Vercel dashboard.
5. Click **Deploy**.
6. Register the production URL under your **Firebase Console > Authentication > Settings > Authorized Domains**.
