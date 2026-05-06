"""
Bracket generator for knockout tournaments with double-chance semi-final format.

Bracket sizes by team count:
  2        → Grand Final only
  3-4      → Semis → Double-chance Finals
  5-8      → QFs → Semis → Double-chance Finals  (BYEs for top seeds)
  9-16     → R16 → QFs → Semis → Double-chance Finals  (BYEs for top seeds)
  17-32    → Play-in (n-16 matches) → R16 → QFs → Semis → Double-chance Finals

BYE rule: top seeds always get the BYEs so they auto-advance.
Each match has AT MOST one BYE — no double-BYE matches are ever created.
"""
import math
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.match import Match, RoundEnum, MatchStatus
from app.models.team import Team


def next_power_of_2(n: int) -> int:
    """Smallest power of 2 >= n (minimum 2)."""
    return 2 ** math.ceil(math.log2(max(n, 2)))


def _make_pairs(
    teams: List[Team], bracket_size: int
) -> List[Tuple[Optional[Team], Optional[Team]]]:
    """
    Pair `teams` into `bracket_size // 2` slots.
    Top seeds get BYEs (paired with None). Remaining teams pair off.
    Guarantees at most 1 BYE per match.
    """
    n = len(teams)
    byes = bracket_size - n
    pairs: List[Tuple[Optional[Team], Optional[Team]]] = []

    # Top `byes` seeds each get a BYE slot
    for i in range(byes):
        pairs.append((teams[i], None))

    # Pair the remaining real teams together
    remaining = teams[byes:]
    for i in range(0, len(remaining), 2):
        t1 = remaining[i]
        t2 = remaining[i + 1] if i + 1 < len(remaining) else None
        pairs.append((t1, t2))

    return pairs


def _set_teams(match: Match, teamA: Optional[Team], teamB: Optional[Team]) -> None:
    if teamA:
        match.teamA_id = teamA.id
    if teamB:
        match.teamB_id = teamB.id


def _advance_bye(db: Session, match: Match, winner_id: int) -> None:
    """Mark a BYE match completed and push the winner to the next match."""
    match.winner_id = winner_id
    match.status = MatchStatus.COMPLETED
    if match.next_match_id:
        nxt = db.query(Match).filter(Match.id == match.next_match_id).first()
        if nxt:
            if match.next_match_slot == "A":
                nxt.teamA_id = winner_id
            else:
                nxt.teamB_id = winner_id
            db.flush()
            # Chain: if that match is now also a BYE, resolve it too
            if nxt.teamA_id and not nxt.teamB_id:
                _advance_bye(db, nxt, nxt.teamA_id)
            elif nxt.teamB_id and not nxt.teamA_id:
                _advance_bye(db, nxt, nxt.teamB_id)


def _resolve_byes(db: Session, matches: List[Match]) -> None:
    """Auto-advance any match where only one team is set (BYE)."""
    db.flush()
    for m in matches:
        if m.teamA_id and not m.teamB_id:
            _advance_bye(db, m, m.teamA_id)
        elif m.teamB_id and not m.teamA_id:
            _advance_bye(db, m, m.teamB_id)


