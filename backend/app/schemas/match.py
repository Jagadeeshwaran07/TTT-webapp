from pydantic import BaseModel
from typing import Optional, List
from app.models.match import RoundEnum, MatchStatus
from app.schemas.team import TeamOut

class SetScoreOut(BaseModel):
    id: int
    set_number: int
    teamA_score: int
    teamB_score: int
    class Config:
        from_attributes = True

class SetScoreUpdate(BaseModel):
    set_number: int
    teamA_score: int
    teamB_score: int

class MatchScoreUpdate(BaseModel):
    sets: List[SetScoreUpdate]

class MatchStatusUpdate(BaseModel):
    status: MatchStatus

class MatchLabelUpdate(BaseModel):
    match_label: str

class MatchTeamsUpdate(BaseModel):
    teamA_id: Optional[int] = None
    teamB_id: Optional[int] = None

class MatchOut(BaseModel):
    id: int
    tournament_id: int
    round: RoundEnum
    match_label: Optional[str]
    teamA_id: Optional[int]
    teamB_id: Optional[int]
    winner_id: Optional[int]
    loser_id: Optional[int]
    next_match_id: Optional[int]
    loser_next_match_id: Optional[int]
    status: MatchStatus
    match_order: int
    teamA: Optional[TeamOut]
    teamB: Optional[TeamOut]
    set_scores: List[SetScoreOut]
    class Config:
        from_attributes = True
