import type { Match } from '../../types';
import { Zap, Trophy, Clock, Calendar, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  matches: Match[];
  allMatches?: Match[];
  showAll?: boolean;
}

const ROUND_LABELS: Record<string, string> = {
  play_in: 'Play-In',
  round_of_32: 'Round of 32',
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
    <div className="mt-3 flex gap-2">
      {match.set_scores
        .sort((a, b) => a.set_number - b.set_number)
        .map((s) => {
          const aWon = s.teamA_score > s.teamB_score;
          return (
            <div
              key={s.set_number}
              className="flex flex-col items-center rounded-lg bg-gray-50 px-3 py-1.5"
            >
              <span className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                S{s.set_number}
              </span>
              <span className="font-mono text-xs font-bold tabular-nums text-gray-700">
                <span className={aWon ? 'text-green-600' : ''}>{s.teamA_score}</span>
                <span className="mx-0.5 text-gray-300">–</span>
                <span className={!aWon ? 'text-green-600' : ''}>{s.teamB_score}</span>
              </span>
            </div>
          );
        })}
    </div>
  );
}

function TeamSlot({
  name,
  playerInfo,
  isWinner,
  isTBD,
  hideTeams,
}: {
  name: string;
  playerInfo?: string;
  isWinner: boolean;
  isTBD: boolean;
  hideTeams: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 transition-colors ${
        isWinner && !hideTeams
          ? 'bg-green-50 ring-1 ring-green-200'
          : 'border border-gray-100 bg-white'
      }`}
    >
      <div className="min-w-0">
        <span
          className={`block truncate text-sm ${
            isTBD || hideTeams
              ? 'italic text-gray-300'
              : isWinner
              ? 'font-semibold text-green-700'
              : 'font-medium text-gray-800'
          }`}
        >
          {name}
        </span>
        {playerInfo && !hideTeams && (
          <span className="block truncate text-[11px] text-gray-400">{playerInfo}</span>
        )}
      </div>
      {isWinner && !hideTeams && (
        <span className="ml-2 shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase text-green-600">
          Win
        </span>
      )}
    </div>
  );
}

export default function LiveMatches({ matches, allMatches, showAll = false }: Props) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
          {showAll ? <Trophy size={24} /> : <Zap size={24} />}
        </div>
        <h3 className="mb-1 text-base font-semibold text-gray-700">
          {showAll ? 'No matches yet' : 'No live matches'}
        </h3>
        <p className="text-sm text-gray-400">
          {showAll
            ? 'Matches will appear once fixtures are generated.'
            : 'Live matches will appear here when they start.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {matches.map((match, idx) => {
        const sourceMatches = allMatches || matches;
        const playInMatches = sourceMatches.filter((m) => m.round === 'play_in');
        const playInsComplete =
          playInMatches.length === 0 || playInMatches.every((m) => m.status === 'completed');
        const hideTeams = match.round !== 'play_in' && !playInsComplete;

        const isLive = !hideTeams && match.status === 'live';
        const isDone = !hideTeams && match.status === 'completed';

        const teamAWon = isDone && match.winner_id === match.teamA_id;
        const teamBWon = isDone && match.winner_id === match.teamB_id;

        const displayTeamA = hideTeams ? 'TBD' : (match.teamA?.name ?? 'TBD');
        const displayTeamB = hideTeams ? 'TBD' : (match.teamB?.name ?? 'TBD');

        const playerInfoA =
          !hideTeams && match.teamA?.player2
            ? `${match.teamA.player1.name} / ${match.teamA.player2.name}`
            : undefined;
        const playerInfoB =
          !hideTeams && match.teamB?.player2
            ? `${match.teamB.player1.name} / ${match.teamB.player2.name}`
            : undefined;

        return (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.04 }}
            className={`rounded-2xl border p-5 transition-all duration-200 ${
              isLive
                ? 'border-red-200 bg-white shadow-md shadow-red-100/30 ring-1 ring-red-100'
                : isDone
                ? 'border-green-200/60 bg-white'
                : 'border-gray-200/60 bg-white hover:border-gray-300'
            }`}
          >
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {ROUND_LABELS[match.round] || match.round}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">
                  {match.match_label || `#${match.id}`}
                </span>
                {isLive && (
                  <span className="animate-pulse-live inline-flex items-center gap-0.5 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    <Zap size={8} /> Live
                  </span>
                )}
                {isDone && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase text-green-600">
                    FT
                  </span>
                )}
              </div>
            </div>

            {/* Match meta */}
            {(match.match_date || match.match_time || match.match_place) && (
              <div className="mb-3 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-400">
                {match.match_date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(match.match_date + 'T00:00:00').toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
                {match.match_time && (
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {match.match_time}
                  </span>
                )}
                {match.match_place && (
                  <span className="flex items-center gap-1">
                    <MapPin size={10} />
                    {match.match_place}
                  </span>
                )}
              </div>
            )}

            {/* Teams */}
            <div className="space-y-2">
              <TeamSlot
                name={displayTeamA}
                playerInfo={playerInfoA}
                isWinner={teamAWon}
                isTBD={hideTeams || !match.teamA_id}
                hideTeams={hideTeams}
              />
              <TeamSlot
                name={displayTeamB}
                playerInfo={playerInfoB}
                isWinner={teamBWon}
                isTBD={hideTeams || !match.teamB_id}
                hideTeams={hideTeams}
              />
            </div>

            {!hideTeams && <SetScores match={match} />}
          </motion.div>
        );
      })}
    </div>
  );
}
