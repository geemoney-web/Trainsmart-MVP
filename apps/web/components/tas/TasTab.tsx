'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { TasUploadForm } from './TasUploadForm';

interface Props {
  rtoId: string;
}

function statusBadgeClass(status: string) {
  if (status === 'Current') return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  if (status === 'Draft') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-800';
  return 'bg-muted text-muted-foreground';
}

export function TasTab({ rtoId }: Props) {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [showArchiveNotice, setShowArchiveNotice] = useState(false);

  const { data: tasDocuments, isPending, isError } = useQuery({
    queryKey: ['tas', rtoId],
    queryFn: () => apiFetch(`/tas/rtos/${rtoId}`),
  });

  const { data: rtoQuals } = useQuery({
    queryKey: ['rto-qualifications', rtoId],
    queryFn: () => apiFetch(`/tga/rtos/${rtoId}/qualifications`),
  });

  const qualificationsList = (rtoQuals ?? [])
    .filter((rq: any) => rq.qualification)
    .map((rq: any) => ({
      id: rq.qualification.id,
      code: rq.qualification.code,
      title: rq.qualification.title,
    }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">TAS Documents</h2>
        <button
          onClick={() => setShowUpload(true)}
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Upload TAS
        </button>
      </div>

      {showArchiveNotice && (
        <p className="text-sm text-muted-foreground mb-4">
          Previous version has been archived automatically.
        </p>
      )}

      {isPending && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg border border-border bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-destructive text-sm">Could not load TAS documents. Refresh to try again.</p>
      )}

      {!isPending && !isError && (!tasDocuments || tasDocuments.length === 0) && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No TAS documents uploaded yet.</p>
        </div>
      )}

      {!isPending && !isError && tasDocuments && tasDocuments.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Version</th>
                <th className="pb-3 font-medium">Qualification</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Review Date</th>
                <th className="pb-3 font-medium">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasDocuments.map((doc: any) => {
                const qual = qualificationsList.find((q: any) => q.id === doc.qualification_id);
                return (
                  <tr key={doc.id} className="text-foreground hover:bg-muted/50 transition-colors">
                    <td className="py-3 font-medium">{doc.version_label || '—'}</td>
                    <td className="py-3 font-mono text-sm">
                      {qual ? qual.code : doc.qualification_id ? `${doc.qualification_id.slice(0, 8)}…` : '—'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadgeClass(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {doc.review_date
                        ? new Date(doc.review_date).toLocaleDateString('en-AU')
                        : '—'}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString('en-AU')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showUpload && (
        <TasUploadForm
          rtoId={rtoId}
          qualifications={qualificationsList}
          onClose={() => setShowUpload(false)}
          onUploaded={({ autoArchived }) => {
            setShowUpload(false);
            if (autoArchived) setShowArchiveNotice(true);
            void queryClient.invalidateQueries({ queryKey: ['tas', rtoId] });
          }}
        />
      )}
    </div>
  );
}
