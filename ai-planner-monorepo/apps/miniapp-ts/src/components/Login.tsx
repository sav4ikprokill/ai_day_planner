import styled from "@emotion/styled";
import { useState } from "react";

interface LoginProps {
  onLogin: (name: string) => void;
}

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
`;

const Shell = styled.section`
  width: 100%;
  max-width: 480px;
  padding: 34px 24px 28px;
  border-radius: 34px;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(24px);
  box-shadow:
    0 28px 60px rgba(15, 23, 42, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
  color: var(--tg-theme-text-color, #0f172a);
`;

const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(79, 70, 229, 0.1);
  color: #4338ca;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 18px 0 10px;
  font-size: clamp(2rem, 6vw, 2.7rem);
  line-height: 0.98;
  letter-spacing: -0.05em;
`;

const Subtitle = styled.p`
  margin: 0 0 22px;
  font-size: 0.98rem;
  line-height: 1.6;
  color: var(--tg-theme-hint-color, rgba(15, 23, 42, 0.64));
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Label = styled.label`
  font-size: 0.92rem;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.86);
`;

const Input = styled.input`
  width: 100%;
  padding: 17px 18px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(255, 255, 255, 0.92);
  color: var(--tg-theme-text-color, #0f172a);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &::placeholder {
    color: rgba(100, 116, 139, 0.92);
  }

  &:focus {
    outline: none;
    border-color: rgba(79, 70, 229, 0.45);
    box-shadow:
      0 0 0 4px rgba(99, 102, 241, 0.12),
      0 16px 28px rgba(79, 70, 229, 0.12);
    transform: translateY(-1px);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  border: none;
  border-radius: 18px;
  padding: 16px 18px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: #ffffff;
  font-weight: 800;
  letter-spacing: -0.02em;
  box-shadow:
    0 18px 34px rgba(99, 102, 241, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow:
      0 22px 40px rgba(99, 102, 241, 0.34),
      inset 0 1px 0 rgba(255, 255, 255, 0.22);
    filter: saturate(1.05);
  }

  &:active {
    transform: scale(0.985);
  }
`;

const FooterNote = styled.p`
  margin: 18px 0 0;
  color: rgba(71, 85, 105, 0.88);
  font-size: 0.88rem;
  line-height: 1.55;
`;

export function Login({ onLogin }: LoginProps) {
  const [name, setName] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin(name);
  }

  return (
    <Wrapper>
      <Shell>
        <Eyebrow>AI Planner</Eyebrow>
        <Title>Добро пожаловать в AI Planner</Title>
        <Subtitle>
          Используй AI Planner как Telegram Mini App или как отдельное PWA для
          планирования дня с помощью ИИ.
        </Subtitle>

        <LoginForm onSubmit={handleSubmit}>
          <Label htmlFor="name">Введите имя</Label>
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Алексей"
          />
          <SubmitButton type="submit">Продолжить</SubmitButton>
        </LoginForm>

        <FooterNote>
          Добавь приложение на экран домой, чтобы открыть его как почти нативное
          приложение на iPhone и Android.
        </FooterNote>
      </Shell>
    </Wrapper>
  );
}
