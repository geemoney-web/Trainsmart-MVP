import { redirect } from 'next/navigation';

export default async function RtoIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/rto/${id}/qualifications`);
}
