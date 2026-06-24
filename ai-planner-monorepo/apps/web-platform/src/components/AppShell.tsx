import { Outlet, NavLink } from "react-router-dom";
import styled from "@emotion/styled";
import { useState } from "react";

const Root = styled.div`
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  background: #0f0f0f;
  color: #fff;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Sidebar = styled.aside`
  width: 260px;
  background: #1a1a1a;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-right: 1px solid #2a2a2a;

  @media (max-width: 768px) {
    width: 100%;
    flex-direction: row;
    align-items: center;
    padding: 12px 16px;
    border-right: none;
    border-bottom: 1px solid #2a2a2a;
    position: sticky;
    top: 0;
    z-index: 100;
  }
`;

const Brand = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #fff;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: #888;
  margin: 0;
  line-height: 1.5;

  @media (max-width: 768px) {
    display: none;
  }
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;

  @media (max-width: 768px) {
    flex-direction: row;
    margin-top: 0;
    margin-left: auto;
    gap: 4px;
  }
`;

const NavItem = styled(NavLink)`
  color: #aaa;
  text-decoration: none;
  font-size: 15px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s, color 0.2s;
  white-space: nowrap;

  &:hover {
    background: #2a2a2a;
    color: #fff;
  }

  &.active {
    background: #333;
    color: #fff;
  }

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 8px 10px;
  }
`;

const Main = styled.main`
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
  padding-bottom: 32px;

  @media (max-width: 768px) {
    padding: 16px;
    padding-bottom: 24px;
  }
`;

export function AppShell() {
  return (
    <Root>
      <Sidebar>
        <Brand>AI Planner</Brand>
        <Subtitle>
          Умное планирование задач, привычек и повседневного ритма.
        </Subtitle>

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