'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { RtoCard } from '@/components/rto/rto-card';
import { AddRtoDialog } from '@/components/rto/add-rto-dialog';

export default function DashboardPage() {
  const { data: rtos, isPending, isError } = useQuery({
    queryKey: ['rtos'],
    queryFn: () => apiFetch('/rtos'),
  });

  return (
    <div className="px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold leading-tight">RTO Dashboard</h1>
        <AddRtoDialog
          trigger={
            <button className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity">
              Add RTO
            </button>
          }
        />
      </div>

      {isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-48 rounded-lg border border-border bg-muted animate-pulse"
            />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-destructive">
          Could not load RTO list. Refresh the page to try again.
        </p>
      )}

      {!isPending && !isError && rtos?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-xl font-semibold mb-2">No RTOs yet</p>
          <p className="text-muted-foreground mb-6">
            Add your first RTO client to get started.
          </p>
          <AddRtoDialog
            trigger={
              <button className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity">
                Add RTO
              </button>
            }
          />
        </div>
      )}

      {!isPending && !isError && rtos?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {rtos.map((rto: any) => (
            <RtoCard key={rto.id} rto={rto} />
          ))}
        </div>
      )}
    </div>
  );
}
