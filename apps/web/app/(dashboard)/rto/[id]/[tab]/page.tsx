import { notFound } from 'next/navigation';
import Link from 'next/link';
import { RtoWorkspaceHeader } from '@/components/rto/rto-workspace-header';
import { QualificationsTab } from '@/components/qualifications/QualificationsTab';
import { TasTab } from '@/components/tas/TasTab';

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

export default async function RtoTabPage({
  params,
}: {
  params: Promise<{ id: string; tab: string }>;
}) {
  const { id, tab: tabParam } = await params;

  if (!TABS.includes(tabParam as Tab)) notFound();

  const tab = tabParam as Tab;

  return (
    <div className="px-8 py-6">
      <RtoWorkspaceHeader rtoId={id} />

      <nav className="flex gap-1 border-b border-border mb-6" aria-label="RTO workspace tabs">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/rto/${id}/${t}`}
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
        {tab === 'qualifications' ? (
          <QualificationsTab rtoId={id} />
        ) : tab === 'tas' ? (
          <TasTab rtoId={id} />
        ) : (
          <>
            <h2 className="text-xl font-semibold">{tabLabel(tab)} — Coming Soon</h2>
            <p className="text-muted-foreground mt-2">
              This section will be available in a future update.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
