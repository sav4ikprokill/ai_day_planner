import styled from "@emotion/styled";
import { DashboardPage } from "./pages/DashboardPage";
import { HabitsPage } from "./pages/HabitsPage";
import { QuickAddPage } from "./pages/QuickAddPage";
import { TasksPage } from "./pages/TasksPage";

const Layout = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px 1fr;
  background: linear-gradient(180deg, #0b1020 0%, #121a30 100%);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.aside`
  padding: 24px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(7, 12, 24, 0.9);

  @media (max-width: 900px) {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
`;

const Main = styled.main`
  padding: 24px;
`;

const Brand = styled.h1`
  margin: 0 0 24px;
  font-size: 28px;
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

const NavItem = styled.div`
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
`;

const Grid = styled.div`
  display: grid;
  gap: 20px;
`;

export function App() {
  return (
    <Layout>
      <Sidebar>
        <Brand>AI Planner</Brand>
        <Nav>
          <NavItem>Dashboard</NavItem>
          <NavItem>Tasks</NavItem>
          <NavItem>Habits</NavItem>
          <NavItem>Quick Add</NavItem>
        </Nav>
      </Sidebar>

      <Main>
        <Grid>
          <DashboardPage />
          <QuickAddPage />
          <TasksPage />
          <HabitsPage />
        </Grid>
      </Main>
    </Layout>
  );
}