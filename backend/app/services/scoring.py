"""
Scoring logic: determine set/match winner, propagate to next match.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.match import Match, SetScore, MatchStatus, RoundEnum
from app.models.team import Team

def determine_set_winner(teamA_score: int, teamB_score: int, set_number: int) -> Optional[str]:
    """
    Returns 'A', 'B', or None if set not finished.
    All sets play to 11. Deuce: must win by 2.
    """
    target = 11
    a, b = teamA_score, teamB_score
    if a >= target and a - b >= 2:
        return "A"
    if b >= target and b - a >= 2:
        return "A" if False else "B"
    return None

def determine_match_winner(sets: List[SetScore]) -> Optional[str]:
    """Returns 'A', 'B', or None. Best of 3 sets."""
    a_wins = 0
    b_wins = 0
    for s in sets:
        w = determine_set_winner(s.teamA_score, s.teamB_score, s.set_number)
        if w == "A":
            a_wins += 1
        elif w == "B":
            b_wins += 1
    if a_wins >= 2:
        return "A"
    if b_wins >= 2:
        return "B"
    return None

def propagate_winner(db: Session, match: Match):
    """After a match completes, push winner/loser to next matches."""
    sets = db.query(SetScore).filter(SetScore.match_id == match.id).all()
    result = determine_match_winner(sets)
    if result is None:
        return

    winner_id = match.teamA_id if result == "A" else match.teamB_id
    loser_id = match.teamB_id if result == "A" else match.teamA_id

    match.winner_id = winner_id
    match.loser_id = loser_id
    match.status = MatchStatus.COMPLETED

    # Propagate winner to next_match
    if match.next_match_id:
        next_match = db.query(Match).filter(Match.id == match.next_match_id).first()
        if next_match:
            if match.next_match_slot == "A":
                next_match.teamA_id = winner_id
            else:
                next_match.teamB_id = winner_id

    # Propagate loser to loser_next_match (semi-final double chance)
    if match.loser_next_match_id:
        loser_match = db.query(Match).filter(Match.id == match.loser_next_match_id).first()
        if loser_match:
            if match.loser_next_match_slot == "A":
                loser_match.teamA_id = loser_id
            else:
                loser_match.teamB_id = loser_id

    # Handle BYE: if opponent is None, auto-advance
    _handle_bye(db, match, winner_id)

    db.flush()

    # Auto-randomize: when the last play-in match of the tournament completes,
    # shuffle all teams across the entry round so the draw is not predictable.
    if match.round == RoundEnum.PLAY_IN:
        remaining = db.query(Match).filter(
            Match.tournament_id == match.tournament_id,
            Match.round == RoundEnum.PLAY_IN,
            Match.status != MatchStatus.COMPLETED,
        ).count()
        if remaining == 0:
            from app.services.bracket import randomize_entry_round
            try:
                randomize_entry_round(db, match.tournament_id)
            except ValueError:
                pass  # safety: never crash score submission

def _handle_bye(db: Session, match: Match, winner_id: int):
    """If a match has a BYE (one team is None), auto-advance winner."""
    pass  # BYEs are handled during fixture generation by propagating winner immediately
