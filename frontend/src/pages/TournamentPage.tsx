import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTournament, getMatches, getTeams } from '../api/client';
import { useTournamentSocket } from '../hooks/useSocket';
import type { Tournament, Match, Team } from '../types';
import BracketView from '../components/bracket/BracketView';
import LiveMatches from '../components/matches/LiveMatches';
import { Zap, LayoutList, Users, ArrowLeft, Calendar, MapPin, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'bracket' | 'live' | 'all' | 'participants';

const tabs: { key: Tab; label: string; getLabel?: (n: number) => string; icon: React.ReactNode }[] = [
  { key: 'bracket', label: 'Bracket', icon: <LayoutList size={15} /> },
  { key: 'live', label: 'Live', getLabel: (n) => `Live (${n})`, icon: <Zap size={15} /> },
  { key: 'all', label: 'All Matches', icon: <LayoutList size={15} /> },
  { key: 'participants', label: 'Teams', getLabel: (n) => `Teams (${n})`, icon: <Users size={15} /> },
];

export default function TournamentPage() {
  const { id } = useParams<{ id: string }>();
  const tournamentId = Number(id);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('bracket');
  const [showPlayInInfo, setShowPlayInInfo] = useState(true);

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

  if (!tournament) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="skeleton h-8 w-64" />
          <div className="skeleton h-4 w-48" />
          <div className="mt-8 grid w-full max-w-4xl gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const liveMatches = matches.filter((m) => m.status === 'live');
  const completedMatches = matches.filter((m) => m.status === 'completed');

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 no-underline transition-colors hover:text-gray-600"
      >
        <ArrowLeft size={14} />
        All Tournaments
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {tournament.name}
              </h1>
              {liveMatches.length > 0 && (
                <span className="animate-pulse-live inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold uppercase text-white shadow-sm shadow-red-200">
                  <Zap size={10} /> LIVE
                </span>
              )}
              <button
                onClick={() => setShowPlayInInfo(true)}
                title="Play-in info"
                className="ml-1 flex items-center justify-center rounded-full p-1 text-blue-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
              >
                <Info size={16} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-gray-400" />
                {new Date(tournament.start_date + 'T00:00:00').toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                –{' '}
                {new Date(tournament.end_date + 'T00:00:00').toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              {tournament.match_time_window && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-gray-400" />
                  {tournament.match_time_window}
                </span>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-3">
            {[
              { label: 'Teams', value: teams.length, color: 'bg-brand-50 text-brand-700' },
              { label: 'Matches', value: matches.length, color: 'bg-gray-100 text-gray-700' },
              { label: 'Completed', value: completedMatches.length, color: 'bg-green-50 text-green-700' },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-xl px-4 py-2 text-center ${stat.color}`}
              >
                <div className="text-lg font-bold">{stat.value}</div>
                <div className="text-[11px] font-medium uppercase tracking-wide opacity-70">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>      </motion.div>
      {/* Play-in info modal */}
      <AnimatePresence>
        {showPlayInInfo && (
          <motion.div
            key="playin-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setShowPlayInInfo(false)}
          >
            <motion.div
              key="playin-modal"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-2xl border border-blue-100 bg-white px-6 py-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPlayInInfo(false)}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={15} />
              </button>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Info size={16} />
                </div>
                <h2 className="text-sm font-bold text-blue-800">How Play-in Participants Are Chosen</h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                <li>The Play-in round is assigned on a <strong>First Come, First Served (FCFS)</strong> registration basis.</li>
                <li>Participants who register later are required to play in the preliminary (Play-in) rounds.</li>
                <li>For Singles play-in, matches scheduled as <strong>girls vs girls</strong>, while still following the FCFS rule.</li>
              </ul>
              <button
                onClick={() => setShowPlayInInfo(false)}
                className="mt-5 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 overflow-x-auto border-b border-gray-200/60 pb-px">
        {tabs.map(({ key, label, getLabel, icon }) => {
          const displayLabel =
            key === 'live' && getLabel ? getLabel(liveMatches.length) :
            key === 'participants' && getLabel ? getLabel(teams.length) :
            label;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
                tab === key
                  ? 'text-brand-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {icon}
              {displayLabel}
              {key === 'live' && liveMatches.length > 0 && (
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse-live" />
              )}
              {tab === key && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {tab === 'bracket' && <BracketView matches={matches} teams={teams} />}
        {tab === 'live' && <LiveMatches matches={liveMatches} allMatches={matches} />}
        {tab === 'all' && <LiveMatches matches={matches} showAll />}
        {tab === 'participants' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {teams.map((team, idx) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                className="group rounded-xl border border-gray-200/60 bg-white p-4 shadow-xs transition-all duration-200 hover:border-brand-200 hover:shadow-md"
              >
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-600">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{team.name}</p>
                  </div>
                </div>
                <div className="ml-11 space-y-0.5">
                  <p className="truncate text-xs text-gray-500">{team.player1.name}</p>
                  {team.player2 && (
                    <p className="truncate text-xs text-gray-500">{team.player2.name}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
