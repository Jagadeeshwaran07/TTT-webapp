# Table Tennis Tournament – Full Stack App

## Monorepo Structure
```
TTT-webapp/
├── backend/          # FastAPI Python backend
│   ├── app/
│   │   ├── api/      # Route handlers
│   │   ├── core/     # Config, DB, security
│   │   ├── models/   # SQLAlchemy models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── services/ # Bracket + scoring logic
│   │   └── websockets/
│   ├── alembic/      # DB migrations
│   └── requirements.txt
└── frontend/         # React + Vite TypeScript
    └── src/
        ├── api/      # Axios API client
        ├── components/
        ├── hooks/    # WebSocket hook
        ├── pages/
        ├── store/    # Zustand auth store
        └── types/
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL

### Backend Setup
```bash
cd backend
cp .env.example .env          # Edit DATABASE_URL and SECRET_KEY
python3.12 -m venv venv         # python -m venv venv - didnt work for jack
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload  # Creates tables + default admin on startup
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env          # Set VITE_API_URL if needed
npm install
npm run dev
```

### Default Admin Credentials
- Username: `admin`
- Password: `admin123`
- Change via `ADMIN_USERNAME` and `ADMIN_PASSWORD` in backend `.env`

## API Documentation
Visit `http://localhost:8000/docs` for interactive Swagger UI.

## Tournament Flow
1. Admin logs in → creates tournament
2. Admin adds teams (singles or doubles)
3. Admin generates fixtures (handles uneven teams with BYEs)
4. Admin starts matches → sets status to `live`
5. Admin updates scores per set
6. System auto-determines winner and propagates to next match
7. Public users watch live via WebSocket auto-refresh

## Special Semi-Final Format (Double Chance)
```
SF1 (Team1 vs Team2) ─── Winner ──→ Upper Final ─── Winner ──→ Grand Final
                     └── Loser  ──→ Losers Match                    ↑
SF2 (Team3 vs Team4) ─── Winner ──→ Upper Final ─── Loser ───→ Qual Final ─→ Grand Final
                     └── Loser  ──→ Losers Match ─── Winner →┘
```

## Deployment

### Backend (Render/Railway)
Set env vars: `DATABASE_URL`, `SECRET_KEY`

### Frontend (Vercel)
Set env var: `VITE_API_URL=https://your-backend.com`


### Database (Neon/Supabase)
Use the connection string as `DATABASE_URL`.

---

## Troubleshooting & Setup Notes

### Python Version
- Use Python 3.11 or 3.12. Python 3.13 is not supported by `psycopg2-binary` as of 2026.
- If you see build errors for `psycopg2-binary`, install Python 3.11:
    ```bash
    brew install python@3.11
    /opt/homebrew/bin/python3.11 -m venv venv
    ```

### PostgreSQL (Homebrew, macOS)
- This project expects PostgreSQL running on port 5433 (Homebrew default for user-managed DBs).
- Start with:
    ```bash
    pg_ctl -D /opt/homebrew/var/postgresql@18 start
    ```
- If you have multiple Postgres versions, check running ports with:
    ```bash
    ps aux | grep postgres
    ```

### Backend .env Example
```
DATABASE_URL=postgresql://jmd138@localhost:5433/ttt_db
SECRET_KEY=your-secret-key-change-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Enum Sync (Postgres)
- If you see errors like `invalid input value for enum roundenum: "ROUND_OF_32"`, your DB enum is out of sync with the code.
- To add missing enum values:
    ```bash
    psql -p 5433 -d ttt_db
    ALTER TYPE roundenum ADD VALUE 'ROUND_OF_32';
    -- Repeat for any other missing values
    ```

### CORS / Frontend API
- The backend enables CORS for `http://localhost:5173` (Vite dev server) by default.
- If you get CORS errors, ensure your frontend `.env` has:
    ```
    VITE_API_URL=http://localhost:8000
    ```
- And your backend `.env` has the correct `ALLOWED_ORIGINS` if you change ports.

---
