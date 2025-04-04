'use client';

import { useState, useEffect, useCallback } from 'react';

interface WebSocketHook {
  lastMessage: string | null;
  readyState: number;
  sendMessage: (message: string) => void;
}

export function useWebSocket(url: string): WebSocketHook {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setReadyState(WebSocket.OPEN);
      
      // Send join message
      ws.send(JSON.stringify({
        type: 'join',
        websiteId: url.split('websiteId=')[1],
      }));
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setReadyState(WebSocket.CLOSED);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      setLastMessage(event.data);
    };

    setSocket(ws);

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [url]);

  const sendMessage = useCallback(
    (message: string) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    },
    [socket]
  );

  return {
    lastMessage,
    readyState,
    sendMessage,
  };
} 