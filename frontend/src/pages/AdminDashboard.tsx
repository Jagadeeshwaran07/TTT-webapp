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
import { Plus, RefreshCw, Shuffle, Trash2, LogOut, Pencil } from 'lucide-react';

export default function AdminDashboard() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTournamentId, setActiveTournamentId] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState<{ id: number; value: string } | null>(null);
  const [teamEntryTab, setTeamEntryTab] = useState<'single' | 'bulk'>('single');

  // Tournament form
  const [tForm, setTForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    match_time_window: '',
  });

  // Team form
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
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Create Tournament */}
      <section className="bg-white border rounded-xl p-5 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Create Tournament</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            placeholder="Tournament name"
            className="border rounded-lg px-3 py-2 text-sm"
            value={tForm.name}
            onChange={(e) => setTForm({ ...tForm, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Time window e.g. 10:00-18:00"
            className="border rounded-lg px-3 py-2 text-sm"
            value={tForm.match_time_window}
            onChange={(e) => setTForm({ ...tForm, match_time_window: e.target.value })}
          />
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 text-sm w-full"
              value={tForm.start_date}
              onChange={(e) => setTForm({ ...tForm, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">End Date</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 text-sm w-full"
              value={tForm.end_date}
              onChange={(e) => setTForm({ ...tForm, end_date: e.target.value })}
            />
          </div>
        </div>
        <button
          onClick={() => createTournamentMutation.mutate()}
          disabled={!tForm.name || !tForm.start_date || !tForm.end_date}
          className="mt-3 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus size={14} /> Create Tournament
        </button>
      </section>

      {/* Select Tournament */}
      <section className="bg-white border rounded-xl p-5 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Select Tournament to Manage</h2>
        <div className="flex flex-wrap gap-2">
          {tournaments.map((t) => (
            <div key={t.id} className="flex items-center gap-1">
              <button
                onClick={() => setActiveTournamentId(t.id)}
                className={`px-3 py-1.5 rounded-lg text-sm border ${
                  activeTournamentId === t.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'hover:bg-gray-50'
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
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                title="Delete tournament"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {activeTournamentId && (
        <>
          {/* Add Teams */}
          <section className="bg-white border rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Teams</h2>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                {(['single', 'bulk'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTeamEntryTab(tab)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      teamEntryTab === tab
                        ? 'bg-white shadow text-gray-800'
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <input
                    placeholder="Team name"
                    className="border rounded-lg px-3 py-2 text-sm"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  />
                  <input
                    placeholder="Player 1 name"
                    className="border rounded-lg px-3 py-2 text-sm"
                    value={teamForm.player1_name}
                    onChange={(e) => setTeamForm({ ...teamForm, player1_name: e.target.value })}
                  />
                  <input
                    placeholder="Player 2 name (doubles, optional)"
                    className="border rounded-lg px-3 py-2 text-sm"
                    value={teamForm.player2_name}
                    onChange={(e) => setTeamForm({ ...teamForm, player2_name: e.target.value })}
                  />
                </div>
                <button
                  onClick={() => addTeamMutation.mutate()}
                  disabled={!teamForm.name || !teamForm.player1_name}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
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
            <div className="mt-4 space-y-2">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{team.name}</span>
                    <span className="text-gray-400 ml-2">
                      {team.player1.name}
                      {team.player2 && ` / ${team.player2.name}`}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTeamMutation.mutate(team.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {teams.length > 0 && (
                <p className="text-xs text-gray-400">{teams.length} team(s) added</p>
              )}
            </div>
          </section>

          {/* Generate Fixtures */}
          <section className="bg-white border rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Fixtures</h2>
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
                      className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-600 disabled:opacity-50"
                    >
                      <Shuffle size={14} className={randomizeMutation.isPending ? 'animate-spin' : ''} />
                      Randomize Draw
                    </button>
                    <button
                      onClick={() => generateMutation.mutate()}
                      disabled={teams.length < 2 || generateMutation.isPending}
                      className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={generateMutation.isPending ? 'animate-spin' : ''} />
                      {matches.length > 0 ? 'Regenerate Fixtures' : 'Generate Fixtures'}
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Match list */}
            <div className="space-y-2">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className={`border rounded-lg p-3 text-sm ${
                    match.status === 'live'
                      ? 'border-red-300 bg-red-50'
                      : match.status === 'completed'
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {editingLabel?.id === match.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            className="border rounded px-2 py-0.5 text-sm w-40"
                            value={editingLabel.value}
                            onChange={(e) =>
                              setEditingLabel({ id: match.id, value: e.target.value })
                            }
                          />
                          <button
                            onClick={() =>
                              labelMutation.mutate({ matchId: match.id, label: editingLabel.value })
                            }
                            className="text-blue-600 text-xs font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingLabel(null)}
                            className="text-gray-400 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">
                            {match.match_label || `${match.round} #${match.id}`}
                          </span>
                          <button
                            onClick={() =>
                              setEditingLabel({
                                id: match.id,
                                value: match.match_label || '',
                              })
                            }
                            className="text-gray-400 hover:text-blue-500"
                          >
                            <Pencil size={12} />
                          </button>
                        </div>
                      )}
                      <span className="text-xs text-gray-400 uppercase">{match.round}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status buttons */}
                      {['upcoming', 'live', 'completed'].map((s) => (
                        <button
                          key={s}
                          onClick={() => statusMutation.mutate({ matchId: match.id, status: s })}
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            match.status === s
                              ? s === 'live'
                                ? 'bg-red-500 text-white border-red-500'
                                : s === 'completed'
                                ? 'bg-green-500 text-white border-green-500'
                                : 'bg-gray-600 text-white border-gray-600'
                              : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="mt-2 text-gray-600">
                    <span className={match.winner_id === match.teamA_id && match.winner_id ? 'font-bold text-green-700' : ''}>
                      {match.teamA?.name ?? 'TBD'}
                    </span>
                    <span className="mx-2 text-gray-400">vs</span>
                    <span className={match.winner_id === match.teamB_id && match.winner_id ? 'font-bold text-green-700' : ''}>
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

                  {/* Details editor (date, time, place, umpire) */}
                  <MatchDetailsEditor
                    match={match}
                    onSaved={() =>
                      queryClient.invalidateQueries({ queryKey: ['matches', activeTournamentId] })
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
