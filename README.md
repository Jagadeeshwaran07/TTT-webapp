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
python -m venv venv
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
