from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from typing import List
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.match import Match, SetScore, MatchStatus
from app.models.team import Team
from app.models.match import RoundEnum
from app.models.user import User
from app.schemas.match import MatchOut, MatchScoreUpdate, MatchStatusUpdate, MatchLabelUpdate, MatchTeamsUpdate, MatchDetailsUpdate
from app.services.scoring import propagate_winner, determine_match_winner
from app.websockets.manager import manager

router = APIRouter(prefix="/tournaments", tags=["fixtures"])

@router.post("/{tournament_id}/generate-fixtures")
def generate_fixtures(
    tournament_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    from app.services.bracket import generate_fixtures as gen
    try:
        matches = gen(db, tournament_id)
        return {"message": f"Generated {len(matches)} matches"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{tournament_id}/randomize-seeds")
async def randomize_seeds(
    tournament_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    from app.services.bracket import randomize_entry_round
    try:
        randomize_entry_round(db, tournament_id)
        db.commit()
        await manager.broadcast(tournament_id, {"type": "draw_randomized"})
        return {"message": "Entry-round draw randomized successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{tournament_id}/matches", response_model=List[MatchOut])
def list_matches(tournament_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Match)
        .options(
            selectinload(Match.teamA),
            selectinload(Match.teamB),
            selectinload(Match.set_scores),
        )
        .filter(Match.tournament_id == tournament_id)
        .order_by(Match.round, Match.match_order)
        .all()
    )


matches_router = APIRouter(prefix="/matches", tags=["matches"])

@matches_router.put("/{match_id}/score")
async def update_score(
    match_id: int,
    data: MatchScoreUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    if match.status == MatchStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Match already completed")

    # Upsert set scores
    for s in data.sets:
        existing = db.query(SetScore).filter(
            SetScore.match_id == match_id, SetScore.set_number == s.set_number
        ).first()
        if existing:
            existing.teamA_score = s.teamA_score
            existing.teamB_score = s.teamB_score
        else:
            db.add(SetScore(
                match_id=match_id,
                set_number=s.set_number,
                teamA_score=s.teamA_score,
                teamB_score=s.teamB_score,
            ))
    db.flush()

    sets = db.query(SetScore).filter(SetScore.match_id == match_id).all()
    result = determine_match_winner(sets)
    if result:
        propagate_winner(db, match)

    db.commit()
    db.refresh(match)

    # Broadcast via WebSocket
    await manager.broadcast(match.tournament_id, {
        "type": "score_update",
        "match_id": match_id,
        "status": match.status,
        "winner_id": match.winner_id,
    })
    return {"message": "Score updated"}

@matches_router.put("/{match_id}/status")
async def update_status(
    match_id: int,
    data: MatchStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    match.status = data.status
    db.commit()
    await manager.broadcast(match.tournament_id, {
        "type": "status_update",
        "match_id": match_id,
        "status": data.status,
    })
    return {"message": "Status updated"}

@matches_router.put("/{match_id}/label")
def update_label(
    match_id: int,
    data: MatchLabelUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    match.match_label = data.match_label
    db.commit()
    return {"message": "Label updated"}


@matches_router.put("/{match_id}/details")
def update_details(
    match_id: int,
    data: MatchDetailsUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    from datetime import date as date_type
    if data.match_date is not None:
        match.match_date = date_type.fromisoformat(data.match_date) if data.match_date else None
    else:
        match.match_date = None
    match.match_time = data.match_time
    match.match_place = data.match_place
    match.match_umpire = data.match_umpire
    db.commit()
    return {"message": "Details updated"}


@matches_router.put("/{match_id}/teams")
async def update_match_teams(
    match_id: int,
    data: MatchTeamsUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.round != RoundEnum.PLAY_IN:
        raise HTTPException(status_code=400, detail="Only play-in matches can be edited manually")

    if match.status != MatchStatus.UPCOMING or match.winner_id or match.loser_id:
        raise HTTPException(status_code=400, detail="Can only edit upcoming, undecided play-in matches")

    if data.teamA_id and data.teamB_id and data.teamA_id == data.teamB_id:
        raise HTTPException(status_code=400, detail="A team cannot play against itself")

    team_ids = [tid for tid in [data.teamA_id, data.teamB_id] if tid is not None]
    if team_ids:
        valid_ids = {
            t.id
            for t in db.query(Team)
            .filter(Team.tournament_id == match.tournament_id, Team.id.in_(team_ids))
            .all()
        }
        missing_ids = [tid for tid in team_ids if tid not in valid_ids]
        if missing_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid team selection for this tournament: {missing_ids}",
            )

    # Reset any stale scoring artifacts before changing assignments.
    db.query(SetScore).filter(SetScore.match_id == match.id).delete()
    match.teamA_id = data.teamA_id
    match.teamB_id = data.teamB_id
    match.winner_id = None
    match.loser_id = None
    match.status = MatchStatus.UPCOMING

    db.commit()

    await manager.broadcast(match.tournament_id, {
        "type": "match_teams_update",
        "match_id": match_id,
    })
    return {"message": "Play-in teams updated"}


