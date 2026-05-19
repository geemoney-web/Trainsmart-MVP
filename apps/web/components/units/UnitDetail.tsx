'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { UnitSnapshotTimeline } from './UnitSnapshotTimeline';

function statusBadge(status: string) {
  const lower = status.toLowerCase();
  if (lower === 'current') return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  if (lower === 'superseded') return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  return 'bg-muted text-muted-foreground';
}

interface Props {
  rtoId: string;
  unitId: string;
}

export function UnitDetail({ rtoId, unitId }: Props) {
  const { data: rto } = useQuery({
    queryKey: ['rto', rtoId],
    queryFn: () => apiFetch(`/rtos/${rtoId}`),
  });

  const { data: unit, isPending, isError } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: () => apiFetch(`/units/${unitId}`),
  });

  if (isPending) {
    return (
      <div aria-busy="true">
        <div className="h-4 w-32 rounded bg-muted animate-pulse mb-6" />
        <div className="h-8 w-96 rounded bg-muted animate-pulse" />
        <div className="h-4 w-48 mt-2 rounded bg-muted animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg border border-border mt-6 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Could not load unit. Refresh the page to try again.</p>;
  }

  const rtoName = rto?.name ?? 'RTO';

  return (
    <div>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-3 mb-6 text-sm">
        <Link href={`/rto/${rtoId}/qualifications`} className="text-muted-foreground hover:text-foreground transition-colors">
          ← Back
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href={`/rto/${rtoId}/qualifications`} className="text-muted-foreground hover:text-foreground transition-colors">
          {rtoName}
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href={`/rto/${rtoId}/qualifications`} className="text-muted-foreground hover:text-foreground transition-colors">
          Qualifications
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">Units</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-medium">{unit.code}</span>
      </nav>

      {/* Unit heading */}
      <h1 className="text-2xl font-semibold leading-tight">{unit.title}</h1>
      <div className="mt-1 flex items-center gap-2">
        <span className="font-mono text-sm">{unit.code}</span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadge(unit.status)}`}>
          {unit.status}
        </span>
      </div>
      {unit.superseded_by && (
        <div className="mt-2 text-sm text-muted-foreground">
          Superseded by: {unit.superseded_by}
        </div>
      )}

      {/* Elements & Performance Criteria */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Elements &amp; Performance Criteria</h2>
        {(!unit.elements || unit.elements.length === 0) ? (
          <p className="text-sm text-muted-foreground">No elements found for this unit.</p>
        ) : (
          <div className="space-y-3">
            {unit.elements.map((el: any) => (
              <div key={el.id} className="bg-card p-4 rounded-lg border border-border space-y-3">
                <h3 className="text-base font-semibold leading-tight">
                  Element {el.element_num}: {el.title}
                </h3>
                {el.performance_criteria?.map((pc: any) => (
                  <div key={pc.id} className="flex items-start gap-2 py-2">
                    <span className="font-mono text-xs text-muted-foreground w-8 shrink-0">
                      {pc.pc_num}
                    </span>
                    <p className="text-sm text-foreground">{pc.text}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historical Snapshots */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold">Historical Snapshots</h2>
          <span className="px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
            {unit.snapshots?.length ?? 0}
          </span>
        </div>
        <UnitSnapshotTimeline snapshots={unit.snapshots ?? []} />
      </div>
    </div>
  );
}
