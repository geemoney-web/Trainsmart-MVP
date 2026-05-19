'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { getRtoQualifications } from '@/lib/api';
import { ImportQualificationModal } from './ImportQualificationModal';

interface RtoQualification {
  id: string;
  qualification: {
    id: string;
    code: string;
    title: string;
    status: string;
    superseded_by: string | null;
    last_synced_at: string | null;
  } | null;
}

interface Props {
  rtoId: string;
}

export function QualificationsTab({ rtoId }: Props) {
  const [showImportModal, setShowImportModal] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: qualifications, isPending, isError } = useQuery<RtoQualification[]>({
    queryKey: ['rto-qualifications', rtoId],
    queryFn: () => getRtoQualifications(rtoId),
  });

  const handleImported = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['rto-qualifications', rtoId] });
  }, [queryClient, rtoId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Qualifications</h2>
        <button
          onClick={() => setShowImportModal(true)}
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Add Qualification
        </button>
      </div>

      {isPending && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg border border-border bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-destructive">Could not load qualifications. Refresh the page to try again.</p>
      )}

      {!isPending && !isError && (!qualifications || qualifications.length === 0) && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">No qualifications imported yet.</p>
          <p className="text-sm">
            Click &apos;Add Qualification&apos; to search TGA and import.
          </p>
        </div>
      )}

      {!isPending && !isError && qualifications && qualifications.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Code</th>
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Last Synced</th>
                <th className="pb-3 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {qualifications.map((rq) => (
                <tr
                  key={rq.id}
                  role="link"
                  tabIndex={rq.qualification?.id ? 0 : undefined}
                  className={`text-foreground hover:bg-muted/50 transition-colors min-h-[44px]${rq.qualification?.id ? ' cursor-pointer' : ''}`}
                  onClick={() => rq.qualification?.id && router.push(`/rto/${rtoId}/qualifications/${rq.qualification.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && rq.qualification?.id) router.push(`/rto/${rtoId}/qualifications/${rq.qualification.id}`); }}
                >
                  <td className="py-3 font-mono">{rq.qualification?.code ?? '—'}</td>
                  <td className="py-3">{rq.qualification?.title ?? '—'}</td>
                  <td className="py-3">
                    {rq.qualification?.status ? (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          rq.qualification.status.toLowerCase() === 'current'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                        }`}
                      >
                        {rq.qualification.status}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {rq.qualification?.last_synced_at
                      ? new Date(rq.qualification.last_synced_at).toLocaleDateString()
                      : '—'}
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

      {showImportModal && (
        <ImportQualificationModal
          rtoId={rtoId}
          onClose={() => setShowImportModal(false)}
          onImported={handleImported}
        />
      )}
    </div>
  );
}
