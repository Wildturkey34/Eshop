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
  user,
}: {
  children: React.ReactNode;
  user: any;
}) => {
  const [wsReady, setWsReady] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user?.id) return;

    const wsUrl = process.env.NEXT_PUBLIC_CHATTING_WEBSOCKET_URI;

    // Skip WebSocket connection if no URL is configured
    if (!wsUrl) {
      console.warn(
        'WebSocket URL not configured. Chat features will be disabled.'
      );
      return;
    }

    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(`user_${user.id}`);
        setWsReady(true);
        console.log('WebSocket connected successfully');
      };

      ws.onerror = (error) => {
        console.warn(
          'WebSocket connection failed. Chat features may be unavailable.'
        );
        setWsReady(false);
      };

      ws.onclose = () => {
        setWsReady(false);
      };

      ws.onmessage = (event) => {
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
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setWsReady(false);
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user?.id]);

  return (
    <WebSocketContext.Provider
      value={{ ws: wsRef.current, unreadCounts, wsReady }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
