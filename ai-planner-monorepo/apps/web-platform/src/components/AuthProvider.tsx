import React, { useEffect, useState } from "react";
import { getAccessToken } from "../api/client";
import styled from "@emotion/styled";

const Splash = styled.div`
  padding: 40px;
  color: #fff;
  text-align: center;
`;

const ErrorScreen = styled.div`
  padding: 40px;
  color: #ff6b6b;
  text-align: center;
`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAccessToken()
      .then(() => setStatus("ready"))
      .catch((err: Error) => {
        setError(err.message);
        setStatus("error");
      });
  }, []);

  if (status === "loading") return <Splash>Загрузка...</Splash>;
  if (status === "error") return <ErrorScreen>Ошибка подключения: {error}</ErrorScreen>;

  return <>{children}</>;
}