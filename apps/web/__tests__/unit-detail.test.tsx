import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { UnitDetail } from '@/components/units/UnitDetail';

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

it('renders without crashing', () => {
  render(<UnitDetail rtoId="rto-123" unitId="unit-456" />, { wrapper });
});
