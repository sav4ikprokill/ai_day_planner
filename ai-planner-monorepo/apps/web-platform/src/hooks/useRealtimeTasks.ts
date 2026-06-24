import { useCallback, useEffect, useRef, useState } from "react";
import type { TaskResponse } from "@ai-planner/contracts";
import { getAccessToken } from "../api/client";

type WSEvent =
  | { type: "task_created"; task: TaskResponse }
  | { type: "task_updated"; task: TaskResponse }
  | { type: "task_deleted"; task: TaskResponse };

type UseRealtimeOptions = {
  onTaskCreated?: (task: TaskResponse) => void;
  onTaskUpdated?: (task: TaskResponse) => void;
  onTaskDeleted?: (task: TaskResponse) => void;
};

const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000];

export function useRealtimeTasks({
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
}: UseRealtimeOptions = {}) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  const callbacksRef = useRef({ onTaskCreated, onTaskUpdated, onTaskDeleted });
  callbacksRef.current = { onTaskCreated, onTaskUpdated, onTaskDeleted };

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const token = await getAccessToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
      const wsUrl = apiBase.replace(/^http/, "ws") + `/ws/tasks?token=${token}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        reconnectAttempt.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data: WSEvent = JSON.parse(event.data);

          switch (data.type) {
            case "task_created":
              callbacksRef.current.onTaskCreated?.(data.task);
              break;
            case "task_updated":
              callbacksRef.current.onTaskUpdated?.(data.task);
              break;
            case "task_deleted":
              callbacksRef.current.onTaskDeleted?.(data.task);
              break;
          }
        } catch (err) {
          console.error("Failed to parse WS message:", err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;

        const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt.current, RECONNECT_DELAYS.length - 1)];
        reconnectAttempt.current++;

        reconnectTimer.current = setTimeout(() => {
          void connect();
        }, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (err) {
      console.error("WS connect failed:", err);
    }
  }, []);

  useEffect(() => {
    void connect();

    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  return { connected };
}
