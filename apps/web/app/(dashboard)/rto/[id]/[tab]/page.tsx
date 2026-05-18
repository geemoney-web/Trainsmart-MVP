import { notFound } from 'next/navigation';
import Link from 'next/link';
import { RtoWorkspaceHeader } from '@/components/rto/rto-workspace-header';

const TABS = [
  'qualifications',
  'trainers',
  'tas',
  'validations',
  'documents',
  'tasks',
  'alerts',
  'notes',
] as const;

type Tab = (typeof TABS)[number];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function tabLabel(tab: Tab) {
  return tab === 'tas' ? 'TAS' : capitalize(tab);
}

export default function RtoTabPage({
  params,
}: {
  params: { id: string; tab: string };
}) {
  if (!TABS.includes(params.tab as Tab)) notFound();

  const tab = params.tab as Tab;

  return (
    <div className="px-8 py-6">
      <RtoWorkspaceHeader rtoId={params.id} />

      <nav className="flex gap-1 border-b border-border mb-6" aria-label="RTO workspace tabs">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/rto/${params.id}/${t}`}
            className={`px-4 py-2 text-sm font-medium min-h-[44px] flex items-center border-b-2 transition-colors ${
              t === tab
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tabLabel(t)}
          </Link>
        ))}
      </nav>

      <div>
        <h2 className="text-xl font-semibold">{tabLabel(tab)} — Coming Soon</h2>
        <p className="text-muted-foreground mt-2">
          This section will be available in a future update.
        </p>
      </div>
    </div>
  );
}
