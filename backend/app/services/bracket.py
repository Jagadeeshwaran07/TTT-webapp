"""
Bracket generator for knockout tournaments with double-chance semi-final format.

Bracket sizes by team count:
  2        → Grand Final only
  3-4      → Semis → Double-chance Finals
  5-8      → QFs → Semis → Double-chance Finals  (BYEs for top seeds)
  9-15     → Play-in (n-8 matches) → QFs → Semis → Double-chance Finals
  16       → R16 (all direct, no BYEs) → QFs → Semis → Double-chance Finals
  17-32    → Play-in (n-16 matches) → R16 → QFs → Semis → Double-chance Finals
  33-64    → Play-in (n-32 matches) → R32 → R16 → QFs → Semis → Double-chance Finals

BYE rule (direct-assignment paths only): top seeds get BYEs so they auto-advance.
Play-in paths have no BYEs — every entry-round slot is either a direct seed or
an awaiting play-in winner.
Max supported: 64 teams.
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


def _fill_entry_with_playin(
    db: Session,
    tournament_id: int,
    entry_matches: List[Match],
    teams: List[Team],
    num_playin: int,
    pi_label_prefix: str = "Play-in",
) -> None:
    """
    Unified slot-assignment for play-in paths.

    Flattens entry_matches into (len*2) slots. Fills slots 0..num_direct-1 with
    top direct seeds, then creates num_playin play-in matches that each feed one
    of the remaining slots. Only resolves BYEs on entry matches that have no
    play-in feeder (i.e. both slots are direct teams that may include a BYE).
    """
    entry_slots = len(entry_matches) * 2
    num_direct = entry_slots - num_playin
    direct_teams = teams[:num_direct]
    playin_teams = teams[num_direct:]   # exactly 2 * num_playin teams

    # Assign direct teams to their entry slots
    for k, team in enumerate(direct_teams):
        m = entry_matches[k // 2]
        if k % 2 == 0:
            m.teamA_id = team.id
        else:
            m.teamB_id = team.id

    # Create play-in matches for remaining slots
    pi_entry_indices: set = set()
    for j in range(num_playin):
        slot_k = num_direct + j
        target = entry_matches[slot_k // 2]
        target_slot = "A" if slot_k % 2 == 0 else "B"
        pi_entry_indices.add(slot_k // 2)
        t1 = playin_teams[j * 2]
        t2 = playin_teams[j * 2 + 1] if j * 2 + 1 < len(playin_teams) else None
        pi = Match(
            tournament_id=tournament_id,
            round=RoundEnum.PLAY_IN,
            match_label=f"{pi_label_prefix} {j + 1}",
            match_order=j + 1,
            status=MatchStatus.UPCOMING,
            next_match_id=target.id,
            next_match_slot=target_slot,
            teamA_id=t1.id,
            teamB_id=t2.id if t2 else None,
        )
        db.add(pi)

    # Resolve BYEs only on entry matches not fed by any play-in winner
    non_playin = [m for i, m in enumerate(entry_matches) if i not in pi_entry_indices]
    _resolve_byes(db, non_playin)


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
    if n <= 8:
        bracket_size = next_power_of_2(n)   # 2 / 4 / 8
        num_playin = 0
    elif n <= 15:
        bracket_size = 8                    # QF is entry round; play-in feeds QF
        num_playin = n - 8
    elif n <= 32:
        bracket_size = 16                   # R16 is entry round
        num_playin = max(0, n - 16)         # 0 for n=16, else n-16
    elif n <= 64:
        bracket_size = 32                   # R32 is entry round
        num_playin = n - 32
    else:
        raise ValueError("Max 64 teams supported")

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
        match_label="Qualifier 2",
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
        match_label="Qualifier 1",
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
        match_label="Elimination Match",
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

    # ── 5-8 teams: assign into QFs with BYEs ────────────────────────────────
    if bracket_size == 8 and num_playin == 0:
        pairs = _make_pairs(teams, 8)      # 4 pairs → 4 QFs
        for i, qf in enumerate(qf_matches):
            _set_teams(qf, pairs[i][0], pairs[i][1])
        _resolve_byes(db, qf_matches)
        db.commit()
        return db.query(Match).filter(Match.tournament_id == tournament_id).all()

    # ── 9-15 teams: play-in → QFs ─────────────────────────────────────────────
    if bracket_size == 8 and num_playin > 0:
        _fill_entry_with_playin(db, tournament_id, qf_matches, teams, num_playin)
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

    # ── n=16: all direct into R16, no play-in, no BYEs ─────────────────────
    if num_playin == 0:
        pairs = _make_pairs(teams, 16)     # 8 pairs → 8 R16 matches (0 BYEs)
        for i, r16 in enumerate(r16_matches):
            _set_teams(r16, pairs[i][0], pairs[i][1])
        _resolve_byes(db, r16_matches)
        db.commit()
        return db.query(Match).filter(Match.tournament_id == tournament_id).all()

    # ── 17-32 teams: R16 with play-in ─────────────────────────────────────────
    if bracket_size == 16:
        _fill_entry_with_playin(db, tournament_id, r16_matches, teams, num_playin)
        db.commit()
        return db.query(Match).filter(Match.tournament_id == tournament_id).all()

    # ── Round of 32 (16 matches) ───────────────────────────────────────────────
    r32_matches: List[Match] = []
    for i in range(16):
        nxt_r16 = r16_matches[i // 2]
        slot = "A" if i % 2 == 0 else "B"
        r32 = Match(
            tournament_id=tournament_id,
            round=RoundEnum.ROUND_OF_32,
            match_label=f"R32 Match {i + 1}",
            match_order=i + 1,
            status=MatchStatus.UPCOMING,
            next_match_id=nxt_r16.id,
            next_match_slot=slot,
        )
        r32_matches.append(r32)
    db.add_all(r32_matches)
    db.flush()

    # ── 33-64 teams: R32 with play-in ─────────────────────────────────────────
    _fill_entry_with_playin(db, tournament_id, r32_matches, teams, num_playin)
    db.commit()
    return db.query(Match).filter(Match.tournament_id == tournament_id).all()
