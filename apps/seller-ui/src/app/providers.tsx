'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import useSeller from '../hooks/useSeller';
import { WebSocketProvider } from '../context/web-socket-context';
import { Toaster } from 'sonner';

const Providers = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ProvidersWithWebSocket>{children}</ProvidersWithWebSocket>
      <Toaster />
    </QueryClientProvider>
  );
};

const ProvidersWithWebSocket = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { seller, isLoading } = useSeller();

  // Always wrap with WebSocketProvider, but it will only connect if seller exists
  // This prevents context from being null when seller is not logged in
  return <WebSocketProvider seller={seller}>{children}</WebSocketProvider>;
};

export default Providers;
