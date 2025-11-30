# Virtual Mirror - Database Layer Setup Guide

## Overview
This guide explains how to set up and use the PostgreSQL database layer with Supabase for the Virtual Mirror project.

## Prerequisites
- Supabase account with a project created
- PostgreSQL connection string (DATABASE_URL)
- Python 3.8+ with pip installed

## Installation

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

This will install:
- `sqlalchemy` - ORM for database operations
- `psycopg2-binary` - PostgreSQL adapter
- `alembic` - Database migrations (optional)

### 2. Configure Database Connection
Create or update your `.env` file in the backend directory:

```env
DATABASE_URL=postgresql://user:password@host:port/database

# Example Supabase URL:
# DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

**Important**: Get your DATABASE_URL from Supabase:
1. Go to Project Settings > Database
2. Copy the "Connection string" under "Connection pooling"
3. Replace `[YOUR-PASSWORD]` with your database password

### 3. Initialize Database Tables
Run the setup script to create all tables:

```bash
python setup_db.py
```

This will create three tables:

**1. `sessions` table:**
- `id` - UUID primary key
- `created_at` - Timestamp
- `child_name` - Text
- `child_age` - Integer
- `child_height_cm` - Float (optional)
- `child_weight_kg` - Float (optional)
- `child_gender` - Text (optional)
- `risk_level` - Text (low/moderate/high)
- `overall_score` - Integer (0-100)
- `task_metrics` - JSON
- `clinical_analysis` - JSON
- `recommendations` - JSON array
- And more fields for complete session tracking

**2. `task_results` table:**
- `id` - UUID primary key
- `session_id` - UUID foreign key → sessions.id
- `task_name` - Text (raise_hand, one_leg, walk, jump)
- `duration_seconds` - Float
- `status` - Text (success, fail, borderline)
- `notes` - Text
- `metrics` - JSON (detailed task metrics)
- `created_at` - Timestamp

**3. `metrics` table:**
- `id` - UUID primary key
- `task_id` - UUID foreign key → task_results.id
- `metric_name` - Text
- `metric_value` - Float
- `created_at` - Timestamp

## Database Layer Structure

### Files Created
```
backend/
├── database.py       # Database configuration and session management
├── models.py         # SQLAlchemy models (Session, TaskResult tables)
├── schemas.py        # Pydantic schemas for validation
├── crud.py          # CRUD operations for database
├── migrations.py    # Migration helpers (for Alembic)
├── setup_db.py      # Database initialization script
└── main.py          # Updated with database endpoints
```

### Key Components

#### 1. **database.py**
- Database engine configuration
- Session management
- `get_db()` dependency for FastAPI

#### 2. **models.py**
- `Session` model with all fields
- Automatic UUID generation
- JSON storage for complex data
- `to_dict()` method for serialization

#### 3. **crud.py**
CRUD operations available:
- `create_session()` - Create new session
- `get_session()` - Get by UUID
- `get_all_sessions()` - List with pagination
- `get_sessions_by_child_name()` - Filter by child
- `get_sessions_by_risk_level()` - Filter by risk
- `get_recent_sessions()` - Get recent sessions
- `update_session_results()` - Update with analysis
- `delete_session()` - Delete session
- `get_session_statistics()` - Get analytics

#### 4. **schemas.py**
Pydantic models for validation:
- **Session schemas:**
  - `SessionCreate` - For creating sessions
  - `SessionUpdate` - For updating results
  - `SessionResponse` - For API responses
  - `SessionListResponse` - For paginated lists
  - `SessionStatistics` - For analytics
- **TaskResult schemas:**
  - `TaskResultCreate` - For creating task results
  - `TaskResultUpdate` - For updating task results
  - `TaskResultResponse` - For API responses
  - `TaskResultListResponse` - For paginated lists
- **Metric schemas:**
  - `MetricCreate` - For creating metrics
  - `MetricUpdate` - For updating metric values
  - `MetricResponse` - For API responses
  - `MetricListResponse` - For paginated lists
  - `TaskResultListResponse` - For paginated lists

## API Endpoints

### Session Endpoints

#### Create Session
```http
POST /api/db/sessions
Content-Type: application/json