def generate_fixtures(db: Session, tournament_id: int) -> List[Match]:
    # ── Clean up existing fixtures ────────────────────────────────────────────
    db.query(Match).filter(Match.tournament_id == tournament_id).delete()
    db.flush()

    teams: List[Team] = (
        db.query(Team).filter(Team.tournament_id == tournament_id).all()
    )
    n = len(teams)
    if n < 2:
        raise ValueError("Need at least 2 teams to generate fixtures")

    # ── Determine bracket shape ───────────────────────────────────────────────
    if n <= 16:
        bracket_size = next_power_of_2(n)   # 2 / 4 / 8 / 16
        num_playin = 0
    else:
        bracket_size = 16                   # R16 is the top bracket round
        num_playin = n - 16                 # extra teams need play-in matches

    # ── Grand Final (always created) ──────────────────────────────────────────
    gf = Match(
        tournament_id=tournament_id,
        round=RoundEnum.GRAND_FINAL,
        match_label="Grand Final",
        match_order=0,
        status=MatchStatus.UPCOMING,
    )
    db.add(gf)
    db.flush()

    # ── 2-team shortcut: just Grand Final ─────────────────────────────────────
    if bracket_size == 2:
        gf.teamA_id = teams[0].id
        gf.teamB_id = teams[1].id
        db.commit()
        return db.query(Match).filter(Match.tournament_id == tournament_id).all()

    # ── Double-chance finals structure (4+ teams) ─────────────────────────────
    qual = Match(
        tournament_id=tournament_id,
        round=RoundEnum.QUALIFICATION_FINAL,
        match_label="Qualification Final",
        match_order=0,
        status=MatchStatus.UPCOMING,
        next_match_id=gf.id,
        next_match_slot="B",
    )
    db.add(qual)
    db.flush()

    upper = Match(
        tournament_id=tournament_id,
        round=RoundEnum.UPPER_FINAL,
        match_label="Upper Final",
        match_order=0,
        status=MatchStatus.UPCOMING,
        next_match_id=gf.id,
        next_match_slot="A",
        loser_next_match_id=qual.id,
        loser_next_match_slot="A",
    )
    db.add(upper)
    db.flush()

    losers = Match(
        tournament_id=tournament_id,
        round=RoundEnum.LOSERS_MATCH,
        match_label="Losers Match",
        match_order=0,
        status=MatchStatus.UPCOMING,
        next_match_id=qual.id,
        next_match_slot="B",
    )
    db.add(losers)
    db.flush()

    sf1 = Match(
        tournament_id=tournament_id,
        round=RoundEnum.SEMI_FINAL,
        match_label="Semi Final 1",
        match_order=1,
        status=MatchStatus.UPCOMING,
        next_match_id=upper.id,
        next_match_slot="A",
        loser_next_match_id=losers.id,
        loser_next_match_slot="A",
    )
    sf2 = Match(
        tournament_id=tournament_id,
        round=RoundEnum.SEMI_FINAL,
        match_label="Semi Final 2",
        match_order=2,
        status=MatchStatus.UPCOMING,
        next_match_id=upper.id,
        next_match_slot="B",
        loser_next_match_id=losers.id,
        loser_next_match_slot="B",
    )
    db.add_all([sf1, sf2])
    db.flush()

    # ── 4-team bracket: assign directly into semis ────────────────────────────
    if bracket_size == 4:
        pairs = _make_pairs(teams, 4)      # 2 pairs → sf1, sf2
        _set_teams(sf1, pairs[0][0], pairs[0][1])
        _set_teams(sf2, pairs[1][0], pairs[1][1])
        _resolve_byes(db, [sf1, sf2])
        db.commit()
        return db.query(Match).filter(Match.tournament_id == tournament_id).all()

    # ── Quarter Finals (4 matches) ────────────────────────────────────────────
    qf_matches: List[Match] = []
    for i in range(4):
        nxt_sf = sf1 if i < 2 else sf2
        slot = "A" if i % 2 == 0 else "B"
        qf = Match(
            tournament_id=tournament_id,
            round=RoundEnum.QUARTER_FINAL,
            match_label=f"Quarter Final {i + 1}",
            match_order=i + 1,
            status=MatchStatus.UPCOMING,
            next_match_id=nxt_sf.id,
            next_match_slot=slot,
        )
        qf_matches.append(qf)
    db.add_all(qf_matches)
    db.flush()

    # ── 8-team bracket: assign into QFs ──────────────────────────────────────
    if bracket_size == 8:
        pairs = _make_pairs(teams, 8)      # 4 pairs → 4 QFs
        for i, qf in enumerate(qf_matches):
            _set_teams(qf, pairs[i][0], pairs[i][1])
        _resolve_byes(db, qf_matches)
        db.commit()
        return db.query(Match).filter(Match.tournament_id == tournament_id).all()

    # ── Round of 16 (8 matches) ───────────────────────────────────────────────
    r16_matches: List[Match] = []
    for i in range(8):
        nxt_qf = qf_matches[i // 2]
        slot = "A" if i % 2 == 0 else "B"
        r16 = Match(
            tournament_id=tournament_id,
            round=RoundEnum.ROUND_OF_16,
            match_label=f"R16 Match {i + 1}",
            match_order=i + 1,
            status=MatchStatus.UPCOMING,
            next_match_id=nxt_qf.id,
            next_match_slot=slot,
        )
        r16_matches.append(r16)
    db.add_all(r16_matches)
    db.flush()

    # ── 9-16 teams: assign into R16 (BYEs for top seeds) ─────────────────────
    if num_playin == 0:
        pairs = _make_pairs(teams, 16)     # 8 pairs → 8 R16 matches
        for i, r16 in enumerate(r16_matches):
            _set_teams(r16, pairs[i][0], pairs[i][1])
        _resolve_byes(db, r16_matches)
        db.commit()
        return db.query(Match).filter(Match.tournament_id == tournament_id).all()

    # ── 17-32 teams: R16 with play-in ─────────────────────────────────────────
    #
    # num_direct = 16 - num_playin  top seeds → straight into R16
    # num_playin              = n - 16  play-in matches (each uses 2 teams)
    #
    # Pairing in R16:
    #   • First num_playin R16 matches: 1 direct seed vs TBD (play-in winner)
    #   • Remaining R16 matches: direct seed vs direct seed
    #
    num_direct = 16 - num_playin          # e.g. 19 teams → 13 direct
    direct_teams = teams[:num_direct]
    playin_teams = teams[num_direct:]     # 2 * num_playin teams

    # Fill R16: top num_playin direct seeds are paired with a play-in slot (None)
    r16_pairs: List[Tuple[Optional[Team], Optional[Team]]] = []
    for i in range(num_playin):
        r16_pairs.append((direct_teams[i], None))   # slot B = play-in winner TBD

    # Remaining direct seeds pair with each other
    remaining_direct = direct_teams[num_playin:]
    for i in range(0, len(remaining_direct), 2):
        t1 = remaining_direct[i]
        t2 = remaining_direct[i + 1] if i + 1 < len(remaining_direct) else None
        r16_pairs.append((t1, t2))

    for i, r16 in enumerate(r16_matches):
        if i < len(r16_pairs):
            _set_teams(r16, r16_pairs[i][0], r16_pairs[i][1])

    # Create play-in matches; each feeds into the TBD slot B of r16_matches[i]
    for i in range(num_playin):
        t1 = playin_teams[i * 2]
        t2 = playin_teams[i * 2 + 1] if i * 2 + 1 < len(playin_teams) else None
        pi = Match(
            tournament_id=tournament_id,
            round=RoundEnum.PLAY_IN,
            match_label=f"Play-in {i + 1}",
            match_order=i + 1,
            status=MatchStatus.UPCOMING,
            next_match_id=r16_matches[i].id,
            next_match_slot="B",
            teamA_id=t1.id,
            teamB_id=t2.id if t2 else None,
        )
        db.add(pi)

    # Only resolve BYEs on R16 matches that are NOT fed by a play-in winner.
    # The first num_playin R16 slots intentionally have teamB=None (pending play-in),
    # so we must not treat them as BYEs.
    non_playin_r16 = r16_matches[num_playin:]
    _resolve_byes(db, non_playin_r16)
    db.commit()
    return db.query(Match).filter(Match.tournament_id == tournament_id).all()
