import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateMatchDetails } from '../../api/client';
import type { Match } from '../../types';

interface Props {
  match: Match;
  onSaved: () => void;
}

export default function MatchDetailsEditor({ match, onSaved }: Props) {
  const [open, setOpen] = useState(false);
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
      setOpen(false);
    },
  });

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-purple-600 underline"
      >
        {open ? 'Hide details editor' : 'Edit details'}
      </button>

      {open && (
        <div className="mt-2 p-3 bg-white border rounded-lg space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Date</label>
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm w-full"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Time</label>
              <input
                type="time"
                className="border rounded px-2 py-1 text-sm w-full"
                value={matchTime}
                onChange={(e) => setMatchTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Venue / Court</label>
              <input
                type="text"
                placeholder="e.g. Court 1"
                className="border rounded px-2 py-1 text-sm w-full"
                value={matchPlace}
                onChange={(e) => setMatchPlace(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Umpire</label>
              <input
                type="text"
                placeholder="Umpire name"
                className="border rounded px-2 py-1 text-sm w-full"
                value={matchUmpire}
                onChange={(e) => setMatchUmpire(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={() => detailsMutation.mutate()}
            disabled={detailsMutation.isPending}
            className="mt-1 bg-purple-600 text-white text-xs px-3 py-1.5 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {detailsMutation.isPending ? 'Saving...' : 'Save Details'}
          </button>
        </div>
      )}
    </div>
  );
}
