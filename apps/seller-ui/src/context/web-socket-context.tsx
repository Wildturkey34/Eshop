'use client';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

const WebSocketContext = createContext<any>(null);

export const WebSocketProvider = ({
  children,
  seller,
}: {
  children: React.ReactNode;
  seller: any;
}) => {
  const [wsReady, setWsReady] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!seller?.id) return;

    const wsUrl = process.env.NEXT_PUBLIC_CHATTING_WEBSOCKET_URI;

    // Skip WebSocket connection if no URL is configured
    if (!wsUrl) {
      console.warn('WebSocket URL not configured. Chat features will be disabled.');
      return;
    }

    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(`seller_${seller.id}`);
        setWsReady(true);
        console.log('WebSocket connected successfully');
      };

      ws.onerror = (error) => {
        console.warn('WebSocket connection failed. Chat features may be unavailable.');
        setWsReady(false);
      };

      ws.onclose = () => {
        setWsReady(false);
      };

      const handleMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'UNSEEN_COUNT_UPDATE') {
            const { conversationId, count } = data.payload;
            setUnreadCounts((prev) => ({ ...prev, [conversationId]: count }));
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.addEventListener('message', handleMessage);

      return () => {
        ws.removeEventListener('message', handleMessage);
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setWsReady(false);
    }
  }, [seller?.id]);

  return (
    <WebSocketContext.Provider value={{ ws: wsRef.current, unreadCounts, wsReady }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
