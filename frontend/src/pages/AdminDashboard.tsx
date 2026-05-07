import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTournaments,
  createTournament,
  deleteTournament,
  getTeams,
  addTeam,
  deleteTeam,
  generateFixtures,
  randomizeSeeds,
  getMatches,
  updateStatus,
  updateLabel,
} from '../api/client';
import { useAuthStore } from '../store/auth';
import type { Tournament, Team, Match } from '../types';
import ScoreEditor from '../components/admin/ScoreEditor';
import MatchDetailsEditor from '../components/admin/MatchDetailsEditor';
import BulkTeamEntry from '../components/admin/BulkTeamEntry';
import { Plus, RefreshCw, Shuffle, Trash2, LogOut, Pencil, Check, X, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100';

export default function AdminDashboard() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTournamentId, setActiveTournamentId] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState<{ id: number; value: string } | null>(null);
  const [teamEntryTab, setTeamEntryTab] = useState<'single' | 'bulk'>('single');

  const [tForm, setTForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    match_time_window: '',
  });

  const [teamForm, setTeamForm] = useState({
    name: '',
    player1_name: '',
    player2_name: '',
  });

  const { data: tournaments = [] } = useQuery<Tournament[]>({
    queryKey: ['tournaments'],
    queryFn: () => getTournaments().then((r) => r.data),
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['teams', activeTournamentId],
    queryFn: () => getTeams(activeTournamentId!).then((r) => r.data),
    enabled: !!activeTournamentId,
  });

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ['matches', activeTournamentId],
    queryFn: () => getMatches(activeTournamentId!).then((r) => r.data),
    enabled: !!activeTournamentId,
  });

  const createTournamentMutation = useMutation({
    mutationFn: () => createTournament(tForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      setTForm({ name: '', start_date: '', end_date: '', match_time_window: '' });
    },
  });

  const addTeamMutation = useMutation({
    mutationFn: () => addTeam(activeTournamentId!, teamForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', activeTournamentId] });
      setTeamForm({ name: '', player1_name: '', player2_name: '' });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: number) => deleteTeam(activeTournamentId!, teamId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams', activeTournamentId] }),
  });

  const randomizeMutation = useMutation({
    mutationFn: () => randomizeSeeds(activeTournamentId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matches', activeTournamentId] }),
  });

  const deleteTournamentMutation = useMutation({
    mutationFn: (id: number) => deleteTournament(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      if (activeTournamentId === id) setActiveTournamentId(null);
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => generateFixtures(activeTournamentId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matches', activeTournamentId] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ matchId, status }: { matchId: number; status: string }) =>
      updateStatus(matchId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matches', activeTournamentId] }),
  });

  const labelMutation = useMutation({
    mutationFn: ({ matchId, label }: { matchId: number; label: string }) =>
      updateLabel(matchId, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', activeTournamentId] });
      setEditingLabel(null);
    },
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Settings size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Manage tournaments, teams, and matches</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-500 shadow-xs transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={14} /> Logout
        </button>
      </motion.div>

      {/* Create Tournament */}
      <section className="mb-6 rounded-2xl border border-gray-200/60 bg-white p-6 shadow-xs">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Create Tournament</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input
            placeholder="Tournament name"
            className={inputClass}
            value={tForm.name}
            onChange={(e) => setTForm({ ...tForm, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Time window e.g. 10:00-18:00"
            className={inputClass}
            value={tForm.match_time_window}
            onChange={(e) => setTForm({ ...tForm, match_time_window: e.target.value })}
          />
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Start Date
            </label>
            <input
              type="date"
              className={inputClass}
              value={tForm.start_date}
              onChange={(e) => setTForm({ ...tForm, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              End Date
            </label>
            <input
              type="date"
              className={inputClass}
              value={tForm.end_date}
              onChange={(e) => setTForm({ ...tForm, end_date: e.target.value })}
            />
          </div>
        </div>
        <button
          onClick={() => createTournamentMutation.mutate()}
          disabled={!tForm.name || !tForm.start_date || !tForm.end_date}
          className="mt-4 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md disabled:opacity-50"
        >
          <Plus size={14} /> Create Tournament
        </button>
      </section>

      {/* Select Tournament */}
      <section className="mb-6 rounded-2xl border border-gray-200/60 bg-white p-6 shadow-xs">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Select Tournament</h2>
        <div className="flex flex-wrap gap-2">
          {tournaments.map((t) => (
            <div key={t.id} className="flex items-center gap-1">
              <button
                onClick={() => setActiveTournamentId(t.id)}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                  activeTournamentId === t.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.name}
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${t.name}" and all its teams and matches?`)) {
                    deleteTournamentMutation.mutate(t.id);
                  }
                }}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                title="Delete tournament"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {tournaments.length === 0 && (
            <p className="text-sm text-gray-400">No tournaments created yet.</p>
          )}
        </div>
      </section>

      {activeTournamentId && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Add Teams */}
          <section className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Teams</h2>
              <div className="flex gap-1 rounded-lg bg-surface-2 p-0.5">
                {(['single', 'bulk'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTeamEntryTab(tab)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      teamEntryTab === tab
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'single' ? 'Add Single' : 'Add Bulk'}
                  </button>
                ))}
              </div>
            </div>

            {teamEntryTab === 'single' ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    placeholder="Team name"
                    className={inputClass}
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  />
                  <input
                    placeholder="Player 1 name"
                    className={inputClass}
                    value={teamForm.player1_name}
                    onChange={(e) => setTeamForm({ ...teamForm, player1_name: e.target.value })}
                  />
                  <input
                    placeholder="Player 2 (optional)"
                    className={inputClass}
                    value={teamForm.player2_name}
                    onChange={(e) => setTeamForm({ ...teamForm, player2_name: e.target.value })}
                  />
                </div>
                <button
                  onClick={() => addTeamMutation.mutate()}
                  disabled={!teamForm.name || !teamForm.player1_name}
                  className="mt-3 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 disabled:opacity-50"
                >
                  <Plus size={14} /> Add Team
                </button>
              </>
            ) : (
              <BulkTeamEntry
                tournamentId={activeTournamentId!}
                onSuccess={() => setTeamEntryTab('single')}
              />
            )}

            {/* Team list */}
            {teams.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Registered Teams ({teams.length})
                  </h3>
                </div>
                <div className="space-y-1.5">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-surface-1 px-4 py-2.5 transition-colors hover:bg-white"
                    >
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-gray-800">{team.name}</span>
                        <span className="ml-2 text-xs text-gray-400">
                          {team.player1.name}
                          {team.player2 && ` / ${team.player2.name}`}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteTeamMutation.mutate(team.id)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Fixtures */}
          <section className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-xs">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900">Fixtures</h2>
              {(() => {
                const ENTRY_ROUNDS = ['round_of_32', 'round_of_16', 'quarter_final'];
                const entryMatches = matches.filter(m => ENTRY_ROUNDS.includes(m.round));
                const entryStarted = entryMatches.some(m => m.status !== 'upcoming');
                const allPiDone = matches.filter(m => m.round === 'play_in').every(m => m.status === 'completed');
                const canRandomize = matches.length > 0 && allPiDone && !entryStarted;
                return (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => randomizeMutation.mutate()}
                      disabled={!canRandomize || randomizeMutation.isPending}
                      title={
                        !allPiDone ? 'Complete all play-in matches first' :
                        entryStarted ? 'Draw cannot be changed after matches have started' :
                        'Randomly shuffle the entry-round draw'
                      }
                      className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 disabled:opacity-50"
                    >
                      <Shuffle size={14} className={randomizeMutation.isPending ? 'animate-spin' : ''} />
                      Randomize
                    </button>
                    <button
                      onClick={() => generateMutation.mutate()}
                      disabled={teams.length < 2 || generateMutation.isPending}
                      className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-700 disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={generateMutation.isPending ? 'animate-spin' : ''} />
                      {matches.length > 0 ? 'Regenerate' : 'Generate'}
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Match list */}
            <div className="space-y-3">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className={`rounded-xl border p-4 transition-all ${
                    match.status === 'live'
                      ? 'border-red-200 bg-red-50/50 ring-1 ring-red-100'
                      : match.status === 'completed'
                      ? 'border-green-200 bg-green-50/50'
                      : 'border-gray-200/60 bg-white'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {editingLabel?.id === match.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            className="rounded-lg border border-brand-300 bg-white px-2.5 py-1 text-sm outline-none focus:ring-2 focus:ring-brand-100 w-40"
                            value={editingLabel.value}
                            onChange={(e) =>
                              setEditingLabel({ id: match.id, value: e.target.value })
                            }
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              labelMutation.mutate({ matchId: match.id, label: editingLabel.value })
                            }
                            className="rounded-md p-1 text-brand-600 hover:bg-brand-50"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingLabel(null)}
                            className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-gray-800">
                            {match.match_label || `${match.round} #${match.id}`}
                          </span>
                          <button
                            onClick={() =>
                              setEditingLabel({
                                id: match.id,
                                value: match.match_label || '',
                              })
                            }
                            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-600"
                          >
                            <Pencil size={11} />
                          </button>
                        </div>
                      )}
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        {match.round.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {['upcoming', 'live', 'completed'].map((s) => (
                        <button
                          key={s}
                          onClick={() => statusMutation.mutate({ matchId: match.id, status: s })}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize transition-all ${
                            match.status === s
                              ? s === 'live'
                                ? 'bg-red-500 text-white shadow-sm'
                                : s === 'completed'
                                ? 'bg-green-500 text-white shadow-sm'
                                : 'bg-gray-700 text-white shadow-sm'
                              : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className={match.winner_id === match.teamA_id && match.winner_id ? 'font-bold text-green-700' : 'text-gray-600'}>
                      {match.teamA?.name ?? 'TBD'}
                    </span>
                    <span className="text-xs text-gray-300">vs</span>
                    <span className={match.winner_id === match.teamB_id && match.winner_id ? 'font-bold text-green-700' : 'text-gray-600'}>
                      {match.teamB?.name ?? 'TBD'}
                    </span>
                  </div>

                  {/* Score editor */}
                  {match.status !== 'upcoming' && match.teamA_id && match.teamB_id && (
                    <ScoreEditor
                      match={match}
                      onSaved={() =>
                        queryClient.invalidateQueries({ queryKey: ['matches', activeTournamentId] })
                      }
                    />
                  )}

                  {/* Details editor */}
                  <MatchDetailsEditor
                    match={match}
                    onSaved={() =>
                      queryClient.invalidateQueries({ queryKey: ['matches', activeTournamentId] })
                    }
                  />
                </div>
              ))}
              {matches.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-400">
                  No fixtures generated yet. Add teams and click "Generate".
                </p>
              )}
            </div>
          </section>
        </motion.div>
      )}
    </div>
  );
}
