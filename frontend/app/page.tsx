'use client';

import React, { useState } from 'react';
import ResultCard from '@/components/ResultCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { saveAs } from 'file-saver';

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

      setCached(!!json.cached);
      setData(json.data);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  function exportJSON() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, `${data.query.replace(/\s+/g, '_')}_results.json`);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex gap-3 items-center">
          <Input
            placeholder="Search (e.g., best node.js frameworks 2025)"
            value={q}
            onChange={(e) => setQ((e.target as HTMLInputElement).value)}
            className="flex-1 shadow-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter') doSearch();
            }}
          />
          <Button onClick={() => doSearch()} disabled={loading || !q.trim()}>
            {loading ? 'Searching…' : 'Search'}
          </Button>

          <Button variant="outline" onClick={() => { setQ(''); setData(null); setError(null); }}>
            Clear
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          {elapsed !== null && (
            <div className="text-sm text-gray-400">
              ⏱ {(elapsed / 1000).toFixed(2)}s
            </div>
          )}

          {cached && (
            <Badge className="bg-emerald-900/40 text-emerald-300 border border-emerald-700">
              ⚡ Cached
            </Badge>
          )}

          {data && (
            <Button variant="ghost" size="sm" onClick={exportJSON}>
              Export JSON
            </Button>
          )}
        </div>
      </div>

      {error && <div className="mb-4 text-red-500">{error}</div>}

      {/* Aggregate summary */}
      {loading && <LoadingSkeleton />}

      {!loading && data && (
        <>
          <section className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-white/2 to-white/3 border border-white/6 shadow-inner">
            <h2 className="text-lg font-semibold">Aggregate Summary</h2>
            <p className="mt-2 text-gray-400">{data.aggregateSummary || 'No summary available.'}</p>
          </section>

          <section>
            <h3 className="font-semibold mb-3">Results</h3>
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
