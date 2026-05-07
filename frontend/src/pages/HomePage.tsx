import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getTournaments } from '../api/client';
import type { Tournament } from '../types';
import { Trophy, Calendar, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white p-6">
      <div className="skeleton mb-3 h-6 w-3/4" />
      <div className="skeleton mb-2 h-4 w-1/2" />
      <div className="skeleton h-6 w-20" />
    </div>
  );
}

export default function HomePage() {
  const { data, isLoading } = useQuery<Tournament[]>({
    queryKey: ['tournaments'],
    queryFn: () => getTournaments().then((r) => r.data),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-200">
          <Trophy size={28} />
        </div>
        <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Table Tennis Tournaments
        </h1>
        <p className="mx-auto max-w-lg text-lg text-gray-500">
          Live brackets, real-time scores, and competitive action. Follow every match as it happens.
        </p>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Tournament Grid */}
      {data && data.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
            >
              <Link
                to={`/tournament/${t.id}`}
                className="group relative block rounded-2xl border border-gray-200/60 bg-white p-6 no-underline shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-100/40"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                    <Zap size={10} />
                    {t.format}
                  </span>
                  <ArrowRight
                    size={16}
                    className="text-gray-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-brand-500"
                  />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">{t.name}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar size={14} className="text-gray-400" />
                  <span>
                    {new Date(t.start_date + 'T00:00:00').toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    –{' '}
                    {new Date(t.end_date + 'T00:00:00').toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {t.match_time_window && (
                  <p className="mt-1.5 text-xs text-gray-400">⏱ {t.match_time_window}</p>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {data?.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-24 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
            <Trophy size={28} />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-700">No tournaments yet</h2>
          <p className="text-sm text-gray-400">
            Check back soon or ask an admin to create one.
          </p>
        </motion.div>
      )}
    </div>
  );
}
