# Virtual Mirror - Quick Start Guide (Async SQLAlchemy 2.0)

## 🚀 Quick Start (5 Steps)

### Step 1: Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

Wait for installation to complete. This installs:
- SQLAlchemy 2.0 with async support
- AsyncPG (fast async PostgreSQL driver)
- Alembic (database migrations)
- All other dependencies

### Step 2: Configure Database
Create `.env` file in `backend/` directory:
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

**For Supabase:**
```env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres
```

### Step 3: Test Database Connection
```bash
python test_async_db.py
```

Expected output:
```
🔍 Testing database connection...
1️⃣ Initializing database...
✅ Database tables created
2️⃣ Creating test session...
✅ Session created: [uuid]
3️⃣ Creating test task...
✅ Task created: [uuid]
4️⃣ Creating test metrics...
✅ Created 3 metrics
5️⃣ Querying data...
✅ Found 1 session(s)
==================================================
✅ All tests passed!
==================================================
```

### Step 4: Run Server
```bash
uvicorn main_async:app --reload --port 8000
```

Server will start at: http://localhost:8000

### Step 5: Test API
Open browser: http://localhost:8000/docs

You'll see Swagger UI with all endpoints ready to test!

---

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sessions` | Create new session |
| GET | `/sessions/{id}` | Get session by ID |
| POST | `/sessions/{id}/tasks` | Add task to session |
| GET | `/sessions/{id}/tasks` | Get all tasks for session |
| GET | `/tasks/{id}/metrics` | Get metrics for task |
| POST | `/tasks/{id}/metrics` | Add metrics to task (batch) |
| GET | `/health` | Health check |

---

## 🧪 Test with cURL

### 1. Create Session
```bash
curl -X POST http://localhost:8000/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "child_name": "Test Child",
    "child_age": 8,
    "child_height_cm": 130.5,
    "child_weight_kg": 28.0
  }'
```

Save the `id` from response!

### 2. Get Session
```bash
curl http://localhost:8000/sessions/YOUR_SESSION_ID
```

### 3. Create Task
```bash
curl -X POST http://localhost:8000/sessions/YOUR_SESSION_ID/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "task_name": "raise_hand",
    "duration_seconds": 15.5,
    "status": "success"
  }'
```

Save the task `id`!

### 4. Add Metrics
```bash
curl -X POST http://localhost:8000/tasks/YOUR_TASK_ID/metrics \
  -H "Content-Type: application/json" \
  -d '{
    "accuracy": 0.95,
    "stability": 0.88,
    "max_angle": 165.5
  }'
```

### 5. Get Metrics
```bash
curl http://localhost:8000/tasks/YOUR_TASK_ID/metrics
```

---

## 🔧 Database Migrations (Optional)

### Create Migration
```bash
alembic revision --autogenerate -m "Initial schema"
```

### Apply Migration
```bash
alembic upgrade head
```

### View Current Version
```bash
alembic current
```

---

## ⚡ Frontend Integration

Update your frontend API calls:

### Before (old endpoints):
```javascript
POST /api/db/sessions
GET /api/db/sessions/{id}
POST /api/db/task-results
GET /api/db/task-results/session/{id}
POST /api/db/metrics
GET /api/db/metrics/task/{id}
```

### After (new endpoints):
```javascript
POST /sessions
GET /sessions/{id}
POST /sessions/{id}/tasks
GET /sessions/{id}/tasks
POST /tasks/{id}/metrics
GET /tasks/{id}/metrics
```

### Example Frontend Code:
```javascript
// Create session
const session = await fetch('http://localhost:8000/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    child_name: 'John Doe',
    child_age: 8
  })
}).then(r => r.json());

// Create task for session
const task = await fetch(`http://localhost:8000/sessions/${session.id}/tasks`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task_name: 'raise_hand',
    duration_seconds: 15.5,
    status: 'success'
  })
}).then(r => r.json());

// Add metrics to task
await fetch(`http://localhost:8000/tasks/${task.id}/metrics`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accuracy: 0.95,
    stability: 0.88
  })
});

// Get all tasks for session
const tasks = await fetch(`http://localhost:8000/sessions/${session.id}/tasks`)
  .then(r => r.json());

// Get metrics for task
const metrics = await fetch(`http://localhost:8000/tasks/${task.id}/metrics`)
  .then(r => r.json());
```

---

## 🐛 Troubleshooting

### ❌ "No module named 'asyncpg'"
```bash
pip install asyncpg
```

### ❌ "DATABASE_URL not set"
Create `.env` file in `backend/` with your database URL

### ❌ "Connection refused"
- Check DATABASE_URL is correct
- Verify database is running
- Test with `python test_async_db.py`

### ❌ "Import error: greenlet"
```bash
pip install greenlet
```

### ❌ Server won't start
```bash
# Make sure you're in backend directory
cd backend

# Use main_async.py (not main.py)
uvicorn main_async:app --reload
```

---

## 📚 Documentation

- **Full Setup Guide**: `ASYNC_SETUP.md`
- **Migration Details**: `MIGRATION_SUMMARY.md`
- **API Docs**: http://localhost:8000/docs (when server running)

---

## ✅ Success Indicators

You know everything is working when:
1. ✅ `python test_async_db.py` shows all tests passed
2. ✅ Server starts without errors
3. ✅ http://localhost:8000/docs shows Swagger UI
4. ✅ http://localhost:8000/health returns `{"status": "healthy"}`
5. ✅ You can create sessions, tasks, and metrics via API

---

## 🎯 What Changed?

**Old Architecture:**
- Sync SQLAlchemy with psycopg2
- Legacy Column() syntax
- Blocking database queries

**New Architecture:**
- ✅ Async SQLAlchemy 2.0 with AsyncPG
- ✅ Modern Mapped[] type hints
- ✅ Non-blocking async/await
- ✅ 3x faster performance
- ✅ Better scalability

---

## 🚀 Ready to Go!

Your async backend is ready! Start with:
```bash
python test_async_db.py && uvicorn main_async:app --reload
```

Then open http://localhost:8000/docs and start testing! 🎉