{
  "child_name": "Test Child",
  "child_age": 8,
  "child_height_cm": 130.5,
  "child_weight_kg": 28.0,
  "child_gender": "male",
  "child_notes": "First assessment"
}
```

#### Get Session by ID
```http
GET /api/db/sessions/{session_id}
```

#### Get All Sessions (Paginated)
```http
GET /api/db/sessions?skip=0&limit=10&sort_by=created_at&sort_order=desc
```

#### Get Sessions by Child Name
```http
GET /api/db/sessions/child/{child_name}
```

#### Get Sessions by Risk Level
```http
GET /api/db/sessions/risk/{risk_level}
# risk_level: low, moderate, or high
```

#### Get Recent Sessions
```http
GET /api/db/sessions/recent/{days}?limit=100
# days: number of days to look back (default: 7)
```

#### Update Session with Results
```http
PUT /api/db/sessions/{session_id}
Content-Type: application/json

{
  "risk_level": "low",
  "overall_score": 85,
  "task_metrics": {...},
  "clinical_analysis": {...},
  "recommendations": ["..."],
  "duration_seconds": 180
}
```

#### Delete Session
```http
DELETE /api/db/sessions/{session_id}
```

#### Get Statistics
```http
GET /api/db/statistics
```

### Task Result Endpoints

#### Create Task Result
```http
POST /api/db/task-results
Content-Type: application/json

{
  "session_id": "uuid-here",
  "task_name": "raise_hand",
  "duration_seconds": 15.5,
  "status": "success",
  "notes": "Completed successfully",
  "metrics": {
    "accuracy": 0.95,
    "stability": 0.88
  }
}
```

#### Get Task Result by ID
```http
GET /api/db/task-results/{task_id}
```

#### Get Task Results by Session
```http
GET /api/db/task-results/session/{session_id}?skip=0&limit=100
```

#### Get Task Results by Name
```http
GET /api/db/task-results/name/{task_name}?skip=0&limit=100
# task_name: raise_hand, one_leg, walk, jump
```

#### Get Task Results by Status
```http
GET /api/db/task-results/status/{status}?skip=0&limit=100
# status: success, fail, borderline
```

#### Update Task Result
```http
PUT /api/db/task-results/{task_id}
Content-Type: application/json

{
  "duration_seconds": 18.2,
  "status": "borderline",
  "notes": "Needed assistance",
  "metrics": {...}
}
```

#### Delete Task Result
```http
DELETE /api/db/task-results/{task_id}
```

### Metric Endpoints

#### Create Metric
```http
POST /api/db/metrics
Content-Type: application/json

{
  "task_id": "uuid-here",
  "metric_name": "accuracy",
  "metric_value": 0.95
}
```

#### Create Multiple Metrics (Batch)
```http
POST /api/db/metrics/batch?task_id=uuid-here
Content-Type: application/json

{
  "accuracy": 0.95,
  "stability": 0.88,
  "balance": 0.92,
  "max_angle": 165.5
}
```

#### Get Metric by ID
```http
GET /api/db/metrics/{metric_id}
```

#### Get Metrics by Task
```http
GET /api/db/metrics/task/{task_id}?skip=0&limit=100
```

#### Get Metrics by Name
```http
GET /api/db/metrics/task/{task_id}/name/{metric_name}
# Example: GET /api/db/metrics/task/{task_id}/name/accuracy
```

#### Update Metric
```http
PUT /api/db/metrics/{metric_id}
Content-Type: application/json

{
  "metric_value": 0.97
}
```

#### Delete Metric
```http
DELETE /api/db/metrics/{metric_id}
```

## Usage Examples

### Python Usage
```python
from database import SessionLocal
import crud
import schemas

# Create database session
db = SessionLocal()

# Create a new session
new_session = crud.create_session(
    db=db,
    child_name="John Doe",
    child_age=7,
    child_height_cm=125.0
)

# Get session by ID
session = crud.get_session(db, new_session.id)

# Create task results for this session
task1 = crud.create_task_result(
    db=db,
    session_id=session.id,
    task_name="raise_hand",
    duration_seconds=15.5,
    status="success",
    metrics={"accuracy": 0.95}
)

task2 = crud.create_task_result(
    db=db,
    session_id=session.id,
    task_name="one_leg",
    duration_seconds=12.0,
    status="borderline",
    metrics={"balance": 0.75}
)

# Get all task results for a session
task_results = crud.get_task_results_by_session(db, session.id)

# Create individual metrics for task1
metric1 = crud.create_metric(
    db=db,
    task_id=task1.id,
    metric_name="accuracy",
    metric_value=0.95
)

metric2 = crud.create_metric(
    db=db,
    task_id=task1.id,
    metric_name="max_angle",
    metric_value=165.5
)

# Create multiple metrics at once (batch)
metrics_batch = crud.create_metrics_batch(
    db=db,
    task_id=task2.id,
    metrics={
        "balance": 0.75,
        "stability": 0.68,
        "recovery_time": 2.3
    }
)

