import { redirect } from 'next/navigation';

export default function RtoIndexPage({ params }: { params: { id: string } }) {
  redirect(`/rto/${params.id}/qualifications`);
}
