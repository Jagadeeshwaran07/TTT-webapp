import type { Match } from '../../types';
import { Zap } from 'lucide-react';

interface Props {
  matches: Match[];
  allMatches?: Match[];
  showAll?: boolean;
}

const ROUND_LABELS: Record<string, string> = {
  play_in: 'Play-In',
  round_of_16: 'Round of 16',
  quarter_final: 'Quarter Final',
  semi_final: 'Semi Final',
  upper_final: 'Qualifier 1',
  losers_match: 'Elimination Match',
  qualification_final: 'Qualifier 2',
  grand_final: 'Grand Final',
};

function SetScores({ match }: { match: Match }) {
  if (match.set_scores.length === 0) return null;
  return (
    <div className="flex gap-3 mt-2 text-xs">
      {match.set_scores
        .sort((a, b) => a.set_number - b.set_number)
        .map((s) => (
          <div key={s.set_number} className="text-center">
            <div className="text-gray-400 mb-0.5">S{s.set_number}</div>
            <div className="font-mono font-bold">
              {s.teamA_score} – {s.teamB_score}
            </div>
          </div>
        ))}
    </div>
  );
}

export default function LiveMatches({ matches, allMatches, showAll = false }: Props) {
  if (matches.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">
        {showAll ? 'No matches yet.' : 'No live matches right now.'}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {matches.map((match) => {
        // Hide ALL non-play-in team names while any play-in match is still incomplete
        const sourceMatches = allMatches || matches;
        const playInMatches = sourceMatches.filter((m) => m.round === 'play_in');
        const playInsComplete = playInMatches.length === 0 || playInMatches.every((m) => m.status === 'completed');
        const hideTeams = match.round !== 'play_in' && !playInsComplete;

        // When hiding, treat the match as neutral (no live/done styling)
        const isLive = !hideTeams && match.status === 'live';
        const isDone = !hideTeams && match.status === 'completed';

        const teamAWon = isDone && match.winner_id === match.teamA_id;
        const teamBWon = isDone && match.winner_id === match.teamB_id;

        const displayTeamA = hideTeams ? 'TBD' : (match.teamA?.name ?? 'TBD');
        const displayTeamB = hideTeams ? 'TBD' : (match.teamB?.name ?? 'TBD');

        return (
          <div
            key={match.id}
            className={`border rounded-xl p-4 ${
              isLive
                ? 'border-red-300 bg-red-50 shadow-red-100 shadow'
                : isDone
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {ROUND_LABELS[match.round] || match.round}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {match.match_label || `Match #${match.id}`}
                </span>
                {isLive && (
                  <span className="flex items-center gap-1 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">
                    <Zap size={8} /> LIVE
                  </span>
                )}
                {isDone && (
                  <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                    FT
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${teamAWon && !hideTeams ? 'bg-green-100' : 'bg-white border'}`}>
                <span className={`font-medium ${hideTeams ? 'text-gray-400 italic' : teamAWon ? 'text-green-700' : match.teamA_id ? '' : 'text-gray-400 italic'}`}>
                  {displayTeamA}
                  {!hideTeams && match.teamA?.player2 && (
                    <span className="text-xs text-gray-400 ml-1">
                      ({match.teamA.player1.name} / {match.teamA.player2.name})
                    </span>
                  )}
                </span>
                {teamAWon && !hideTeams && <span className="text-xs text-green-600 font-bold">WIN</span>}
              </div>
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${teamBWon && !hideTeams ? 'bg-green-100' : 'bg-white border'}`}>
                <span className={`font-medium ${hideTeams ? 'text-gray-400 italic' : teamBWon ? 'text-green-700' : match.teamB_id ? '' : 'text-gray-400 italic'}`}>
                  {displayTeamB}
                  {!hideTeams && match.teamB?.player2 && (
                    <span className="text-xs text-gray-400 ml-1">
                      ({match.teamB.player1.name} / {match.teamB.player2.name})
                    </span>
                  )}
                </span>
                {teamBWon && !hideTeams && <span className="text-xs text-green-600 font-bold">WIN</span>}
              </div>
            </div>

            {!hideTeams && <SetScores match={match} />}
          </div>
        );
      })}
    </div>
  );
}
