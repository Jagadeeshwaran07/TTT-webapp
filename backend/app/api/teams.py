from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.tournament import Tournament
from app.models.team import Player, Team
from app.models.user import User
from app.schemas.team import TeamCreate, TeamOut

router = APIRouter(prefix="/tournaments", tags=["teams"])

@router.post("/{tournament_id}/teams", response_model=TeamOut)
def add_team(
    tournament_id: int,
    data: TeamCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found")

    p1 = Player(name=data.player1_name)
    db.add(p1)
    db.flush()

    p2 = None
    if data.player2_name:
        p2 = Player(name=data.player2_name)
        db.add(p2)
        db.flush()

    team = Team(
        name=data.name,
        tournament_id=tournament_id,
        player1_id=p1.id,
        player2_id=p2.id if p2 else None,
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    return team

@router.get("/{tournament_id}/teams", response_model=List[TeamOut])
def list_teams(tournament_id: int, db: Session = Depends(get_db)):
    return db.query(Team).filter(Team.tournament_id == tournament_id).all()

@router.delete("/{tournament_id}/teams/{team_id}", status_code=204)
def delete_team(
    tournament_id: int,
    team_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    team = db.query(Team).filter(Team.id == team_id, Team.tournament_id == tournament_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    db.delete(team)
    db.commit()
