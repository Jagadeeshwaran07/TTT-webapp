from pydantic import BaseModel
from typing import Optional, List
from datetime import date
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

class MatchDetailsUpdate(BaseModel):
    match_date: Optional[str] = None
    match_time: Optional[str] = None
    match_place: Optional[str] = None
    match_umpire: Optional[str] = None

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
    match_date: Optional[date] = None
    match_time: Optional[str] = None
    match_place: Optional[str] = None
    match_umpire: Optional[str] = None
    teamA: Optional[TeamOut]
    teamB: Optional[TeamOut]
    set_scores: List[SetScoreOut]

    class Config:
        from_attributes = True

    @staticmethod
    def _serialize_date(val):
        if val is None:
            return None
        return val.isoformat() if hasattr(val, 'isoformat') else str(val)

    def dict(self, *args, **kwargs):
        d = super().dict(*args, **kwargs)
        d['match_date'] = self._serialize_date(self.match_date)
        return d

    def dict(self, *args, **kwargs):
        d = super().dict(*args, **kwargs)
        # Ensure match_date is always a string if present
        if d.get("match_date") is not None and hasattr(d["match_date"], "isoformat"):
            d["match_date"] = d["match_date"].isoformat()
        return d
