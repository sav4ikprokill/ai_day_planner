import { Global, css } from "@emotion/react";
import styled from "@emotion/styled";
import { useState } from "react";
import { Login } from "./components/Login";
import { OptimizerPanel } from "./components/OptimizerPanel";
import { QuickAddPanel } from "./components/QuickAddPanel";
import { TaskPanel } from "./components/TaskPanel";
import { useTasks } from "./hooks/useTasks";
import {
  enableStandaloneDevAuth,
  getStoredDisplayName,
  isAuthenticated,
  isTelegramWebAppAvailable,
} from "./api-client";

const globalStyles = css`:root{color-scheme:light;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:radial-gradient(circle at top left,rgba(79,70,229,.18),transparent 32%),radial-gradient(circle at top right,rgba(45,212,191,.16),transparent 24%),linear-gradient(180deg,#f8fafc 0%,#eef2ff 45%,#f3f4f6 100%);color:var(--tg-theme-text-color,#0f172a)}*{box-sizing:border-box}html,body,#root{min-height:100%;margin:0}body{min-height:100vh;background:radial-gradient(circle at top left,rgba(79,70,229,.18),transparent 32%),radial-gradient(circle at top right,rgba(45,212,191,.16),transparent 24%),linear-gradient(180deg,#f8fafc 0%,#eef2ff 45%,#f3f4f6 100%);color:var(--tg-theme-text-color,#0f172a);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}button,input,textarea{font:inherit}`;
const AppBackdrop = styled.div`min-height:100vh;padding:18px 14px 42px;`;
const DeviceFrame = styled.div`width:100%;max-width:480px;margin:0 auto;border-radius:34px;overflow:hidden;background:var(--tg-theme-bg-color,rgba(255,255,255,.64));border:1px solid rgba(255,255,255,.6);box-shadow:0 25px 60px rgba(15,23,42,.14),inset 0 1px 0 rgba(255,255,255,.45);backdrop-filter:blur(22px);@media (max-width:520px){border-radius:0;max-width:none;min-height:calc(100vh - 36px)}}`;
const AppBar = styled.header`position:sticky;top:0;z-index:10;display:flex;flex-direction:column;gap:6px;padding:22px 20px 18px;background:rgba(255,255,255,.55);border-bottom:1px solid rgba(148,163,184,.15);backdrop-filter:blur(18px);`;
const AppTitle = styled.h1`margin:0;font-size:1.75rem;line-height:1.05;letter-spacing:-.04em;color:var(--tg-theme-text-color,#0f172a);`;
const AppSubtitle = styled.p`margin:0;color:var(--tg-theme-hint-color,rgba(15,23,42,.62));font-size:.95rem;line-height:1.45;`;
const IdentityChip = styled.div`display:inline-flex;align-items:center;gap:8px;width:fit-content;margin-top:12px;padding:10px 14px;border-radius:999px;background:rgba(79,70,229,.1);color:#3730a3;font-weight:600;font-size:.88rem;`;
const StandaloneNote = styled.p`margin:12px 0 0;color:#92400e;font-size:.9rem;line-height:1.45;`;
const AppBody = styled.main`padding:18px;display:flex;flex-direction:column;gap:14px;`;

export function App() {
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated());
  const [isTelegramEnv] = useState(isTelegramWebAppAvailable());
  const [displayName, setDisplayName] = useState(() => getStoredDisplayName() ?? "Пользователь Telegram");
  const { tasks, optimizedTasks, text, setText, loading, optimizing, message, submitTask, optimizeTasks } = useTasks(authenticated);

  function handleStandaloneLogin(name: string) {
    enableStandaloneDevAuth(name);
    setDisplayName(name.trim() || "Локальный пользователь");
    setAuthenticated(true);
  }

  if (!authenticated) return <><Global styles={globalStyles} /><Login onLogin={handleStandaloneLogin} /></>;

  return (
    <>
      <Global styles={globalStyles} />
      <AppBackdrop><DeviceFrame><AppBar><AppTitle>AI Planner</AppTitle><AppSubtitle>Умное планирование задач в Telegram, PWA и браузере.</AppSubtitle><IdentityChip>{isTelegramEnv ? "Telegram" : "Автономно"} • {displayName}</IdentityChip>{!isTelegramEnv && <StandaloneNote>Активен автономный PWA-режим. Используется локальная авторизация для демо и разработки.</StandaloneNote>}</AppBar><AppBody><QuickAddPanel text={text} onTextChange={setText} onSubmit={submitTask} message={message} /><OptimizerPanel optimizing={optimizing} optimizedTasks={optimizedTasks} onOptimize={optimizeTasks} /><TaskPanel loading={loading} tasks={tasks} /></AppBody></DeviceFrame></AppBackdrop>
    </>
  );
}
