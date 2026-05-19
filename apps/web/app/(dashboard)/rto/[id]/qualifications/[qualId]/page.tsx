import { QualificationDetail } from '@/components/qualifications/QualificationDetail';

export default async function QualificationDetailPage({
  params,
}: {
  params: Promise<{ id: string; qualId: string }>;
}) {
  const { id, qualId } = await params;
  return (
    <div className="px-8 py-6">
      <QualificationDetail rtoId={id} qualId={qualId} />
    </div>
  );
}
