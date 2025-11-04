// app/components/QueryHistory.tsx
'use client';

import React from 'react';
import { HistoryItem } from '@/hooks/useQueryHistory';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react'; // optional icon

function timeAgoShort(ts: number) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
}

export default function QueryHistory({
    history,
    onSelect,
    onRemove,
    onClear,
}: {
    history: HistoryItem[];
    onSelect: (q: string) => void;
    onRemove: (index: number) => void;
    onClear: () => void;
}) {
    if (!history || history.length === 0) {
        return null;
    }

    return (
        <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-300">Recent searches</h4>
                <Button size="sm" variant="ghost" onClick={onClear}>Clear</Button>
            </div>

            <div className="flex flex-wrap gap-2">
                {history.map((h, idx) => (
                    <div key={h.at} className="flex items-center gap-2 bg-white/3 border border-white/6 rounded-full px-3 py-1">
                        <button
                            onClick={() => onSelect(h.q)}
                            className="text-sm text-gray-400 pr-2 focus:outline-none cursor-pointer"
                            aria-label={`Run search ${h.q}`}
                        >
                            <span className="font-medium">{h.q}</span>
                        </button>

                        <span className="text-xs text-gray-400">{timeAgoShort(h.at)}</span>

                        <button
                            onClick={() => onRemove(idx)}
                            className="ml-2 p-1 rounded-full hover:bg-white/5 cursor-pointer"
                            aria-label={`Remove ${h.q}`}
                        >
                            <X className="h-3 w-3 text-gray-400 hover:bg-gray-200 rounded-full" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
