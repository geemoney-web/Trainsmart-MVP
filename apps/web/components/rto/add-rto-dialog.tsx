'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { createRtoSchema, CreateRtoFormValues } from '@/lib/schemas';

const STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'] as const;

export function AddRtoDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<CreateRtoFormValues>({
    resolver: zodResolver(createRtoSchema),
    defaultValues: { operating_states: [] },
  });

  async function onSubmit(data: CreateRtoFormValues) {
    setServerError(null);
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== '' && v !== undefined),
    );
    try {
      await apiFetch('/rtos', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      queryClient.invalidateQueries({ queryKey: ['rtos'] });
      setOpen(false);
      form.reset();
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('409') || msg.toLowerCase().includes('unique')) {
        form.setError('asqa_code', {
          message: 'An RTO with this ASQA code already exists.',
        });
      } else {
        setServerError('Could not create the RTO. Please try again.');
      }
    }
  }

  if (!open) {
    return (
      <span onClick={() => setOpen(true)} style={{ cursor: 'pointer' }}>
        {trigger}
      </span>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-card rounded-lg border border-border shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-rto-title"
      >
        <div className="px-6 pt-6 pb-2">
          <h2 id="add-rto-title" className="text-lg font-semibold">
            Add New RTO
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create a new RTO client.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="name">
              RTO Name
            </label>
            <input
              id="name"
              {...form.register('name')}
              placeholder="e.g. Acme Training Pty Ltd"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="asqa_code">
              ASQA Code
            </label>
            <input
              id="asqa_code"
              {...form.register('asqa_code')}
              placeholder="e.g. 12345"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {form.formState.errors.asqa_code && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.asqa_code.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Operating States</label>
            <div className="grid grid-cols-4 gap-2">
              {STATES.map((state) => (
                <label key={state} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    value={state}
                    {...form.register('operating_states')}
                    className="rounded"
                  />
                  {state}
                </label>
              ))}
            </div>
            {form.formState.errors.operating_states && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.operating_states.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="contact_name">
              Contact Name <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              id="contact_name"
              {...form.register('contact_name')}
              placeholder="e.g. Jane Smith"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="contact_email">
              Contact Email <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              id="contact_email"
              type="email"
              {...form.register('contact_email')}
              placeholder="e.g. jane@acmetraining.com.au"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {form.formState.errors.contact_email && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.contact_email.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="contact_phone">
              Contact Phone <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              id="contact_phone"
              {...form.register('contact_phone')}
              placeholder="e.g. 02 9000 0000"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setOpen(false); form.reset(); setServerError(null); }}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {form.formState.isSubmitting ? 'Creating...' : 'Create RTO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
