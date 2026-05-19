'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { TasVersionList } from '@/components/tas/TasVersionList';
import { TasUploadForm } from '@/components/tas/TasUploadForm';

function statusBadge(status: string) {
  const lower = status.toLowerCase();
  if (lower === 'current') return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  if (lower === 'superseded') return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  return 'bg-muted text-muted-foreground';
}

interface Props {
  rtoId: string;
  qualId: string;
}

export function QualificationDetail({ rtoId, qualId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [showArchiveNotice, setShowArchiveNotice] = useState(false);

  useEffect(() => {
    if (!showArchiveNotice) return;
    const t = setTimeout(() => setShowArchiveNotice(false), 4000);
    return () => clearTimeout(t);
  }, [showArchiveNotice]);

  const { data: rto } = useQuery({
    queryKey: ['rto', rtoId],
    queryFn: () => apiFetch(`/rtos/${rtoId}`),
  });

  const { data: qual, isPending, isError } = useQuery({
    queryKey: ['qualification', qualId],
    queryFn: () => apiFetch(`/qualifications/${qualId}`),
  });

  if (isPending) {
    return (
      <div aria-busy="true">
        <nav aria-label="Breadcrumb" className="flex items-center gap-3 mb-6 text-sm">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        </nav>
        <div className="h-6 w-48 rounded bg-muted animate-pulse" />
        <div className="h-8 w-96 mt-4 rounded bg-muted animate-pulse" />
        <div className="h-4 w-64 mt-2 rounded bg-muted animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg border border-border mt-6 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Could not load qualification. Refresh the page to try again.</p>;
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
        <span className="text-foreground font-medium">{qual.code}</span>
      </nav>

      {/* Qualification heading */}
      <h1 className="text-2xl font-semibold leading-tight">{qual.title}</h1>
      <div className="mt-1 flex items-center gap-2">
        <span className="font-mono text-sm">{qual.code}</span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadge(qual.status)}`}>
          {qual.status}
        </span>
        {qual.superseded_by && (
          <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
            Superseded
          </span>
        )}
      </div>
      <div className="mt-2 text-sm text-muted-foreground flex gap-6">
        {qual.training_package && <span>Training Package: {qual.training_package}</span>}
        {qual.last_synced_at && (
          <span>Last Synced: {new Date(qual.last_synced_at).toLocaleDateString('en-AU')}</span>
        )}
        {qual.superseded_by && <span>Superseded by: {qual.superseded_by}</span>}
      </div>

      {/* Units section */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold">Units</h2>
          <span className="px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
            {qual.units?.length ?? 0}
          </span>
        </div>
        {(!qual.units || qual.units.length === 0) ? (
          <p className="text-sm text-muted-foreground">No units linked to this qualification.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">Code</th>
                  <th className="pb-3 font-medium">Title</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {qual.units.map((qu: any) => (
                  <tr
                    key={qu.id}
                    role="link"
                    tabIndex={0}
                    className="text-foreground hover:bg-muted/50 transition-colors cursor-pointer min-h-[44px]"
                    onClick={() => router.push(`/rto/${rtoId}/units/${qu.unit.id}`)}
                    onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/rto/${rtoId}/units/${qu.unit.id}`); }}
                  >
                    <td className="py-3 font-mono text-sm">{qu.unit.code}</td>
                    <td className="py-3">{qu.unit.title}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadge(qu.unit.status)}`}>
                        {qu.unit.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TAS Documents section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">TAS Documents</h2>
          <button
            onClick={() => setShowUpload(true)}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Upload TAS
          </button>
        </div>
        {showArchiveNotice && (
          <p className="text-sm text-muted-foreground mb-3">
            Previous version has been archived automatically.
          </p>
        )}
        <TasVersionList tasDocuments={qual.tasDocuments ?? []} />
        {showUpload && (
          <TasUploadForm
            rtoId={rtoId}
            qualifications={[{ id: qual.id, code: qual.code, title: qual.title }]}
            presetQualificationId={qual.id}
            onClose={() => setShowUpload(false)}
            onUploaded={({ autoArchived }) => {
              setShowUpload(false);
              if (autoArchived) setShowArchiveNotice(true);
              void queryClient.invalidateQueries({ queryKey: ['qualification', qualId] });
              void queryClient.invalidateQueries({ queryKey: ['tas', rtoId] });
            }}
          />
        )}
      </div>

      {/* Trainers placeholder */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Trainers</h2>
        <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">Trainer mapping will be available in Phase 4.</p>
        </div>
      </div>

      {/* Documents placeholder */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Documents</h2>
        <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">Document management will be available in Phase 6.</p>
        </div>
      </div>
    </div>
  );
}
