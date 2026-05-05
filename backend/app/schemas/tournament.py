from pydantic import BaseModel
from typing import Optional
from datetime import date

class TournamentCreate(BaseModel):
    name: str
    start_date: date
    end_date: date
    match_time_window: Optional[str] = None
    format: str = "knockout"

class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    match_time_window: Optional[str] = None

class TournamentOut(BaseModel):
    id: int
    name: str
    start_date: date
    end_date: date
    match_time_window: Optional[str]
    format: str
    created_by: Optional[int]

    class Config:
        from_attributes = True
