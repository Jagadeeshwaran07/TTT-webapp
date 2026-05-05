import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getTournaments } from '../api/client';
import type { Tournament } from '../types';
import { Trophy, Calendar } from 'lucide-react';

export default function HomePage() {
  const { data, isLoading } = useQuery<Tournament[]>({
    queryKey: ['tournaments'],
    queryFn: () => getTournaments().then((r) => r.data),
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <Trophy className="text-yellow-500" size={36} />
        Table Tennis Tournaments
      </h1>

      {isLoading && <p className="text-gray-500">Loading tournaments...</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((t) => (
          <Link
            key={t.id}
            to={`/tournament/${t.id}`}
            className="block border rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all bg-white"
          >
            <h2 className="text-xl font-semibold mb-2">{t.name}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={14} />
              {t.start_date} → {t.end_date}
            </div>
            {t.match_time_window && (
              <p className="text-sm text-gray-400 mt-1">⏱ {t.match_time_window}</p>
            )}
            <span className="inline-block mt-3 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full uppercase">
              {t.format}
            </span>
          </Link>
        ))}
      </div>

      {data?.length === 0 && (
        <p className="text-gray-400 text-center mt-12">No tournaments yet. Admin can create one.</p>
      )}
    </div>
  );
}
