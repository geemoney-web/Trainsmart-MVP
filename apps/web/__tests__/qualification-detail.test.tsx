import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { QualificationDetail } from '@/components/qualifications/QualificationDetail';

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

it('renders without crashing', () => {
  render(<QualificationDetail rtoId="rto-123" qualId="qual-456" />, { wrapper });
});
