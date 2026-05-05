from pydantic import BaseModel
from typing import Optional

class PlayerCreate(BaseModel):
    name: str

class PlayerOut(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class TeamCreate(BaseModel):
    name: str
    player1_name: str
    player2_name: Optional[str] = None

class TeamOut(BaseModel):
    id: int
    name: str
    tournament_id: int
    player1: PlayerOut
    player2: Optional[PlayerOut]
    class Config:
        from_attributes = True
