# AGENTS.md

## Codebase at a glance
- Monorepo with a FastAPI backend (`backend/app`) and React + Vite frontend (`frontend/src`); root `package.json` only proxies frontend scripts.
- Backend owns tournament state and bracket progression; frontend is mostly a thin client over REST + WebSocket updates.
- Main API mounting is in `backend/app/main.py` (includes `auth`, `tournaments`, `teams`, `matches`, and `/ws` router).
- Domain model is tournament-centric: `Tournament -> Team -> Match -> SetScore` (see `backend/app/models/*.py`).

## Architecture and data flow (project-specific)
- Fixture generation is centralized in `backend/app/services/bracket.py`; it always rebuilds all matches for a tournament (`delete()` then recreate).
- Bracket sizing by team count: 2→GF only; 3-4→Semis→Finals; 5-8→QFs→Semis→Finals (BYEs for top seeds); 9-15→Play-in→QFs; 16→R16 (no BYEs); 17-32→Play-in→R16; 33-64→Play-in→R32. Max 64 teams.
- Tournament format is not a plain knockout: semis feed into `upper_final` ("Qualifier 1"), `losers_match` ("Elimination Match"), `qualification_final` ("Qualifier 2"), then `grand_final` (double-chance path).
- Winner propagation after scoring happens in `backend/app/services/scoring.py::propagate_winner`, using `next_match_*` and `loser_next_match_*` links on `Match`.
- Scoring rules: sets 1 & 2 play to 11, set 3 plays to 21; must win by 2 (deuce); best of 3 sets determines match winner.
- When the last play-in match completes, `scoring.py::propagate_winner` auto-calls `randomize_entry_round` to shuffle team assignments across the entry round. Admins can also manually trigger `POST /tournaments/{id}/randomize-seeds`.
- The bracket UI (`BracketView.tsx`) hides all post–play-in rounds (shows TBD) until every play-in match is completed.
- Live UI updates are push + refetch: backend broadcasts in `backend/app/api/matches.py`, frontend invalidates React Query keys in `frontend/src/pages/TournamentPage.tsx`.
- WebSocket channels are per tournament (`/ws/tournament/{id}`), managed by `backend/app/websockets/manager.py` and consumed by `frontend/src/hooks/useSocket.ts`.
- Two API routers are mounted from `backend/app/api/matches.py`: `router` (prefix `/tournaments`, handles fixture generation, randomize-seeds, match listing) and `matches_router` (prefix `/matches`, handles score/status/label/details/teams updates).

## Conventions to preserve
- Keep round enums aligned across backend and frontend:
  - backend: `backend/app/models/match.py::RoundEnum`
  - frontend: `frontend/src/types/index.ts::RoundEnum` and `frontend/src/components/bracket/BracketView.tsx::ROUND_ORDER`
- Admin-only mutations use `Depends(get_current_admin)` (tournaments, team changes, fixture generation, score/status/label updates).
- Frontend auth state is token-in-localStorage + Zustand (`frontend/src/store/auth.ts`), and API auth header injection is via Axios interceptor (`frontend/src/api/client.ts`).
- Login endpoint expects `application/x-www-form-urlencoded` (`frontend/src/api/client.ts::login`, `backend/app/api/auth.py`).
- Match list ordering assumes backend `.order_by(Match.round, Match.match_order)` and frontend per-round sorting by `match_order`.
- `Match` has optional metadata fields: `match_date` (Date), `match_time` (str "HH:MM"), `match_place` (str), `match_umpire` (str); editable via `PUT /matches/{id}/details` (`MatchDetailsUpdate` schema).
- Play-in match team assignments can be overridden via `PUT /matches/{id}/teams` (admin only, only UPCOMING undecided play-in matches).
- `ROUND_LABELS` in `BracketView.tsx` maps enum values to display strings (e.g. `upper_final` → "Qualifier 1"); keep in sync when adding rounds.

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
- `_migrate_enum_values()` also runs at startup (before `app` is created) to rename any legacy uppercase PostgreSQL enum values to lowercase (one-time idempotent migration for `roundenum` and `matchstatus` types).
- Startup also auto-creates default admin from env (`ADMIN_USERNAME`, `ADMIN_PASSWORD`); if an admin already exists, username/password are synced to env values on each boot.
- External requirements are PostgreSQL (`DATABASE_URL`) and JWT secret (`SECRET_KEY`); frontend points to backend via `VITE_API_URL`.
- Deploy hints in repo: backend Render config in `render.yaml`; frontend Vercel config in `frontend/vercel.json`.
- There is no automated test suite in this repo right now; use manual smoke checks through `/docs`, admin flows, and tournament live view.

