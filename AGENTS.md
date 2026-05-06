# AGENTS.md

## Codebase at a glance
- Monorepo with a FastAPI backend (`backend/app`) and React + Vite frontend (`frontend/src`); root `package.json` only proxies frontend scripts.
- Backend owns tournament state and bracket progression; frontend is mostly a thin client over REST + WebSocket updates.
- Main API mounting is in `backend/app/main.py` (includes `auth`, `tournaments`, `teams`, `matches`, and `/ws` router).
- Domain model is tournament-centric: `Tournament -> Team -> Match -> SetScore` (see `backend/app/models/*.py`).

## Architecture and data flow (project-specific)
- Fixture generation is centralized in `backend/app/services/bracket.py`; it always rebuilds all matches for a tournament (`delete()` then recreate).
- Tournament format is not a plain knockout: semis feed into `upper_final`, `losers_match`, `qualification_final`, then `grand_final` (double-chance path).
- Winner propagation after scoring happens in `backend/app/services/scoring.py::propagate_winner`, using `next_match_*` and `loser_next_match_*` links on `Match`.
- Live UI updates are push + refetch: backend broadcasts in `backend/app/api/matches.py`, frontend invalidates React Query keys in `frontend/src/pages/TournamentPage.tsx`.
- WebSocket channels are per tournament (`/ws/tournament/{id}`), managed by `backend/app/websockets/manager.py` and consumed by `frontend/src/hooks/useSocket.ts`.

## Conventions to preserve
- Keep round enums aligned across backend and frontend:
  - backend: `backend/app/models/match.py::RoundEnum`
  - frontend: `frontend/src/types/index.ts::RoundEnum` and `frontend/src/components/bracket/BracketView.tsx::ROUND_ORDER`
- Admin-only mutations use `Depends(get_current_admin)` (tournaments, team changes, fixture generation, score/status/label updates).
- Frontend auth state is token-in-localStorage + Zustand (`frontend/src/store/auth.ts`), and API auth header injection is via Axios interceptor (`frontend/src/api/client.ts`).
- Login endpoint expects `application/x-www-form-urlencoded` (`frontend/src/api/client.ts::login`, `backend/app/api/auth.py`).
- Match list ordering assumes backend `.order_by(Match.round, Match.match_order)` and frontend per-round sorting by `match_order`.

## Developer workflow (discovered commands)
- Backend local run:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```
- Frontend local run:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
- Frontend build/lint:
```bash
cd frontend
npm run build
npm run lint
```
- Root shortcuts (frontend only): `npm run frontend:dev`, `npm run frontend:build`.

## Operational notes / integration points
- DB schema is auto-created at startup (`Base.metadata.create_all(...)` in `backend/app/main.py`), even though Alembic files exist.
- Startup also auto-creates default admin from env (`ADMIN_USERNAME`, `ADMIN_PASSWORD`).
- External requirements are PostgreSQL (`DATABASE_URL`) and JWT secret (`SECRET_KEY`); frontend points to backend via `VITE_API_URL`.
- Deploy hints in repo: backend Render config in `render.yaml`; frontend Vercel config in `frontend/vercel.json`.
- There is no automated test suite in this repo right now; use manual smoke checks through `/docs`, admin flows, and tournament live view.

