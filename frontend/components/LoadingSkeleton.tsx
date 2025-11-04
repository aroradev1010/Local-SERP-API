// app/components/LoadingSkeleton.tsx
'use client';

import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingSkeleton() {
    // show a few skeleton cards while loading
    return (
        <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/3 border border-white/5 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-1/3">
                            <Skeleton className="h-5 w-full rounded" />
                        </div>
                        <div className="w-20 flex justify-end">
                            <Skeleton className="h-6 w-20 rounded" />
                        </div>
                    </div>

                    <Skeleton className="h-4 w-3/4 mb-2 rounded" />
                    <Skeleton className="h-3 w-full mb-1 rounded" />
                    <Skeleton className="h-3 w-5/6 rounded" />
                </div>
            ))}
        </div>
    );
}
