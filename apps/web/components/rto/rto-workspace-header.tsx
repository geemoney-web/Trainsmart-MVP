'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export function RtoWorkspaceHeader({ rtoId }: { rtoId: string }) {
  const { data: rto, isPending, isError } = useQuery({
    queryKey: ['rto', rtoId],
    queryFn: () => apiFetch(`/rtos/${rtoId}`),
  });

  if (isPending) {
    return <div className="h-8 w-64 rounded bg-muted animate-pulse mb-4" />;
  }

  if (isError) {
    return <p className="text-destructive mb-4">Could not load RTO details.</p>;
  }

  return (
    <div className="flex items-center gap-3 mb-6">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back
      </Link>
      <span className="text-muted-foreground">/</span>
      <h1 className="text-xl font-semibold">{rto.name}</h1>
      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
        {rto.asqa_code}
      </span>
    </div>
  );
}
