import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateScore } from '../../api/client';
import type { Match } from '../../types';
import { ChevronDown, ChevronUp, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50"
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {open ? 'Hide score editor' : 'Edit score'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl border border-gray-200/60 bg-surface-1 p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                <span>Set</span>
                <span>{match.teamA?.name ?? 'Team A'}</span>
                <span>{match.teamB?.name ?? 'Team B'}</span>
              </div>
              {sets.map((s, idx) => (
                <div key={s.set_number} className="grid grid-cols-3 items-center gap-3">
                  <span className="text-xs font-medium text-gray-600">Set {s.set_number}</span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-center text-sm font-mono tabular-nums outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    value={s.teamA_score}
                    onChange={(e) => updateSet(idx, 'teamA_score', e.target.value)}
                  />
                  <input
                    type="number"
                    min={0}
                    max={99}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-center text-sm font-mono tabular-nums outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    value={s.teamB_score}
                    onChange={(e) => updateSet(idx, 'teamB_score', e.target.value)}
                  />
                </div>
              ))}
              <div className="flex items-center gap-3 pt-1">
                {sets.length < 3 && (
                  <button
                    onClick={addSet}
                    className="text-xs font-medium text-gray-500 transition-colors hover:text-gray-700"
                  >
                    + Add Set {sets.length + 1}
                  </button>
                )}
                <button
                  onClick={() => scoreMutation.mutate()}
                  disabled={scoreMutation.isPending}
                  className="ml-auto flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-brand-700 disabled:opacity-50"
                >
                  <Save size={12} />
                  {scoreMutation.isPending ? 'Saving…' : 'Save Score'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
