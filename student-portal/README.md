# IEEE Bootcamp - Student Portal

A modern, highly immersive Next.js 14 web application designed for students participating in IEEE Bootcamps to learn, code, and track their progress in real-time.

## 🔗 GitHub Repository
* **Repository URL:** `https://github.com/YOUR_GITHUB_USERNAME/ieee-bootcamp-student`

---

## ✨ Features

- 🎭 **Dynamic Themeable UI:** The interface shifts glassmorphism themes instantly based on the active Bootcamp's IEEE Society (e.g., Computer Society gets an interactive blue falling "Code Rain", while Robotics gets a sleek red design).
- 🏆 **Real-time Leaderboard:** Track and view rank standings of all bootcamp students instantly.
- 🤖 **"Up Next" AI Recommendations:** Tailored task recommendations recommending the best next tutorial/subtask depending on student's current proficiency level.
- 💻 **Integrated Monaco Code Editor:** Write, edit, and compile code in-browser directly within subtask pages.
- 📺 **Multimedia Learning Hub:** Seamlessly view task instructions, YouTube tutorial videos, and reference links directly inside the dashboard.

---

## 🛠️ Step-by-Step GitHub Setup

Follow these commands to push this portal as a **standalone** repository on GitHub:

1. Open your terminal and navigate to the `student-portal` directory:
   ```bash
   cd student-portal
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
   git commit -m "Initial commit of IEEE Bootcamp Student Portal"
   ```
5. Create your repository on GitHub named `ieee-bootcamp-student`.
6. Link and push to your new remote repository:
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ieee-bootcamp-student.git
   git branch -M main
   git push -u origin main
   ```

---

## 🚀 Getting Started

### 📋 Prerequisites
- Node.js 18+ installed.
- Firebase Account and Web App credentials.

### 🔑 Configuration
Create a `.env.local` file in the root of the `student-portal` folder and fill in the following credentials:

```env
# Firebase Client SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
```

### 💻 Running Locally
Install the dependencies and start the dev server (configured to run on port 3001 to prevent conflicts with the admin portal):
```bash
npm install
npm run dev -- -p 3001
```
Open [http://localhost:3001/dashboard](http://localhost:3001/dashboard) to view it.

---

## ☁️ Vercel Deployment

Deploying the standalone Student Portal to Vercel is extremely straightforward:
1. Go to the **Vercel Dashboard** and click **Add New > Project**.
2. Import the `ieee-bootcamp-student` repository.
3. Keep the **Root Directory** as the root (`./`) since it is a standalone repository.
4. Add all environment variables from `.env.local` to the Vercel dashboard.
5. Click **Deploy**.
6. Register the production URL under your **Firebase Console > Authentication > Settings > Authorized Domains**.
