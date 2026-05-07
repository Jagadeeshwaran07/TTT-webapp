import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addTeamsBulk } from '../../api/client';
import { Plus, Trash2, Upload, AlertCircle } from 'lucide-react';

interface Row {
  name: string;
  player1_name: string;
  player2_name: string;
}

interface Props {
  tournamentId: number;
  onSuccess: () => void;
}

function emptyRow(): Row {
  return { name: '', player1_name: '', player2_name: '' };
}

function parseText(raw: string, isDoubles: boolean): Row[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.includes('\t') ? '\t' : ',';
      const cols = line.split(sep).map((c) => c.trim());
      return {
        name: cols[0] ?? '',
        player1_name: cols[1] ?? '',
        player2_name: isDoubles ? (cols[2] ?? '') : '',
      };
    });
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100';

export default function BulkTeamEntry({ tournamentId, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'singles' | 'doubles'>('singles');
  const [rawText, setRawText] = useState('');
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [errors, setErrors] = useState<string[]>([]);

  const isDoubles = mode === 'doubles';

  const bulkMutation = useMutation({
    mutationFn: (teams: Row[]) =>
      addTeamsBulk(
        tournamentId,
        teams.map((r) => ({
          name: r.name,
          player1_name: r.player1_name,
          player2_name: isDoubles && r.player2_name ? r.player2_name : undefined,
        }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', tournamentId] });
      setRawText('');
      setRows([emptyRow()]);
      setErrors([]);
      onSuccess();
    },
  });

  function handleTextChange(text: string) {
    setRawText(text);
    if (text.trim()) {
      setRows(parseText(text, isDoubles));
    }
  }

  function handleModeChange(newMode: 'singles' | 'doubles') {
    setMode(newMode);
    if (rawText.trim()) {
      setRows(parseText(rawText, newMode === 'doubles'));
    } else {
      setRows((prev) =>
        prev.map((r) => ({ ...r, player2_name: '' }))
      );
    }
    setErrors([]);
  }

  function updateRow(index: number, field: keyof Row, value: string) {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function deleteRow(index: number) {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [emptyRow()];
    });
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function handleSubmit() {
    const valid = rows.filter((r) => r.name.trim() && r.player1_name.trim());
    const errs: string[] = [];
    rows.forEach((r, i) => {
      if (!r.name.trim()) errs.push(`Row ${i + 1}: team name is required`);
      else if (!r.player1_name.trim()) errs.push(`Row ${i + 1}: player 1 name is required`);
    });
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    bulkMutation.mutate(valid);
  }

  const canSubmit =
    rows.some((r) => r.name.trim() && r.player1_name.trim()) && !bulkMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Format:</span>
        <div className="flex gap-1 rounded-lg bg-surface-2 p-0.5">
          {(['singles', 'doubles'] as const).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                mode === m
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Paste area */}
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Paste from spreadsheet (tab or comma separated) —{' '}
          {isDoubles ? 'Team Name, Player 1, Player 2' : 'Team Name, Player 1'}
        </label>
        <textarea
          rows={4}
          placeholder={
            isDoubles
              ? 'Alpha Team\tLiam Zhang\tNoah Patel\nBeta Team\tEmma Chen\tSophia Lee'
              : 'Alpha Team\tLiam Zhang\nBeta Team\tNoah Patel'
          }
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm resize-y outline-none transition-all placeholder:text-gray-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          value={rawText}
          onChange={(e) => handleTextChange(e.target.value)}
        />
      </div>

      {/* Editable preview table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2">
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 w-10">
                #
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Team Name
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Player 1
              </th>
              {isDoubles && (
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Player 2
                </th>
              )}
              <th className="w-10 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-gray-100 transition-colors hover:bg-surface-1">
                <td className="px-3 py-2 text-xs text-gray-400 text-center">{i + 1}</td>
                <td className="px-2 py-1.5">
                  <input
                    value={row.name}
                    onChange={(e) => updateRow(i, 'name', e.target.value)}
                    placeholder="Team name"
                    className={inputClass}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={row.player1_name}
                    onChange={(e) => updateRow(i, 'player1_name', e.target.value)}
                    placeholder="Player 1"
                    className={inputClass}
                  />
                </td>
                {isDoubles && (
                  <td className="px-2 py-1.5">
                    <input
                      value={row.player2_name}
                      onChange={(e) => updateRow(i, 'player2_name', e.target.value)}
                      placeholder="Player 2"
                      className={inputClass}
                    />
                  </td>
                )}
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => deleteRow(i)}
                    className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    title="Remove row"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="rounded-lg bg-red-50 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertCircle size={13} className="text-red-500" />
            <span className="text-xs font-semibold text-red-600">Validation errors</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-xs text-red-500">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-xs transition-all hover:bg-gray-50"
        >
          <Plus size={13} /> Add Row
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-green-700 disabled:opacity-50"
        >
          <Upload size={13} />
          {bulkMutation.isPending
            ? 'Adding…'
            : `Add ${rows.filter((r) => r.name.trim() && r.player1_name.trim()).length} Team(s)`}
        </button>
      </div>

      {bulkMutation.isError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle size={13} />
          Failed to add teams. Please try again.
        </div>
      )}
    </div>
  );
}
