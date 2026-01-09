'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Toaster } from 'sonner';
import useUser from '../hooks/useUser';
import { WebSocketProvider } from '../context/web-socket-context';

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
  const { user, isLoading } = useUser();

  // Always wrap with WebSocketProvider, but it will only connect if user exists
  // This prevents context from being null when user is not logged in
  return <WebSocketProvider user={user}>{children}</WebSocketProvider>;
};

export default Providers;
