import type { Match, Team, RoundEnum } from '../../types';

interface Props {
  matches: Match[];
  teams: Team[];
}

const ROUND_ORDER: RoundEnum[] = [
  'play_in',
  'round_of_16',
  'quarter_final',
  'semi_final',
  'upper_final',
  'losers_match',
  'qualification_final',
  'grand_final',
];

const ROUND_LABELS: Record<RoundEnum, string> = {
  play_in: 'Play-In',
  round_of_16: 'R16',
  quarter_final: 'QF',
  semi_final: 'SF',
  upper_final: 'Qualifier 1',
  losers_match: 'Elimination Match',
  qualification_final: 'Qualifier 2',
  grand_final: 'Grand Final',
};

function MatchCard({ match, hideTeams }: { match: Match; hideTeams?: boolean }) {
  const isLive = !hideTeams && match.status === 'live';
  const isDone = !hideTeams && match.status === 'completed';

  const teamAWon = isDone && match.winner_id === match.teamA_id;
  const teamBWon = isDone && match.winner_id === match.teamB_id;

  const scoreA = match.set_scores.reduce((acc, s) => acc + (s.teamA_score > s.teamB_score ? 1 : 0), 0);
  const scoreB = match.set_scores.reduce((acc, s) => acc + (s.teamB_score > s.teamA_score ? 1 : 0), 0);

  const displayTeamA = hideTeams ? 'TBD' : (match.teamA?.name ?? 'TBD');
  const displayTeamB = hideTeams ? 'TBD' : (match.teamB?.name ?? 'TBD');

  return (
    <div
      className={`rounded-lg border text-xs w-44 shrink-0 overflow-hidden shadow-sm ${
        isLive ? 'border-red-400 shadow-red-100' : isDone ? 'border-green-300' : 'border-gray-200'
      }`}
    >
      {isLive && (
        <div className="bg-red-500 text-white text-center py-0.5 text-[10px] font-bold animate-pulse">
          LIVE
        </div>
      )}
      <div className={`px-2 py-1.5 flex items-center justify-between ${teamAWon ? 'bg-green-50' : ''}`}>
        <span className={`truncate max-w-[100px] ${hideTeams ? 'text-gray-400 italic' : teamAWon ? 'font-bold text-green-700' : match.teamA_id ? '' : 'text-gray-400 italic'}`}>
          {displayTeamA}
        </span>
        {isDone && <span className="font-bold text-sm ml-1">{scoreA}</span>}
      </div>
      <div className="border-t" />
      <div className={`px-2 py-1.5 flex items-center justify-between ${teamBWon ? 'bg-green-50' : ''}`}>
        <span className={`truncate max-w-[100px] ${hideTeams ? 'text-gray-400 italic' : teamBWon ? 'font-bold text-green-700' : match.teamB_id ? '' : 'text-gray-400 italic'}`}>
          {displayTeamB}
        </span>
        {isDone && <span className="font-bold text-sm ml-1">{scoreB}</span>}
      </div>
      <div className="border-t bg-gray-50 px-2 py-0.5 text-[10px] text-gray-400 truncate">
        {match.match_label || `Match #${match.id}`}
      </div>
    </div>
  );
}

export default function BracketView({ matches }: Props) {
  if (matches.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">
        No fixtures generated yet.
      </div>
    );
  }

  // Group matches by round
  const roundGroups: Partial<Record<RoundEnum, Match[]>> = {};
  for (const m of matches) {
    if (!roundGroups[m.round]) roundGroups[m.round] = [];
    roundGroups[m.round]!.push(m);
  }

  // Hide ALL post-play-in brackets until every play-in match is completed
  const playInMatches = roundGroups['play_in'] || [];
  const playInsComplete = playInMatches.length === 0 || playInMatches.every((m) => m.status === 'completed');
  const hidePostPlayIn = !playInsComplete;

  const presentRounds = ROUND_ORDER.filter((r) => roundGroups[r] && roundGroups[r]!.length > 0);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-8 min-w-max">
        {presentRounds.map((round) => (
          <div key={round} className="flex flex-col items-center gap-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {ROUND_LABELS[round]}
            </h3>
            <div className="flex flex-col gap-4">
              {roundGroups[round]!
                .sort((a, b) => a.match_order - b.match_order)
                .map((m) => (
                  <MatchCard key={m.id} match={m} hideTeams={round !== 'play_in' && hidePostPlayIn} />
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-6 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Live
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> Completed
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" /> Upcoming
        </span>
      </div>
    </div>
  );
}
