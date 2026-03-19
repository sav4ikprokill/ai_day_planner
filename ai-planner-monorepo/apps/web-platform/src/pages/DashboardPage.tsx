import styled from "@emotion/styled";
import { Card, CardText, CardTitle } from "../components/Card";

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const StatBox = styled.div`
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
`;

const StatLabel = styled.div`
  margin-top: 6px;
  color: #cbd5e1;
`;

export function DashboardPage() {
  return (
    <Card>
      <CardTitle>Dashboard</CardTitle>
      <CardText>
        Главный экран платформы. Здесь потом будут задачи на сегодня,
        выполненные задачи и продуктивность.
      </CardText>

      <Stats>
        <StatBox>
          <StatValue>4</StatValue>
          <StatLabel>Задачи на сегодня</StatLabel>
        </StatBox>
        <StatBox>
          <StatValue>2</StatValue>
          <StatLabel>Выполнено</StatLabel>
        </StatBox>
        <StatBox>
          <StatValue>81%</StatValue>
          <StatLabel>Продуктивность</StatLabel>
        </StatBox>
      </Stats>
    </Card>
  );
}