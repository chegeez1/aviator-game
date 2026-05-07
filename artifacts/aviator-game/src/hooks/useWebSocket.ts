import { useEffect, useRef, useCallback } from "react";

type WsMessage = Record<string, unknown> & { type: string };
type Handler = (msg: WsMessage) => void;

export function useWebSocket(onMessage: Handler): { connected: boolean; wsRef: React.MutableRefObject<WebSocket | null> } {
  const wsRef = useRef<WebSocket | null>(null);
  const connectedRef = useRef(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const ws = new WebSocket(`${proto}//${host}/ws`);

    ws.onopen = () => {
      connectedRef.current = true;
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as WsMessage;
        onMessageRef.current(msg);
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      connectedRef.current = false;
      wsRef.current = null;
      reconnectTimer.current = setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected: connectedRef.current, wsRef };
}
