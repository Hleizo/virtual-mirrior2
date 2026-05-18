# Virtual Mirror - Pediatric Motor Assessment System

A web-based application that uses computer vision to assess children's motor skills through real-time pose detection and biomechanical analysis.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11+-green.svg)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🎯 Overview

The **Virtual Mirror** is a pediatric motor assessment tool designed for clinicians, therapists, and healthcare professionals. It uses the device camera to track a child's movements in real-time and provides objective, quantitative metrics for motor skill evaluation.

### What It Does

- **Tracks body movements** using MediaPipe pose detection
- **Evaluates 6 motor tasks**: Raise Hand, One-Leg Stance, Walk, Jump, Tiptoe, Squat
- **Computes biomechanical metrics**: joint angles, symmetry, hold times, compensation patterns
- **Provides real-time feedback** with humanized Arabic voice coaching
- **Generates clinical reports** with pass/partial/fail status and specific failure reasons
- **Stores session history** for longitudinal tracking

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎥 **Real-time Pose Detection** | Tracks 33 body landmarks at 20-30 FPS |
| 📊 **Biomechanical Analysis** | Computes joint angles, symmetry, trunk lean |
| 🗣️ **Arabic Voice Coaching** | Context-aware, humanized feedback during tasks |
| 📈 **Clinician Dashboard** | Detailed metrics, charts, failure explanations |
| 👨‍👩‍👧 **Parent-Friendly Results** | Simplified summary for families |
| 💾 **Session Storage** | PostgreSQL database for history tracking |
| 🌐 **Cross-Platform** | Works on any device with a browser and camera |

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

