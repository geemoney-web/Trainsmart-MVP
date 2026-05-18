'use client';

import { useState, useEffect, useRef } from 'react';
import { searchTgaQualifications, importTgaQualification } from '@/lib/api';

interface SearchResult {
  code: string;
  title: string;
  status: string;
}

interface Props {
  rtoId: string;
  onClose: () => void;
  onImported: () => void;
}

export function ImportQualificationModal({ rtoId, onClose, onImported }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchTgaQualifications(query);
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [query]);

  async function handleImport() {
    if (!selectedCode) return;
    setIsImporting(true);
    setError(null);
    try {
      await importTgaQualification(rtoId, selectedCode);
      onImported();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Import failed');
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Add Qualification from TGA</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedCode(null);
              }}
              placeholder="Search by code or keyword (e.g. BSB50120)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>

          {isSearching && (
            <p className="text-sm text-muted-foreground">Searching TGA...</p>
          )}

          {results.length > 0 && (
            <div className="max-h-60 overflow-y-auto rounded-lg border border-border">
              {results.map((r) => (
                <button
                  key={r.code}
                  onClick={() => setSelectedCode(r.code)}
                  className={`w-full text-left px-4 py-3 transition-colors text-sm ${
                    selectedCode === r.code
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <span className="font-mono font-medium">{r.code}</span>
                  <span className="ml-2">— {r.title}</span>
                  <span
                    className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                      r.status?.toLowerCase() === 'current'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                    }`}
                  >
                    {r.status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {query.length >= 2 && !isSearching && results.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No qualifications found. Try a different search term.
            </p>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {isImporting && (
            <p className="text-sm text-primary">
              Importing qualification and all units... this may take 30–60 seconds.
            </p>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            disabled={isImporting}
            className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedCode || isImporting}
            className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
