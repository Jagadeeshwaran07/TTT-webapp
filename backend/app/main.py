from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.database import engine
from app.core import database
from app.models import user, tournament, team, match
from app.core.database import Base, SessionLocal
from app.core.security import get_password_hash
from app.core.config import settings
from app.api import auth, tournaments, teams, matches
from app.api.websocket import router as ws_router

# Create tables
Base.metadata.create_all(bind=engine)


def _migrate_enum_values():
    """Fix enum types if they were created with uppercase names instead of lowercase values."""
    round_pairs = [
        ('PLAY_IN', 'play_in'), ('ROUND_OF_32', 'round_of_32'), ('ROUND_OF_16', 'round_of_16'),
        ('QUARTER_FINAL', 'quarter_final'), ('SEMI_FINAL', 'semi_final'),
        ('UPPER_FINAL', 'upper_final'), ('LOSERS_MATCH', 'losers_match'),
        ('QUALIFICATION_FINAL', 'qualification_final'), ('GRAND_FINAL', 'grand_final'),
    ]
    status_pairs = [
        ('UPCOMING', 'upcoming'), ('LIVE', 'live'), ('COMPLETED', 'completed'),
    ]
    with engine.connect() as conn:
        row = conn.execute(text(
            "SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid "
            "WHERE pg_type.typname = 'roundenum' LIMIT 1"
        )).fetchone()
        if row and row[0] == 'PLAY_IN':
            for old, new in round_pairs:
                conn.execute(text(f"ALTER TYPE roundenum RENAME VALUE '{old}' TO '{new}'"))
            conn.commit()

        row = conn.execute(text(
            "SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid "
            "WHERE pg_type.typname = 'matchstatus' LIMIT 1"
        )).fetchone()
        if row and row[0] == 'UPCOMING':
            for old, new in status_pairs:
                conn.execute(text(f"ALTER TYPE matchstatus RENAME VALUE '{old}' TO '{new}'"))
            conn.commit()


_migrate_enum_values()

app = FastAPI(title="Table Tennis Tournament API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tournaments.router)
app.include_router(teams.router)
app.include_router(matches.router)
app.include_router(matches.matches_router)
app.include_router(ws_router)

@app.on_event("startup")
def create_default_admin():
    db = SessionLocal()
    try:
        from app.models.user import User
        # Find any admin user
        admin_user = db.query(User).filter(User.role == "admin").first()
        if not admin_user:
            # No admin exists, create with env username and password
            admin = User(
                username=settings.ADMIN_USERNAME,
                password_hash=get_password_hash(settings.ADMIN_PASSWORD),
                role="admin",
            )
            db.add(admin)
            db.commit()
        else:
            updated = False
            # Only update username if it's different and not already taken by another user
            if admin_user.username != settings.ADMIN_USERNAME:
                username_exists = db.query(User).filter(User.username == settings.ADMIN_USERNAME, User.id != admin_user.id).first()
                if username_exists:
                    # Don't update to a username that already exists
                    pass
                else:
                    admin_user.username = settings.ADMIN_USERNAME
                    updated = True
            if admin_user.password_hash != get_password_hash(settings.ADMIN_PASSWORD):
                admin_user.password_hash = get_password_hash(settings.ADMIN_PASSWORD)
                updated = True
            if updated:
                db.commit()
    finally:
        db.close()

@app.get("/")
def health():
    return {"status": "ok", "app": "Table Tennis Tournament"}
