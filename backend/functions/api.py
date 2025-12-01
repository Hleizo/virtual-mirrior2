"""
Netlify Functions Handler for FastAPI Backend
"""
import sys
import os

# Add parent directory to path to import main_async
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from mangum import Mangum
from main_async import app

# Create handler for Netlify Functions
handler = Mangum(app, lifespan="off", api_gateway_base_path="/api")
