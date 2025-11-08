# How to View Results

## Why Results Page is Empty

The results pages show "No session found" because:

1. **Session data is stored in memory (not a database)**
   - When you complete exercises, data is saved in the browser's memory
   - If you refresh the page or close the browser, the data is lost
   - This is temporary storage using Zustand state management

2. **To persist data, you would need:**
   - A database (PostgreSQL, MongoDB, etc.)
   - Browser localStorage (simple but limited)
   - Backend API to save sessions

## How to View Results NOW

### Option 1: Complete a Session (Without Refresh)
1. Go to **Home** page
2. Click **"Start Test"**
3. Complete all 4 exercises:
   - Raise Hand
   - One Leg Balance
   - Walk
   - Jump
4. Wait for "Assessment Complete!" dialog
5. Click **"Parent View"** or **"Clinician View"**
6. ⚠️ **DO NOT REFRESH** the page or you'll lose the data

### Option 2: Load Demo Data
1. Navigate to `/results/parent` or `/results/clinician`
2. You'll see: "No session found"
3. Click the **"Load Demo Data"** button
4. Demo results will appear instantly with sample metrics

### Option 3: Use Mock Data from Home
1. Go to **Home** page
2. Scroll down to utility buttons
3. Click **"Load Demo Results"**
4. You'll be redirected to Parent Results with sample data

## Session Status Indicator

On the **Home** page, if a session is completed:
- You'll see a green box: **"✅ Session Completed!"**
- This means data is in memory and ready to view
- Click "Parent Results" or "Clinician Results" to see it

If you DON'T see this green box:
- No session data is currently stored
- Either complete a session or load demo data

## What Gets Saved

When you complete a session, the following data is stored:

```typescript
{
  sessionId: "SESSION-1234567890",
  childAgeYears: 8,
  startedAt: "2025-11-07T10:00:00Z",
  endedAt: "2025-11-07T10:05:00Z",
  overallRisk: "normal" | "monitor" | "high",
  tasks: [
    {
      task: "raise_hand",
      metrics: { shoulderFlexionMax: 125 }
    },
    {
      task: "one_leg",
      metrics: { holdTime: 6.2, swayIndex: 0.015 }
    },
    {
      task: "walk",
      metrics: { stepCount: 4, symmetryPercent: 92 }
    },
    {
      task: "jump",
      metrics: { 
        jumpHeightPixels: 120,
        jumpHeightCm: 12.5,
        jumpHeightPercent: 9.6
      }
    }
  ]
}
```

## Adding Persistent Storage (Future Enhancement)

### Option 1: Browser localStorage (Simple)
Add to `src/store/session.ts`:
```typescript
// Save to localStorage whenever session changes
persist: {
  name: 'virtual-mirror-session',
  storage: createJSONStorage(() => localStorage),
}
```

### Option 2: Backend Database (Production)
1. Set up a backend API (Node.js + Express)
2. Database (PostgreSQL or MongoDB)
3. Save session on completion
4. Load session by ID from database

### Option 3: Export/Import
- Add "Export as JSON" button (already implemented!)
- Save file to computer
- Add "Import JSON" button to load saved sessions

## Current Workaround

**Best practice for testing:**
1. Open DevTools (F12)
2. Go to Console tab
3. Complete a session
4. Look for: `"✅ Session completed:"` log
5. You'll see all the data in the console
6. Navigate to results WITHOUT refreshing
7. Or click "Load Demo Data" on results pages

## Demo Data Details

The demo data includes:
- Child: 8 years old, 130cm tall, 30kg
- Raise Hand: 125° shoulder flexion (Normal)
- One Leg: 6.2s balance time (Normal)
- Walk: 92% symmetry (Normal)
- Jump: 9.6% of height (Borderline)
- Overall Risk: **Normal**

---

**Quick Summary:**
- ❌ No database = data lost on refresh
- ✅ Use "Load Demo Data" button to test results pages
- ✅ Complete session and view results immediately (no refresh)
- ✅ Check console logs to see session data
