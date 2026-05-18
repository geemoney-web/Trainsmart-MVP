'use client';

import Link from 'next/link';

interface Rto {
  id: string;
  name: string;
  asqa_code: string;
  operating_states: string[];
  _count: { alerts: number; validations: number };
  superseded_quals_count: number;
  tas_review_count: number;
  trainer_alerts_count: number;
}

export function RtoCard({ rto }: { rto: Rto }) {
  return (
    <Link
      href={`/rto/${rto.id}/qualifications`}
      className="block rounded-lg border border-border bg-card p-5 hover:shadow-md transition-shadow duration-150 cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h2 className="text-base font-semibold leading-tight">{rto.name}</h2>
        {/* Static placeholder badge — Phase 5 (compliance engine) replaces this with the real Green/Amber/Red badge per D-09 */}
        <span className="shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          Status Pending
        </span>
      </div>

      <p className="text-sm text-muted-foreground mb-3">{rto.asqa_code}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {rto.operating_states.map((state) => (
          <span
            key={state}
            className="rounded-full border border-border px-2 py-0.5 text-xs"
          >
            {state}
          </span>
        ))}
      </div>

      <div className="text-sm text-muted-foreground space-y-0.5">
        <p>{rto._count.alerts > 0 ? `${rto._count.alerts} alerts` : 'No alerts'}</p>
        <p>
          {rto._count.validations > 0
            ? `${rto._count.validations} upcoming`
            : 'No upcoming validations'}
        </p>
      </div>

      <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
        <p>{rto.superseded_quals_count} superseded qualifications</p>
        <p>{rto.tas_review_count} TAS reviews due</p>
        <p>{rto.trainer_alerts_count} trainer alerts</p>
      </div>
    </Link>
  );
}
