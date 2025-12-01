# Deploy FastAPI Backend to Netlify

## Quick Start

### 1. Prerequisites
- Netlify account
- GitHub repository connected
- Supabase PostgreSQL database

### 2. Deploy to Netlify

#### Option A: Netlify CLI (Recommended)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from backend directory
cd backend
netlify init

# Deploy
netlify deploy --prod
```

#### Option B: Netlify Web Dashboard

1. Go to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to your GitHub repository
4. Configure build settings:
   - **Base directory**: `backend`
   - **Build command**: `pip install -r requirements.txt`
   - **Publish directory**: `.`
   - **Functions directory**: `functions`

### 3. Environment Variables

Add these in Netlify Dashboard → Site settings → Environment variables:

```
SUPABASE_DB_USER=postgres.your-project-id
SUPABASE_DB_PASSWORD=your-supabase-password
SUPABASE_DB_HOST=aws-0-us-east-1.pooler.supabase.com
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres

CORS_ORIGINS=https://virtual-mirrior2.vercel.app,https://virtual-mirror2.vercel.app
```

### 4. Update Frontend

Update your Vercel environment variable:

```
VITE_API_BASE_URL=https://your-site-name.netlify.app
```

### 5. Test Deployment

Once deployed, test these endpoints:

- `https://your-site-name.netlify.app/` - Root endpoint
- `https://your-site-name.netlify.app/health` - Health check
- `https://your-site-name.netlify.app/docs` - API documentation

## Troubleshooting

### CORS Issues
- Make sure `allow_origins=["*"]` is set in `main_async.py`
- Add your Vercel domain to `CORS_ORIGINS` environment variable

### Database Connection Issues
- Verify Supabase credentials are correct
- Use connection pooler (port 5432, not 6543)
- Check Supabase allows connections from Netlify IPs

### Function Timeout
- Netlify free tier has 10-second function timeout
- Optimize database queries
- Consider upgrading to Pro plan for 26-second timeout

## Key Files

- `netlify.toml` - Netlify configuration
- `functions/api.py` - Netlify Functions handler using Mangum
- `requirements.txt` - Python dependencies (includes mangum)
- `main_async.py` - FastAPI application

## Notes

- Netlify Functions run as serverless functions
- Cold starts may take 1-2 seconds
- Database connection pooling is essential
- Use NullPool in SQLAlchemy (already configured)
