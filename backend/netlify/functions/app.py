"""
Netlify Serverless Function for FastAPI Backend
"""
import sys
import os

# Add parent directory to path
parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
sys.path.insert(0, parent_dir)

from mangum import Mangum
from main_async import app

# Netlify function handler
handler = Mangum(app, lifespan="off")
