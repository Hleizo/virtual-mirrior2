"""
Netlify Functions Handler for FastAPI Backend
"""
from mangum import Mangum
from main_async import app

# Create handler for Netlify Functions
handler = Mangum(app, lifespan="off")
