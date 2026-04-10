import styled from "@emotion/styled";

const Panel = styled.section`
  padding: 18px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.66);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(18px);
`;
const SectionTitle = styled.h2`margin:0;font-size:1.05rem;letter-spacing:-0.03em;`;
const SectionText = styled.p`margin:6px 0 0;color:var(--tg-theme-hint-color,rgba(15,23,42,.62));font-size:.92rem;line-height:1.45;`;
const ComposerForm = styled.form`display:flex;flex-direction:column;gap:12px;margin-top:16px;`;
const ComposerInput = styled.input`
  width:100%;padding:16px 18px;border:1px solid rgba(148,163,184,.28);border-radius:20px;background:rgba(255,255,255,.88);color:var(--tg-theme-text-color,#0f172a);
  transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease;
  &::placeholder{color:rgba(100,116,139,.9);}
  &:focus{outline:none;border-color:rgba(79,70,229,.45);box-shadow:0 0 0 4px rgba(79,70,229,.12),0 10px 24px rgba(79,70,229,.12);transform:translateY(-1px);}
`;
const PrimaryButton = styled.button<{ disabled?: boolean }>`
  border:none;border-radius:20px;padding:15px 18px;color:#fff;font-weight:700;letter-spacing:-.02em;background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);
  box-shadow:0 14px 30px rgba(79,70,229,.24),inset 0 1px 0 rgba(255,255,255,.2);
  transition:transform .18s ease,box-shadow .18s ease,opacity .18s ease;cursor:${({ disabled }) => (disabled ? "not-allowed" : "pointer")};opacity:${({ disabled }) => (disabled ? 0.68 : 1)};
  &:hover{transform:${({ disabled }) => (disabled ? "none" : "translateY(-1px)")};box-shadow:${({ disabled }) => disabled ? "0 14px 30px rgba(79, 70, 229, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.2)" : "0 18px 36px rgba(79, 70, 229, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"};}
  &:active{transform:${({ disabled }) => (disabled ? "none" : "scale(0.985)")};}
`;
const FeedbackMessage = styled.p`margin:14px 0 0;color:rgba(51,65,85,.96);line-height:1.45;`;

interface QuickAddPanelProps {
  text: string;
  onTextChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  message: string;
}

export function QuickAddPanel({ text, onTextChange, onSubmit, message }: QuickAddPanelProps) {
  return (
    <Panel>
      <SectionTitle>Быстрое добавление</SectionTitle>
      <SectionText>Опиши задачу обычной фразой, а ИИ сам приведёт её к нужному виду.</SectionText>
      <ComposerForm onSubmit={onSubmit}>
        <ComposerInput value={text} onChange={(event) => onTextChange(event.target.value)} placeholder="Например: добавь тренировку завтра в 19:00" />
        <PrimaryButton type="submit">Добавить через ИИ</PrimaryButton>
      </ComposerForm>
      {message && <FeedbackMessage>{message}</FeedbackMessage>}
    </Panel>
  );
}
