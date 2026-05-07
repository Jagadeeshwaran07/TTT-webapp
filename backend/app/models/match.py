from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Date
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class RoundEnum(str, enum.Enum):
    PLAY_IN = "play_in"
    ROUND_OF_32 = "round_of_32"
    ROUND_OF_16 = "round_of_16"
    QUARTER_FINAL = "quarter_final"
    SEMI_FINAL = "semi_final"
    UPPER_FINAL = "upper_final"
    LOSERS_MATCH = "losers_match"
    QUALIFICATION_FINAL = "qualification_final"
    GRAND_FINAL = "grand_final"

class MatchStatus(str, enum.Enum):
    UPCOMING = "upcoming"
    LIVE = "live"
    COMPLETED = "completed"

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    round = Column(Enum(RoundEnum), nullable=False)
    match_label = Column(String)  # editable label e.g. "Match 1"
    teamA_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    teamB_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    winner_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    loser_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    next_match_id = Column(Integer, ForeignKey("matches.id"), nullable=True)
    next_match_slot = Column(String, nullable=True)  # 'A' or 'B'
    # For double-chance semi path
    loser_next_match_id = Column(Integer, ForeignKey("matches.id"), nullable=True)
    loser_next_match_slot = Column(String, nullable=True)
    status = Column(Enum(MatchStatus), default=MatchStatus.UPCOMING)
    match_order = Column(Integer, default=0)  # ordering within round
    match_date = Column(Date, nullable=True)
    match_time = Column(String, nullable=True)  # "HH:MM"
    match_place = Column(String, nullable=True)
    match_umpire = Column(String, nullable=True)

    tournament = relationship("Tournament", back_populates="matches")
    teamA = relationship("Team", foreign_keys=[teamA_id])
    teamB = relationship("Team", foreign_keys=[teamB_id])
    winner = relationship("Team", foreign_keys=[winner_id])
    loser = relationship("Team", foreign_keys=[loser_id])
    set_scores = relationship("SetScore", back_populates="match", cascade="all, delete-orphan")

class SetScore(Base):
    __tablename__ = "set_scores"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    set_number = Column(Integer, nullable=False)
    teamA_score = Column(Integer, default=0)
    teamB_score = Column(Integer, default=0)

    match = relationship("Match", back_populates="set_scores")
