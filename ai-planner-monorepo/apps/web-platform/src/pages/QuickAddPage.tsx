import { useState } from "react";
import styled from "@emotion/styled";
import { Card, CardTitle } from "../components/Card";
import { createTaskFromText } from "../api/tasks";

const Form = styled.form`
  display: grid;
  gap: 12px;
`;

const Input = styled.input`
  padding: 14px 16px;
  border: none;
  border-radius: 16px;
  outline: none;
`;

const Button = styled.button`
  padding: 14px 16px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-weight: 600;
`;

const Message = styled.div`
  color: #cbd5e1;
`;

export function QuickAddPage() {
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!text.trim()) {
      setMessage("Введи текст задачи");
      return;
    }

    try {
      const task = await createTaskFromText(text);
      setMessage(`Создано: ${task.title}`);
      setText("");
    } catch (error) {
      console.error(error);
      setMessage("Не удалось создать задачу");
    }
  }

  return (
    <Card>
      <CardTitle>Quick Add</CardTitle>
      <Form onSubmit={handleSubmit}>
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="добавь тренировку завтра в 19:00"
        />
        <Button type="submit">Создать задачу</Button>
        {message && <Message>{message}</Message>}
      </Form>
    </Card>
  );
}