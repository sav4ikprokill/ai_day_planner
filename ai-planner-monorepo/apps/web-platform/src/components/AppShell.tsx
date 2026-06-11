import styled from "@emotion/styled";
import { NavLink, Outlet } from "react-router-dom";
import { getAuthMode, resetAuthMode, setAuthMode } from "../api/client";

const Root = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px 1fr;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 28%),
    linear-gradient(180deg, #0b1020 0%, #121a30 100%);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.aside`
  padding: 24px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(7, 12, 24, 0.84);
  backdrop-filter: blur(12px);

  @media (max-width: 900px) {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
`;

const Brand = styled.h1`
  margin: 0 0 24px;
  font-size: 28px;
  letter-spacing: -0.03em;
`;

const Subtitle = styled.p`
  margin: 0 0 20px;
  color: #94a3b8;
  line-height: 1.5;
`;

const AuthBox = styled.div`
  margin: 0 0 20px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(96, 165, 250, 0.3);
`;

const AuthLabel = styled.div`
  margin-bottom: 8px;
  font-size: 13px;
  color: #bfdbfe;
`;

const AuthBadge = styled.div`
  display: inline-flex;
  margin-bottom: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #f8fafc;
  font-size: 13px;
  font-weight: 700;
`;

const AuthHint = styled.p`
  margin: 0 0 12px;
  color: #cbd5e1;
  font-size: 13px;
  line-height: 1.45;
`;

const AuthActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AuthButton = styled.button`
  width: 100%;
  border: 0;
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  cursor: pointer;
  font-weight: 700;
  transition: 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.18);
  }
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 10px;

  @media (max-width: 900px) {
    flex-direction: row;
    flex-wrap: wrap;
  }
`;

const NavItem = styled(NavLink)`
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  color: #f3f4f6;
  text-decoration: none;
  transition: 0.2s ease;

  &.active {
    background: rgba(255, 255, 255, 0.12);
  }
`;

const Main = styled.main`
  padding: 24px;
`;

function AuthModePanel() {
  const mode = getAuthMode();

  const isDemo = mode === "demo";

  return (
    <AuthBox>
      <AuthLabel>Режим входа</AuthLabel>
      <AuthBadge>{isDemo ? "Demo Mode" : "Telegram Mode"}</AuthBadge>

      <AuthHint>
        {isDemo
          ? "Демо-режим использует общий тестовый аккаунт. Данные могут быть видны другим пользователям демо-версии."
          : "Рабочий режим использует Telegram WebApp. Задачи привязываются к вашему Telegram ID."}
      </AuthHint>

      <AuthActions>
        <AuthButton type="button" onClick={() => setAuthMode("demo")}>
          Демо-режим
        </AuthButton>
        <AuthButton type="button" onClick={() => setAuthMode("telegram")}>
          Telegram-режим
        </AuthButton>
        <AuthButton type="button" onClick={resetAuthMode}>
          Сбросить выбор
        </AuthButton>
      </AuthActions>
    </AuthBox>
  );
}

export function AppShell() {
  return (
    <Root>
      <Sidebar>
        <Brand>AI Planner</Brand>
        <Subtitle>
          Умное планирование задач, привычек и повседневного ритма.
        </Subtitle>

        <AuthModePanel />

        <Nav>
          <NavItem to="/">Обзор</NavItem>
          <NavItem to="/tasks">Задачи</NavItem>
          <NavItem to="/habits">Привычки</NavItem>
        </Nav>
      </Sidebar>

      <Main>
        <Outlet />
      </Main>
    </Root>
  );
}