import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateMatchDetails } from '../../api/client';
import type { Match } from '../../types';
import { Pencil, Save, X } from 'lucide-react';

interface Props {
  match: Match;
  onSaved: () => void;
}

export default function MatchDetailsEditor({ match, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [matchDate, setMatchDate] = useState(match.match_date ?? '');
  const [matchTime, setMatchTime] = useState(match.match_time ?? '');
  const [matchPlace, setMatchPlace] = useState(match.match_place ?? '');
  const [matchUmpire, setMatchUmpire] = useState(match.match_umpire ?? '');

  const detailsMutation = useMutation({
    mutationFn: () =>
      updateMatchDetails(match.id, {
        match_date: matchDate || null,
        match_time: matchTime || null,
        match_place: matchPlace || null,
        match_umpire: matchUmpire || null,
      }),
    onSuccess: () => {
      onSaved();
      setEditing(false);
    },
  });

  function handleCancel() {
    setMatchDate(match.match_date ?? '');
    setMatchTime(match.match_time ?? '');
    setMatchPlace(match.match_place ?? '');
    setMatchUmpire(match.match_umpire ?? '');
    setEditing(false);
  }

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100';

  const labelClass = 'mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400';

  return (
    <div className="mt-3">
      {!editing ? (
        <div className="flex items-center gap-2 flex-wrap text-[11px] text-gray-500">
          <span className="shrink-0">📅 {match.match_date || '—'}</span>
          <span className="text-gray-300">·</span>
          <span className="shrink-0">🕐 {match.match_time || '—'}</span>
          <span className="text-gray-300">·</span>
          <span className="shrink-0">📍 {match.match_place || '—'}</span>
          <span className="text-gray-300">·</span>
          <span className="shrink-0">🧑‍⚖️ {match.match_umpire || '—'}</span>
          <button
            onClick={() => setEditing(true)}
            className="ml-auto rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-purple-600 shrink-0"
            title="Edit match details"
          >
            <Pencil size={11} />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Date</label>
              <input
                type="date"
                className={inputClass}
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Time</label>
              <input
                type="time"
                className={inputClass}
                value={matchTime}
                onChange={(e) => setMatchTime(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Venue / Court</label>
              <input
                type="text"
                placeholder="e.g. Court 1"
                className={inputClass}
                value={matchPlace}
                onChange={(e) => setMatchPlace(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Umpire</label>
              <input
                type="text"
                placeholder="Umpire name"
                className={inputClass}
                value={matchUmpire}
                onChange={(e) => setMatchUmpire(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 transition-all hover:bg-gray-50"
            >
              <X size={12} />
              Cancel
            </button>
            <button
              onClick={() => detailsMutation.mutate()}
              disabled={detailsMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-purple-700 disabled:opacity-50"
            >
              <Save size={12} />
              {detailsMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
