import styled from "@emotion/styled";
import { NavLink, Outlet } from "react-router-dom";

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

export function AppShell() {
  return (
    <Root>
      <Sidebar>
        <Brand>AI Planner</Brand>
        <Subtitle>
          Умное планирование задач, привычек и повседневного ритма.
        </Subtitle>

        <Nav>
          <NavItem to="/">Dashboard</NavItem>
          <NavItem to="/tasks">Tasks</NavItem>
          <NavItem to="/habits">Habits</NavItem>
        </Nav>
      </Sidebar>

      <Main>
        <Outlet />
      </Main>
    </Root>
  );
}