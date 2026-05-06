import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTournament, getMatches, getTeams } from '../api/client';
import { useTournamentSocket } from '../hooks/useSocket';
import type { Tournament, Match, Team } from '../types';
import BracketView from '../components/bracket/BracketView';
import LiveMatches from '../components/matches/LiveMatches';
import { Trophy, Zap, LayoutList } from 'lucide-react';

type Tab = 'bracket' | 'live' | 'all';

export default function TournamentPage() {
  const { id } = useParams<{ id: string }>();
  const tournamentId = Number(id);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('bracket');

  const { data: tournament } = useQuery<Tournament>({
    queryKey: ['tournament', tournamentId],
    queryFn: () => getTournament(tournamentId).then((r) => r.data),
  });

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ['matches', tournamentId],
    queryFn: () => getMatches(tournamentId).then((r) => r.data),
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['teams', tournamentId],
    queryFn: () => getTeams(tournamentId).then((r) => r.data),
  });

  const handleSocketMessage = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['matches', tournamentId] });
  }, [queryClient, tournamentId]);

  useTournamentSocket(tournamentId, handleSocketMessage);

  if (!tournament) return <div className="p-8 text-gray-500">Loading...</div>;

  const liveMatches = matches.filter((m) => m.status === 'live');

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Trophy className="text-yellow-500" size={28} />
          <h1 className="text-2xl md:text-3xl font-bold">{tournament.name}</h1>
          {liveMatches.length > 0 && (
            <span className="flex items-center gap-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              <Zap size={10} /> LIVE
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm">
          {tournament.start_date} → {tournament.end_date}
          {tournament.match_time_window && ` · ${tournament.match_time_window}`}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b mb-6">
        {([['bracket', 'Bracket', <LayoutList size={14} />], ['live', `Live (${liveMatches.length})`, <Zap size={14} />], ['all', 'All Matches', <LayoutList size={14} />]] as const).map(
          ([key, label, icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {icon} {label}
            </button>
          )
        )}
      </div>

      {tab === 'bracket' && <BracketView matches={matches} teams={teams} />}
      {tab === 'live' && <LiveMatches matches={liveMatches} allMatches={matches} />}
      {tab === 'all' && <LiveMatches matches={matches} showAll />}
    </div>
  );
}
