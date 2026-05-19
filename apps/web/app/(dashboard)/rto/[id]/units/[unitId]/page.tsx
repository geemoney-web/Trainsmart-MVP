import { UnitDetail } from '@/components/units/UnitDetail';

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id, unitId } = await params;
  return (
    <div className="px-8 py-6">
      <UnitDetail rtoId={id} unitId={unitId} />
    </div>
  );
}
