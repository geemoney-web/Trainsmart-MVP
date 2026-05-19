'use client';

import { useState } from 'react';
import { getTasPresignedUrl, createTasDocument } from '@/lib/api';

const CONTENT_TYPE_WHITELIST = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];
const MAX_FILE_SIZE = 52_428_800;

interface Qualification {
  id: string;
  code: string;
  title: string;
}

interface Props {
  rtoId: string;
  qualifications: Qualification[];
  presetQualificationId?: string;
  onClose: () => void;
  onUploaded: (info: { autoArchived: boolean }) => void;
}

export function TasUploadForm({ rtoId, qualifications, presetQualificationId, onClose, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [qualificationId, setQualificationId] = useState(presetQualificationId ?? '');
  const [versionLabel, setVersionLabel] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Current'>('Draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const presetQual = presetQualificationId
    ? qualifications.find((q) => q.id === presetQualificationId)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const errors: Record<string, string> = {};

    if (!file) {
      errors.file = 'Please select a file.';
    } else {
      if (file.size > MAX_FILE_SIZE) {
        errors.file = 'File is too large. Maximum size is 50MB.';
      } else {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const typeOk = CONTENT_TYPE_WHITELIST.includes(file.type) || ['pdf', 'doc', 'docx'].includes(ext ?? '');
        if (!typeOk) {
          errors.file = 'Only PDF, DOC, or DOCX files are supported.';
        }
      }
    }
    if (!qualificationId) errors.qualificationId = 'Please select a qualification.';
    if (!versionLabel.trim()) errors.versionLabel = 'Version label is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      const contentType = CONTENT_TYPE_WHITELIST.includes(file!.type)
        ? file!.type
        : 'application/octet-stream';

      const { presignedUrl, fileKey } = await getTasPresignedUrl({
        rtoId,
        fileName: file!.name,
        fileSize: file!.size,
        contentType,
      });

      const s3Res = await fetch(presignedUrl, {
        method: 'PUT',
        body: file!,
        headers: { 'Content-Type': contentType },
      });
      if (!s3Res.ok) throw new Error('File upload to storage failed');

      await createTasDocument({
        rtoId,
        qualificationId,
        versionLabel: versionLabel.trim(),
        status,
        fileKey,
        fileName: file!.name,
        fileSize: file!.size,
        reviewDate: reviewDate || undefined,
      });

      onUploaded({ autoArchived: status === 'Current' });
    } catch (err: any) {
      console.error('TAS upload error:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tas-upload-title"
        className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 id="tas-upload-title" className="text-xl font-semibold">Upload TAS Document</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 mt-4">
          {/* File */}
          <div>
            <label className="block text-sm font-medium mb-1">File</label>
            <div className="rounded-lg border-2 border-dashed border-border p-4 text-center">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm"
              />
              {file && (
                <p className="text-xs text-muted-foreground mt-1">
                  {file.name} — {(file.size / 1_048_576).toFixed(2)} MB
                </p>
              )}
            </div>
            {fieldErrors.file && <p className="text-xs text-destructive mt-1">{fieldErrors.file}</p>}
          </div>

          {/* Qualification */}
          <div>
            <label className="block text-sm font-medium mb-1">Qualification</label>
            {presetQual ? (
              <div className="bg-muted px-3 py-2 rounded-md text-sm border border-input">
                {presetQual.code} — {presetQual.title}
              </div>
            ) : (
              <select
                value={qualificationId}
                onChange={(e) => setQualificationId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a qualification…</option>
                {qualifications.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.code} — {q.title}
                  </option>
                ))}
              </select>
            )}
            {fieldErrors.qualificationId && (
              <p className="text-xs text-destructive mt-1">{fieldErrors.qualificationId}</p>
            )}
          </div>

          {/* Version Label */}
          <div>
            <label className="block text-sm font-medium mb-1">Version Label</label>
            <input
              type="text"
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              placeholder="e.g. v3 or Jan 2026"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {fieldErrors.versionLabel && (
              <p className="text-xs text-destructive mt-1">{fieldErrors.versionLabel}</p>
            )}
          </div>

          {/* Review Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Review Date (optional)</label>
            <input
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Initial Status */}
          <div>
            <label className="block text-sm font-medium mb-2">Initial Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="Draft"
                  checked={status === 'Draft'}
                  onChange={() => setStatus('Draft')}
                />
                Draft
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="Current"
                  checked={status === 'Current'}
                  onChange={() => setStatus('Current')}
                />
                Current
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Uploading...' : 'Upload TAS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