| Software | Version | Download Link |
|----------|---------|---------------|
| **Node.js** | 18.0 or higher | [nodejs.org](https://nodejs.org/) |
| **Python** | 3.11 or higher | [python.org](https://www.python.org/downloads/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

### Verify Installation

Open a terminal and run:

```bash
# Check Node.js
node --version
# Should output: v18.x.x or higher

# Check npm
npm --version
# Should output: 9.x.x or higher

# Check Python
python --version
# Should output: Python 3.11.x or higher

# Check Git
git --version
```

### Hardware Requirements

- **Camera**: Built-in webcam or USB camera (720p+ recommended)
- **Browser**: Chrome 90+, Edge 90+, Firefox 90+, or Safari 15+
- **Screen**: 1280×720 minimum resolution
- **Internet**: Required for database operations

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/Hleizo/virtual-mirrior2.git
cd "virtual-mirrior2"
```

### Step 2: Install Frontend Dependencies

```bash
npm install
```

This will install all required packages including:
- React 18
- TypeScript
- Vite
- MUI (Material UI)
- Recharts
- MediaPipe

### Step 3: Set Up Backend

```bash
# Navigate to backend folder
cd backend

# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1

# On Windows (Command Prompt):
.\.venv\Scripts\activate.bat

# On macOS/Linux:
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables

#### Backend Configuration

Create a file `backend/.env` with your database credentials:

```env
DATABASE_URL=postgresql://username:password@host:port/database_name
```

If you're using Supabase, run the SQL in `backend/sql/supabase_schema.sql` to create tables.



#### Frontend Configuration (Optional for local development)

Create a file `.env` in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key
```

For production, set this to your deployed backend URL.

---

## ▶️ Running the Application

### Option 1: Run Both Servers (Recommended for Development)

Open **two terminal windows**:

**Terminal 1 - Backend:**
```bash
cd backend
.\.venv\Scripts\Activate.ps1  # Windows
# or: source .venv/bin/activate  # macOS/Linux

python -m uvicorn main_async:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Option 2: Quick Start Commands

**Windows PowerShell:**
```powershell
# Start backend
cd backend; python -m uvicorn main_async:app --reload --port 8000

# In a new terminal, start frontend
npm run dev
```

### Access the Application

Once both servers are running:

| Service | URL |
|---------|-----|
| **Frontend (Main App)** | http://localhost:5173 |
| **Backend API** | http://localhost:8000 |
| **API Documentation** | http://localhost:8000/docs |

---

## 📖 Usage Guide

### Starting a New Assessment Session

1. **Open the app** at http://localhost:5173
2. **Click "Start New Session"** on the home page
3. **Enter child information**:
   - Name
   - Age
   - Height (optional)
   - Weight (optional)
   - Gender (optional)
   - Notes (optional)
4. **Allow camera access** when prompted by the browser
5. **Position the child** so they are fully visible in the camera frame

### Performing Tasks

The app guides through **6 motor tasks** in sequence:

| Task | Instructions | What's Measured |
|------|--------------|-----------------|
| **1. Raise Hand** | Child raises one or both arms overhead | Shoulder flexion angle, elbow extension, symmetry |
| **2. One-Leg Stance** | Child stands on one leg | Balance duration, sway, stability |
| **3. Walk** | Child walks forward | Gait pattern, step count, coordination |
| **4. Jump** | Child jumps up | Jump height, landing quality, knee control |
| **5. Tiptoe** | Child stands on tiptoes | Ankle strength, balance, hold time |
| **6. Squat** | Child performs a squat | Knee/hip flexion, trunk lean, depth |

### Voice Feedback

- The app provides **Arabic voice coaching** during tasks
- Feedback is **context-aware** and responds to actual movements
- Encouragement, corrections, and celebrations are given in real-time

### Viewing Results

After completing all tasks:

1. **Clinician View**: Detailed metrics, charts, pass/fail status, specific failure reasons
2. **Parent View**: Simplified, friendly summary of strengths and areas to watch

### Session History

- Access previous sessions from the **Session History** page
- Compare initial vs follow-up assessments
- Delete sessions if needed

---

## 📁 Project Structure

```
virtual-mirror2/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── CameraFeed.tsx        # Camera display
│   │   ├── CoachOverlay.tsx      # Voice coaching + visual overlay
│   │   ├── PoseDetector.tsx      # MediaPipe integration
│   │   └── ...
│   ├── pages/                    # Page components
│   │   ├── HomePage.tsx          # Landing page
│   │   ├── SessionPageOrchestrator.tsx  # Main session flow
│   │   ├── ClinicianResultsPage.tsx     # Detailed results
│   │   ├── ParentResultsPage.tsx        # Simplified results
│   │   └── ...
│   ├── logic/                    # Task logic
│   │   └── tasks.ts              # Task-specific evaluation
│   ├── utils/                    # Utilities
│   │   ├── kinematics.ts         # Biomechanical calculations
│   │   └── voice.ts              # Speech synthesis
│   ├── services/                 # API communication
│   │   └── api.ts                # Backend API client
│   └── ...
├── backend/                      # Backend source code
│   ├── main_async.py             # FastAPI application
│   ├── models.py                 # Database models
│   ├── schemas.py                # Pydantic schemas
│   ├── crud.py                   # Database operations
│   ├── database.py               # Database connection
│   └── requirements.txt          # Python dependencies
├── public/                       # Static assets
├── package.json                  # Node.js dependencies
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

---

## 🔌 API Documentation

### Base URL

- **Local**: `http://localhost:8000`
- **Production**: Your deployed backend URL

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/sessions` | Create a new session |
| `GET` | `/sessions` | List all sessions |
| `GET` | `/sessions/{id}` | Get session details |
| `DELETE` | `/sessions/{id}` | Delete a session |
| `POST` | `/sessions/{id}/tasks` | Add task results |

### Interactive API Docs

When the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🌐 Deployment

### Frontend (Netlify)

1. Push your code to GitHub
2. Connect your repository to [Netlify](https://netlify.com)
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variable: `VITE_API_BASE_URL` = your backend URL

### Backend (Render)

1. Push your code to GitHub
2. Create a new Web Service on [Render](https://render.com)
3. Set:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main_async:app --host 0.0.0.0 --port $PORT`
4. Add environment variable: `DATABASE_URL` = your PostgreSQL connection string

### Database (Supabase)

1. Create a new Supabase project
2. Run `backend/sql/supabase_schema.sql` in the Supabase SQL editor
3. Copy the PostgreSQL connection string and set `DATABASE_URL` in the backend
4. Copy the project URL and anon key into `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

---

## 🔧 Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| **Camera not working** | Ensure browser has camera permission; try Chrome |
| **"Failed to fetch" error** | Check if backend is running on port 8000 |
| **Pose not detected** | Ensure good lighting; stand further from camera |
| **Voice not playing** | Check browser supports Web Speech API; unmute |
| **Database connection error** | Verify `DATABASE_URL` in `.env` is correct |

### Backend Won't Start

```bash
# Make sure virtual environment is activated
.\.venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt

# Check for port conflicts
netstat -ano | findstr :8000
```

### Frontend Won't Start

```bash
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install

# Clear Vite cache
Remove-Item -Recurse -Force node_modules/.vite
npm run dev
```

### Camera Permission Issues

1. Click the camera icon in the browser address bar
2. Select "Allow" for camera access
3. Refresh the page

---

## 🧪 Running Tests

### Frontend Tests

```bash
npm run test
```

### Backend Tests

```bash
cd backend
python -m pytest
```

---

## 🛠️ Development

### Build for Production

```bash
npm run build
```

### Lint Code

```bash
npm run lint
```

### Type Check

```bash
npx tsc --noEmit
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add my feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 📞 Support

For questions or issues:
- Open an issue on [GitHub](https://github.com/Hleizo/virtual-mirrior2/issues)
- Contact the development team

---

## 🙏 Acknowledgments

- [MediaPipe](https://mediapipe.dev/) for pose detection
- [React](https://react.dev/) and [Vite](https://vitejs.dev/) for the frontend framework
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [MUI](https://mui.com/) for UI components
