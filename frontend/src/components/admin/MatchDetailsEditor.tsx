import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateMatchDetails } from '../../api/client';
import type { Match } from '../../types';
import { ChevronDown, ChevronUp, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100';

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-purple-600 transition-colors hover:bg-purple-50"
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {open ? 'Hide details' : 'Edit details'}
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Date
                  </label>
                  <input
                    type="date"
                    className={inputClass}
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Time
                  </label>
                  <input
                    type="time"
                    className={inputClass}
                    value={matchTime}
                    onChange={(e) => setMatchTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Venue / Court
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Court 1"
                    className={inputClass}
                    value={matchPlace}
                    onChange={(e) => setMatchPlace(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Umpire
                  </label>
                  <input
                    type="text"
                    placeholder="Umpire name"
                    className={inputClass}
                    value={matchUmpire}
                    onChange={(e) => setMatchUmpire(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => detailsMutation.mutate()}
                  disabled={detailsMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-purple-700 disabled:opacity-50"
                >
                  <Save size={12} />
                  {detailsMutation.isPending ? 'Saving…' : 'Save Details'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
