from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.tournament import Tournament
from app.models.match import Match, SetScore
from app.models.team import Team
from app.models.user import User
from app.schemas.tournament import TournamentCreate, TournamentOut, TournamentUpdate

router = APIRouter(prefix="/tournaments", tags=["tournaments"])

@router.post("", response_model=TournamentOut)
def create_tournament(
    data: TournamentCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    t = Tournament(**data.model_dump(), created_by=admin.id)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

@router.get("", response_model=List[TournamentOut])
def list_tournaments(db: Session = Depends(get_db)):
    return db.query(Tournament).all()

@router.get("/{tournament_id}", response_model=TournamentOut)
def get_tournament(tournament_id: int, db: Session = Depends(get_db)):
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return t

@router.put("/{tournament_id}", response_model=TournamentOut)
def update_tournament(
    tournament_id: int,
    data: TournamentUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(t, field, value)
    db.commit()
    db.refresh(t)
    return t

@router.delete("/{tournament_id}", status_code=204)
def delete_tournament(
    tournament_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found")
    # Delete in FK-safe order: set_scores → matches → teams → tournament
    match_ids = [m.id for m in db.query(Match.id).filter(Match.tournament_id == tournament_id).all()]
    if match_ids:
        db.query(SetScore).filter(SetScore.match_id.in_(match_ids)).delete(synchronize_session=False)
    db.query(Match).filter(Match.tournament_id == tournament_id).delete(synchronize_session=False)
    db.query(Team).filter(Team.tournament_id == tournament_id).delete(synchronize_session=False)
    db.delete(t)
    db.commit()
