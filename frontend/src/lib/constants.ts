require('dotenv').config()
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
export const DJANGO_BACKEND_URL = 'http://localhost:8000'
