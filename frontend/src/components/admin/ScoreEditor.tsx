import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateScore } from '../../api/client';
import type { Match } from '../../types';

interface Props {
  match: Match;
  onSaved: () => void;
}

interface SetInput {
  set_number: number;
  teamA_score: string;
  teamB_score: string;
}

export default function ScoreEditor({ match, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [sets, setSets] = useState<SetInput[]>(() => {
    const existing = match.set_scores.map((s) => ({
      set_number: s.set_number,
      teamA_score: String(s.teamA_score),
      teamB_score: String(s.teamB_score),
    }));
    if (existing.length === 0) {
      return [
        { set_number: 1, teamA_score: '0', teamB_score: '0' },
        { set_number: 2, teamA_score: '0', teamB_score: '0' },
      ];
    }
    return existing;
  });

  const scoreMutation = useMutation({
    mutationFn: () =>
      updateScore(match.id, {
        sets: sets.map((s) => ({
          set_number: s.set_number,
          teamA_score: parseInt(s.teamA_score) || 0,
          teamB_score: parseInt(s.teamB_score) || 0,
        })),
      }),
    onSuccess: () => {
      onSaved();
      setOpen(false);
    },
  });

  const addSet = () => {
    const nextNum = sets.length + 1;
    if (nextNum <= 3) {
      setSets([...sets, { set_number: nextNum, teamA_score: '0', teamB_score: '0' }]);
    }
  };

  const updateSet = (idx: number, field: 'teamA_score' | 'teamB_score', value: string) => {
    const updated = [...sets];
    updated[idx] = { ...updated[idx], [field]: value.replace(/\D/g, '') };
    setSets(updated);
  };

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-blue-600 underline"
      >
        {open ? 'Hide score editor' : 'Edit score'}
      </button>

      {open && (
        <div className="mt-2 p-3 bg-white border rounded-lg space-y-2">
          <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-500 mb-1">
            <span>Set</span>
            <span>{match.teamA?.name ?? 'A'}</span>
            <span>{match.teamB?.name ?? 'B'}</span>
          </div>
          {sets.map((s, idx) => (
            <div key={s.set_number} className="grid grid-cols-3 gap-2 items-center">
              <span className="text-xs font-medium">Set {s.set_number}</span>
              <input
                type="number"
                min={0}
                max={99}
                className="border rounded px-2 py-1 text-sm w-full"
                value={s.teamA_score}
                onChange={(e) => updateSet(idx, 'teamA_score', e.target.value)}
              />
              <input
                type="number"
                min={0}
                max={99}
                className="border rounded px-2 py-1 text-sm w-full"
                value={s.teamB_score}
                onChange={(e) => updateSet(idx, 'teamB_score', e.target.value)}
              />
            </div>
          ))}
          {sets.length < 3 && (
            <button onClick={addSet} className="text-xs text-gray-500 underline">
              + Add Set {sets.length + 1}
            </button>
          )}
          <button
            onClick={() => scoreMutation.mutate()}
            disabled={scoreMutation.isPending}
            className="mt-2 bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {scoreMutation.isPending ? 'Saving...' : 'Save Score'}
          </button>
        </div>
      )}
    </div>
  );
}
