from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
