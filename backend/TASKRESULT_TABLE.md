# TaskResult Table - Implementation Summary

## Overview
Added a new `task_results` table to track individual task performance within each session. This complements the existing `sessions` table by storing detailed metrics for each task (raise_hand, one_leg, walk, jump).

## Database Schema

### TaskResult Table
```sql
CREATE TABLE task_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    task_name VARCHAR(100) NOT NULL,
    duration_seconds FLOAT,
    status VARCHAR(50),  -- 'success', 'fail', 'borderline'
    notes TEXT,
    metrics JSONB,  -- Detailed task-specific metrics
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_results_session_id ON task_results(session_id);
```

## Files Modified/Created

### 1. models.py
**Added:**
- `TaskResult` model class with all specified columns
- Foreign key relationship to `Session` (cascade delete)
- `metrics` JSON column for flexible task data storage
- `to_dict()` method for serialization
- Bidirectional relationship: `Session.task_results` ↔ `TaskResult.session`

**Import additions:**
- `ForeignKey` from sqlalchemy
- `relationship` from sqlalchemy.orm

### 2. schemas.py
**Added 4 new schemas:**
- `TaskResultCreate` - Input validation for creating task results
  - Required: session_id, task_name
  - Optional: duration_seconds, status, notes, metrics
  - Status pattern validation: "success|fail|borderline"
  
- `TaskResultUpdate` - Partial update schema
  - All fields optional
  
- `TaskResultResponse` - API response format
  - Includes all fields with proper typing
  
- `TaskResultListResponse` - Paginated list wrapper
  - Contains task_results array and total count

### 3. crud.py
**Added 9 CRUD functions:**
1. `create_task_result()` - Create new task result
2. `get_task_result()` - Get by UUID
3. `get_task_results_by_session()` - Get all tasks for a session (paginated)
4. `get_task_results_by_name()` - Filter by task name (paginated)
5. `get_task_results_by_status()` - Filter by status (paginated)
6. `update_task_result()` - Update existing task result
7. `delete_task_result()` - Delete by UUID
8. `get_task_result_count()` - Total count (with optional session filter)

### 4. main.py
**Added 7 API endpoints:**

#### POST /api/db/task-results
- Creates new task result
- Validates session exists
- Returns 201 with created task

#### GET /api/db/task-results/{task_id}
- Get single task result by UUID
- Returns 404 if not found

#### GET /api/db/task-results/session/{session_id}
- Get all tasks for a session
- Paginated (skip, limit)
- Validates session exists
- Returns TaskResultListResponse

#### GET /api/db/task-results/name/{task_name}
- Filter tasks by name (raise_hand, one_leg, etc.)
- Paginated
- Returns TaskResultListResponse

#### GET /api/db/task-results/status/{status}
- Filter by status (success/fail/borderline)
- Validates status value
- Paginated
- Returns TaskResultListResponse

#### PUT /api/db/task-results/{task_id}
- Update existing task result
- Returns updated task or 404

#### DELETE /api/db/task-results/{task_id}
- Delete task result
- Returns 204 on success, 404 if not found

### 5. DATABASE_SETUP.md
**Updated sections:**
- Database schema documentation (added task_results table)
- File structure (noted TaskResult in models.py)
- Schemas list (added 4 TaskResult schemas)
- API endpoints (added 7 new endpoints with examples)
- Python usage examples (added task result operations)
- Frontend integration (added task result API calls)

## Usage Examples

### Creating Task Results During Session
```python
# After session is created and tasks are completed
db = SessionLocal()

# Create task result for each completed task
raise_hand_result = crud.create_task_result(
    db=db,
    session_id=session.id,
    task_name="raise_hand",
    duration_seconds=15.3,
    status="success",
    metrics={
        "accuracy": 0.95,
        "max_angle": 165,
        "stability_score": 0.88
    }
)

one_leg_result = crud.create_task_result(
    db=db,
    session_id=session.id,
    task_name="one_leg",
    duration_seconds=12.5,
    status="borderline",
    notes="Some wobbling observed",
    metrics={
        "balance_score": 0.72,
        "max_tilt": 15,
        "recovery_time": 2.3
    }
)

db.close()
```

### Frontend Integration
```javascript
// During session - save each task result as it completes
async function saveTaskResult(sessionId, taskName, taskData) {
  const response = await fetch('http://localhost:8000/api/db/task-results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      task_name: taskName,
      duration_seconds: taskData.duration,
      status: taskData.passed ? 'success' : 'fail',
      metrics: {
        accuracy: taskData.accuracy,
        stability: taskData.stability,
        score: taskData.score
      }
    })
  });
  return response.json();
}

// After session - retrieve all task results
async function getSessionTasks(sessionId) {
  const response = await fetch(`http://localhost:8000/api/db/task-results/session/${sessionId}`);
  const data = await response.json();
  return data.task_results;
}

// Analytics - get all successful raise_hand attempts
async function getRaiseHandSuccesses() {
  const response = await fetch('http://localhost:8000/api/db/task-results/name/raise_hand');
  const data = await response.json();
  const successful = data.task_results.filter(t => t.status === 'success');
  return successful;
}
```

## Relationship Benefits

### 1. Cascade Delete
When a session is deleted, all associated task results are automatically deleted.

```python
# Delete session - task results deleted automatically
crud.delete_session(db, session_id)
```

### 2. Joined Queries
Get session with all task results in one query:

```python
session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
task_results = session.task_results  # Automatic relationship loading
```

### 3. Data Integrity
Foreign key constraint ensures task results can't reference non-existent sessions.

## Migration Steps

1. **Install dependencies** (if not already done):
   ```bash
   pip install -r requirements.txt
   ```

2. **Run setup script** to create new table:
   ```bash
   python setup_db.py
   ```
   
   This will create the `task_results` table alongside the existing `sessions` table.

3. **Verify table creation**:
   - Check Supabase dashboard → Table Editor
   - Should see both `sessions` and `task_results` tables
   - Verify foreign key constraint on `session_id`

4. **Test endpoints**:
   ```bash
   # Start server
   uvicorn main:app --reload
   
   # Visit API docs
   # http://localhost:8000/docs
   ```

## API Documentation

All new endpoints are automatically documented in FastAPI's Swagger UI:
- Visit: `http://localhost:8000/docs`
- Scroll to "Task Result Endpoints" section
- Test endpoints interactively

## Next Steps

1. **Update SessionPageOrchestrator** to save individual task results:
   - After each task completes, POST to `/api/db/task-results`
   - Include task-specific metrics from task engine
   
2. **Update ResultsPage/ClinicianResultsPage** to display task results:
   - Fetch from `/api/db/task-results/session/{id}`
   - Show individual task breakdowns
   - Display metrics charts per task

3. **Add analytics dashboard**:
   - Query by task name to see performance trends
   - Filter by status to identify problem areas
   - Compare task durations across sessions

4. **Enhance reporting**:
   - Include task-level details in PDF reports
   - Show metrics visualization per task
   - Add task comparison charts

## Summary

✅ Created `TaskResult` model with proper foreign key relationship
✅ Added 4 Pydantic schemas for validation
✅ Implemented 9 CRUD operations
✅ Added 7 REST API endpoints
✅ Updated documentation
✅ Cascade delete ensures referential integrity
✅ Ready for frontend integration

The database layer now supports granular task tracking while maintaining the session-level summary in the `sessions` table.
