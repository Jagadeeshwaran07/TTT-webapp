import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addTeamsBulk } from '../../api/client';
import { Plus, Trash2, Upload } from 'lucide-react';

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
      // Try tab-separated first, fall back to comma-separated
      const sep = line.includes('\t') ? '\t' : ',';
      const cols = line.split(sep).map((c) => c.trim());
      return {
        name: cols[0] ?? '',
        player1_name: cols[1] ?? '',
        player2_name: isDoubles ? (cols[2] ?? '') : '',
      };
    });
}

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
        <span className="text-sm text-gray-500">Format:</span>
        {(['singles', 'doubles'] as const).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              mode === m
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Paste area */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">
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
          className="w-full border rounded-lg px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={rawText}
          onChange={(e) => handleTextChange(e.target.value)}
        />
      </div>

      {/* Editable preview table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-2 py-1.5 border text-xs text-gray-500 font-medium w-8">#</th>
              <th className="text-left px-2 py-1.5 border text-xs text-gray-500 font-medium">Team Name</th>
              <th className="text-left px-2 py-1.5 border text-xs text-gray-500 font-medium">Player 1</th>
              {isDoubles && (
                <th className="text-left px-2 py-1.5 border text-xs text-gray-500 font-medium">Player 2</th>
              )}
              <th className="w-8 border px-2 py-1.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border px-2 py-1 text-xs text-gray-400 text-center">{i + 1}</td>
                <td className="border px-1 py-1">
                  <input
                    value={row.name}
                    onChange={(e) => updateRow(i, 'name', e.target.value)}
                    placeholder="Team name"
                    className="w-full px-2 py-1 text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                  />
                </td>
                <td className="border px-1 py-1">
                  <input
                    value={row.player1_name}
                    onChange={(e) => updateRow(i, 'player1_name', e.target.value)}
                    placeholder="Player 1"
                    className="w-full px-2 py-1 text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                  />
                </td>
                {isDoubles && (
                  <td className="border px-1 py-1">
                    <input
                      value={row.player2_name}
                      onChange={(e) => updateRow(i, 'player2_name', e.target.value)}
                      placeholder="Player 2"
                      className="w-full px-2 py-1 text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                  </td>
                )}
                <td className="border px-2 py-1 text-center">
                  <button
                    onClick={() => deleteRow(i)}
                    className="text-red-400 hover:text-red-600"
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
        <ul className="text-xs text-red-500 space-y-0.5 list-disc list-inside">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 text-sm text-gray-600 border rounded-lg px-3 py-1.5 hover:bg-gray-50"
        >
          <Plus size={13} /> Add Row
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
        >
          <Upload size={13} />
          {bulkMutation.isPending
            ? 'Adding…'
            : `Add ${rows.filter((r) => r.name.trim() && r.player1_name.trim()).length} Team(s)`}
        </button>
      </div>

      {bulkMutation.isError && (
        <p className="text-xs text-red-500">Failed to add teams. Please try again.</p>
      )}
    </div>
  );
}
