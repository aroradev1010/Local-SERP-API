// app/components/ResultCard.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react'; // optional icon, install lucide-react if desired

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
        <Card className="border border-white/6 bg-linear-to-br from-white/2 to-white/1 p-0 shadow-sm overflow-hidden rounded-2xl">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <a
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-400 font-semibold text-lg hover:underline line-clamp-2"
                        >
                            {r.title}
                        </a>
                        <div className="text-xs text-gray-400 mt-1 line-clamp-1">{r.url}</div>
                        <p className="mt-3 text-gray-400 text-sm leading-relaxed">
                            {r.summary || r.snippet || 'No summary available.'}
                        </p>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">{r.type || 'result'}</Badge>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-400">Pos</div>
                            <div className="text-lg font-medium text-white/90">{r.position}</div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-gray-400">{/* small note, reserved */}</div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => window.open(r.url, '_blank')}>
                            Open <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
