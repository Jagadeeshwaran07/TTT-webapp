"""Seed script: creates admin, a tournament, and 20 teams with players."""
import sys
sys.path.insert(0, "/Users/spondu171@apac.comcast.com/Desktop/TTT-webapp/backend")

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.core.config import settings
from app.models.user import User
from app.models.tournament import Tournament
from app.models.team import Team, Player
from datetime import date

db = SessionLocal()

# --- Admin user ---
admin = db.query(User).filter(User.username == settings.ADMIN_USERNAME).first()
if not admin:
    admin = User(
        username=settings.ADMIN_USERNAME,
        password_hash=get_password_hash(settings.ADMIN_PASSWORD),
        role="admin",
    )
    db.add(admin)
    db.flush()
    print(f"Created admin: {admin.username}")
else:
    print(f"Admin already exists: {admin.username}")

# --- Tournament ---
tournament = Tournament(
    name="TTT 2026",
    start_date=date(2026, 5, 10),
    end_date=date(2026, 5, 10),
    format="knockout",
    created_by=admin.id,
)
db.add(tournament)
db.flush()
print(f"Created tournament: {tournament.name} (id={tournament.id})")

# --- Teams ---
teams_data = [
    ("Team 1",  "Abhishek",                          "Punah Sreetha"),
    ("Team 2",  "Sreekanth",                         "Bharathwaj"),
    ("Team 3",  "Shreenithi",                        "Naggaraaja"),
    ("Team 4",  "Thayanithi R K",                   "Boris Ajit"),
    ("Team 5",  "Harish R",                          "Gautham M"),
    ("Team 6",  "Sai Chaitanya",                     "Samson Daniel"),
    ("Team 7",  "Kishore Ram",                       "Bipin Kishore N"),
    ("Team 8",  "Lokeshwaran R",                     "Shubadharshan R N"),
    ("Team 9",  "Hrithi",                            "Gobinath Anbarasu"),
    ("Team 10", "Kiruba Arjun",                      "Selvakumar"),
    ("Team 11", "Pushpak Vinay",                     "Sarath Kumar R"),
    ("Team 12", "Madan M",                           "Karthick Asokan"),
    ("Team 13", "Mohamed Aslam",                     "Gnanaprakaasham S"),
    ("Team 14", "Sridevi",                           "Sudharshanan S"),
    ("Team 15", "Vinoth Rajendran",                  "Shanmugaraj Balasubramaniyan"),
    ("Team 16", "Ruben Raj L N",                     "Nandeeshwaran P"),
    ("Team 17", "Krishna Padmanabhan",               "Karthick Pandiyan"),
    ("Team 18", "Kaushiq S",                         "Roshini Dharmaraju"),
    ("Team 19", "Mukesh Chandra Kashyap Vishnudas",  "Shariq Kareem"),
    ("Team 20", "Ashwin V",                          "Jagadeeshwaran M"),
]

for team_name, p1_name, p2_name in teams_data:
    p1 = Player(name=p1_name)
    p2 = Player(name=p2_name)
    db.add(p1)
    db.add(p2)
    db.flush()
    team = Team(
        name=team_name,
        tournament_id=tournament.id,
        player1_id=p1.id,
        player2_id=p2.id,
    )
    db.add(team)
    print(f"  Added {team_name}: {p1_name} & {p2_name}")

db.commit()
print("\nSeed complete!")
db.close()

