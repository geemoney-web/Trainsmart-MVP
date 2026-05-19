'use client';

import { Download } from 'lucide-react';

interface TasDocument {
  id: string;
  version_label: string;
  status: 'Draft' | 'Current' | 'Archived';
  file_name: string;
  file_key: string;
  review_date: string | null;
  created_at: string;
}

interface Props {
  tasDocuments: TasDocument[];
}

function statusBadgeClass(status: string) {
  if (status === 'Current') return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  if (status === 'Draft') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-800';
  return 'bg-muted text-muted-foreground';
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function TasVersionList({ tasDocuments }: Props) {
  if (tasDocuments.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No TAS documents uploaded yet.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
      {tasDocuments.map((doc) => (
        <div key={doc.id} className="flex items-center gap-3 px-4 py-3 text-sm">
          <span className={`px-2 py-1 rounded text-xs font-medium shrink-0 ${statusBadgeClass(doc.status)}`}>
            {doc.status}
          </span>
          <span className="font-medium text-foreground">{doc.version_label}</span>
          <span className="text-muted-foreground text-xs truncate">{doc.file_name}</span>
          <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
            Review: {doc.review_date ? formatDate(doc.review_date) : '—'}
          </span>
          <button
            type="button"
            aria-label={`Download ${doc.file_name}`}
            onClick={() => console.log('Download:', doc.file_key)}
            className="ml-2 shrink-0"
          >
            <Download className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </div>
      ))}
    </div>
  );
}
