import { useEffect, useRef, useCallback } from 'react';

const BASE_WS = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
  .replace(/^http/, 'ws');

export function useTournamentSocket(
  tournamentId: number,
  onMessage: (data: unknown) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    const ws = new WebSocket(`${BASE_WS}/ws/tournament/${tournamentId}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onMessageRef.current(data);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      // Reconnect after 3s
      setTimeout(connect, 3000);
    };

    // Ping every 25s to keep alive
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send('ping');
    }, 25000);

    ws.onclose = () => {
      clearInterval(ping);
      setTimeout(connect, 3000);
    };
  }, [tournamentId]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);
}
