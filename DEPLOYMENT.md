# Deployment Guide

## Problem
On Vercel, the frontend shows "Failed to load sessions" because it's trying to connect to `localhost:8000`, which doesn't exist in production.

## Solution

### Option 1: Deploy Backend to Render (Recommended)

1. **Create a Render account** at https://render.com

2. **Deploy the FastAPI backend**:
   - Go to Render Dashboard → New → Web Service
   - Connect your GitHub repository
   - Configure:
     - **Root Directory**: `backend`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
     - **Environment**: Python 3
   - Add environment variable:
     - `DATABASE_URL`: (if using database)

3. **Copy your backend URL** (e.g., `https://your-app.onrender.com`)

4. **Configure Vercel Environment Variable**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-app.onrender.com`
   - Redeploy your Vercel app

### Option 2: Deploy Backend to Railway

1. Visit https://railway.app
2. New Project → Deploy from GitHub
3. Select your repo and set root directory to `backend`
4. Railway will auto-detect FastAPI and deploy
5. Copy the generated URL
6. Add `VITE_API_URL` to Vercel as above

### Option 3: Use Vercel Serverless Functions (Advanced)

Convert your FastAPI backend to Vercel serverless functions. This requires restructuring the backend code.

## Current Configuration

- **Local Development**: Uses `http://localhost:8000` (from `.env.local`)
- **Production**: Uses environment variable `VITE_API_URL` (set in Vercel)

## Testing Locally

```bash
# Frontend
npm run dev

# Backend
cd backend
python main.py
```

## Vercel Configuration

Make sure you have these environment variables in Vercel:
- `VITE_API_URL`: Your deployed backend URL

After setting the environment variable, redeploy your Vercel app.