# Get all metrics for a task
all_metrics = crud.get_metrics_by_task(db, task1.id)

# Update with results
updated = crud.update_session_results(
    db=db,
    session_id=session.id,
    risk_level="low",
    overall_score=90,
    task_metrics={"raise_hand": {...}}
)

# Get statistics
stats = crud.get_session_statistics(db)
print(f"Total sessions: {stats['total_sessions']}")

# Close session
db.close()
```

### Frontend Integration
```javascript
// Create session
const response = await fetch('http://localhost:8000/api/db/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    child_name: 'Test Child',
    child_age: 8,
    child_height_cm: 130
  })
});
const session = await response.json();

// Create task results
const taskResult = await fetch('http://localhost:8000/api/db/task-results', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: session.id,
    task_name: 'raise_hand',
    duration_seconds: 15.5,
    status: 'success',
    metrics: { accuracy: 0.95 }
  })
});
const taskData = await taskResult.json();

// Create metrics for this task (batch method)
const metricsResponse = await fetch(`http://localhost:8000/api/db/metrics/batch?task_id=${taskData.id}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accuracy: 0.95,
    stability: 0.88,
    max_angle: 165.5,
    completion_time: 15.3
  })
});

// Or create individual metric
const singleMetric = await fetch('http://localhost:8000/api/db/metrics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task_id: taskData.id,
    metric_name: 'balance_score',
    metric_value: 0.92
  })
});

// Get all metrics for a task
const metricsData = await fetch(`http://localhost:8000/api/db/metrics/task/${taskData.id}`);
const allMetrics = await metricsData.json();
console.log(allMetrics.metrics);

// Get all task results for session
const tasksResponse = await fetch(`http://localhost:8000/api/db/task-results/session/${session.id}`);
const tasksData = await tasksResponse.json();
console.log(tasksData.task_results);

// Update with results
await fetch(`http://localhost:8000/api/db/sessions/${session.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    risk_level: 'low',
    overall_score: 85,
    task_metrics: taskData
  })
});

// Get all sessions
const sessions = await fetch('http://localhost:8000/api/db/sessions?limit=50');
const data = await sessions.json();
console.log(data.sessions);
```

## Migrations (Optional)

If you need to modify the database schema later:

### 1. Initialize Alembic
```bash
alembic init alembic
```

### 2. Configure alembic.ini
Edit `alembic.ini` and set:
```ini
sqlalchemy.url = postgresql://user:password@host:port/database
```

### 3. Create Migration
```bash
alembic revision --autogenerate -m "Add new column"
```

### 4. Apply Migration
```bash
alembic upgrade head
```

## Troubleshooting

### Connection Issues
1. **Error: "DATABASE_URL not set"**
   - Check that `.env` file exists in backend directory
   - Verify DATABASE_URL is correctly formatted

2. **Error: "Connection refused"**
   - Verify Supabase project is running
   - Check firewall/network settings
   - Confirm correct host and port in DATABASE_URL

3. **Error: "Authentication failed"**
   - Verify database password is correct
   - Check if password contains special characters (URL encode them)

### Table Creation Issues
1. **Tables not created**
   - Run `python setup_db.py` manually
   - Check database permissions

2. **Column type errors**
   - Verify PostgreSQL version compatibility
   - Check SQLAlchemy version (should be 2.0+)

## Best Practices

1. **Environment Variables**
   - Never commit `.env` file to version control
   - Use different databases for dev/staging/production

2. **Connection Pooling**
   - NullPool is used for Supabase compatibility
   - For high-traffic apps, consider connection pooling

3. **Error Handling**
   - Always use try-except blocks
   - Log errors for debugging
   - Return proper HTTP status codes

4. **Data Validation**
   - Use Pydantic schemas for all inputs
   - Validate UUIDs before database queries

5. **Backup**
   - Regularly backup your Supabase database
   - Export data periodically using `/api/db/sessions` endpoint

## Support

For issues or questions:
1. Check Supabase logs in the dashboard
2. Review backend logs (uvicorn output)
3. Verify DATABASE_URL format
4. Test connection with `python setup_db.py`

## Next Steps

1. ✅ Install dependencies: `pip install -r requirements.txt`
2. ✅ Configure `.env` with DATABASE_URL
3. ✅ Run `python setup_db.py`
4. ✅ Start server: `uvicorn main:app --reload`
5. ✅ Test endpoints with Swagger docs: `http://localhost:8000/docs`
6. 🚀 Integrate with frontend application
