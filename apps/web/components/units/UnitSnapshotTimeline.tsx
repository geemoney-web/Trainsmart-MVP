'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface Snapshot {
  id: string;
  snapshotted_at: string;
  change_fields: string[];
  snapshot_data: any;
}

interface Props {
  snapshots: Snapshot[];
}

export function UnitSnapshotTimeline({ snapshots }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (snapshots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
        <p className="text-sm text-muted-foreground">No historical snapshots recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {snapshots.map((s) => (
        <div key={s.id}>
          <button
            type="button"
            aria-expanded={openId === s.id}
            aria-controls={`snapshot-${s.id}`}
            onClick={() => setOpenId(openId === s.id ? null : s.id)}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors text-sm"
          >
            <ChevronRight
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openId === s.id ? 'rotate-90' : ''}`}
            />
            <span className="font-medium text-foreground">
              {new Date(s.snapshotted_at).toLocaleDateString('en-AU', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            {s.change_fields?.length > 0 && (
              <span className="text-muted-foreground">{s.change_fields.join(', ')}</span>
            )}
          </button>

          {openId === s.id && (
            <div
              id={`snapshot-${s.id}`}
              className="mt-1 px-4 pb-4 pt-2 rounded-b-lg border-x border-b border-border bg-card"
            >
              {Array.isArray(s.snapshot_data?.elements) ? (
                s.snapshot_data.elements.map((el: any, idx: number) => (
                  <div key={idx} className="mt-3">
                    <p className="text-sm font-medium text-foreground">
                      Element {el.element_num}: {el.title}
                    </p>
                    {Array.isArray(el.performance_criteria) &&
                      el.performance_criteria.map((pc: any, pcIdx: number) => (
                        <div key={pcIdx} className="flex items-start gap-2 py-1 pl-4">
                          <span className="font-mono text-xs text-muted-foreground w-8 shrink-0">
                            {pc.pc_num}
                          </span>
                          <p className="text-sm text-muted-foreground">{pc.text}</p>
                        </div>
                      ))}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Snapshot data unavailable.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
