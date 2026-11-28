import { Fragment } from "react";

/**
 * A translated template whose {placeholders} are React nodes (bold text, links), e.g.
 * <Rich text={t("quiz.answer")} nodes={{ answer: <b>…</b> }} />. Pure: works in server and client components.
 */
export function Rich({ text, nodes }: { text: string; nodes: Record<string, React.ReactNode> }) {
  return <>{text.split(/\{(\w+)\}/).map((part, i) => (i % 2 ? <Fragment key={i}>{part in nodes ? nodes[part] : `{${part}}`}</Fragment> : part))}</>;
}
