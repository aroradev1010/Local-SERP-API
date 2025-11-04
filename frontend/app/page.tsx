'use client';

import ResultCard from '@/components/ResultCard';
import React, { useState } from 'react';

type Result = {
  position: number;
  title: string;
  url: string;
  snippet?: string;
  summary?: string;
  type?: string;
};

type SearchDoc = {
  query: string;
  results: Result[];
  aggregateSummary?: string;
};

export default function Page() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchDoc | null>(null);
  const [cached, setCached] = useState(false);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    setCached(false);
    setElapsed(null);

    const start = performance.now();

    try {
      const res = await fetch(`${apiUrl}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: q.trim(), limit: 8 })
      });

      const json = await res.json();
      const end = performance.now();
      setElapsed(end - start);

      if (!res.ok) throw new Error(json.error || 'Search failed');

      // Detect cache flag
      setCached(!!json.cached);
      setData(json.data);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={doSearch} className="mb-6 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Enter query (e.g., best node.js frameworks 2025)"
          className="flex-1 px-4 py-2 border rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-sky-600 text-white rounded disabled:opacity-60"
          disabled={loading || !q.trim()}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {/* Status indicators */}
      {elapsed !== null && (
        <div className="text-sm text-gray-500 mb-3">
          ⏱️ Response time: {(elapsed / 1000).toFixed(2)}s{' '}
          {cached && (
            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
              ⚡ Cached Result
            </span>
          )}
        </div>
      )}

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {data && (
        <>
          <section className="mb-6">
            <h2 className="font-semibold text-lg">Aggregate Summary</h2>
            <p className="text-gray-700">{data.aggregateSummary || 'No summary available.'}</p>
          </section>

          <section>
            <h3 className="font-semibold mb-2 text-lg">Results</h3>
            <div className="space-y-3">
              {data.results.map((r) => (
                <ResultCard key={r.position} r={r} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
