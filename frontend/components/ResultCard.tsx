// app/components/ResultCard.tsx
'use client';

import React from 'react';

type Result = {
    position: number;
    title: string;
    url: string;
    snippet?: string;
    summary?: string;
    type?: string;
};

export default function ResultCard({ r }: { r: Result }) {
    return (
        <div className="p-4 border rounded bg-white">
            <a href={r.url} target="_blank" rel="noreferrer" className="text-sky-700 font-medium">
                {r.title}
            </a>
            <div className="text-xs text-gray-500 mt-1">{r.url}</div>
            <p className="mt-2 text-gray-700">{r.summary || r.snippet || 'No summary available'}</p>
            <div className="mt-2 text-xs text-gray-500">Position: {r.position} • Type: {r.type}</div>
        </div>
    );
}
