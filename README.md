# Think Agri – Farmer Community frontend

## Setup
1. Copy `.env.example` to `.env.local`.
2. Set `BACKEND_API_URL` to your Express backend URL (for local development: `http://localhost:4000`).
3. Install dependencies with `npm ci`.
4. Start with `npm run dev`.

The frontend talks to the backend through Next.js server routes. Do not expose Supabase service-role keys or backend secrets in frontend environment variables.

