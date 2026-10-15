"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, X } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";
import { usePageTransition } from "@/components/ui/TransitionProvider";
import { answer, WELCOME, type ChatAction, type ChatAnswer } from "./knowledge";

export interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

interface Message extends ChatAnswer {
  from: "bot" | "you";
  id: number;
}

/** The conversation survives page changes within the visit, not beyond it */
const STORE = "site-chat";
const MAX_LENGTH = 300;

let nextId = 1;
const welcome = (): Message => ({ ...WELCOME, from: "bot", id: nextId++ });

function restore(): Message[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORE) ?? "null") as Message[] | null;
    if (Array.isArray(saved) && saved.length) {
      nextId = Math.max(...saved.map((m) => m.id)) + 1;
      return saved;
    }
  } catch {}
  return [welcome()];
}

/**
 * The chat panel: the conversation, suggested questions, and a box to type
 * in. Answers come from knowledge.ts after a short, natural pause; links to
 * pages on this site use the site's page transition.
 */
export default function ChatPanel({ open, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(restore);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { transitionTo } = usePageTransition();

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(messages.slice(-40)));
    } catch {}
  }, [messages]);

  // Newest at the bottom, in view
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  // Into the box on open (not on phones, where the keyboard would cover the answers)
  useEffect(() => {
    if (open && window.matchMedia("(hover: hover) and (pointer: fine)").matches) inputRef.current?.focus();
  }, [open]);

  const ask = (text: string) => {
    const q = text.trim().slice(0, MAX_LENGTH);
    if (!q || typing) return;
    setMessages((m) => [...m, { from: "you", text: q, id: nextId++ }]);
    setDraft("");
    setTyping(true);
    const reply = answer(q);
    // A beat to read as a reply, longer for longer answers
    const wait = Math.min(1100, 380 + reply.text.length * 2.2);
    window.setTimeout(() => {
      setMessages((m) => [...m, { ...reply, from: "bot", id: nextId++ }]);
      setTyping(false);
    }, wait);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(draft);
  };

  const follow = (a: ChatAction, el: HTMLElement) => (e: React.MouseEvent) => {
    if (a.external || !a.href.startsWith("/")) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    onClose();
    transitionTo(a.href, el, "#3BA7F2", a.label.toUpperCase());
  };

  const last = messages[messages.length - 1];
  const chips = !typing && last?.from === "bot" ? last.suggest ?? [] : [];

  return (
    <section
      id="site-chat"
      className="chat"
      data-open={open ? "true" : "false"}
      role="dialog"
      aria-label="Ask about Ahmad"
      aria-hidden={!open}
      inert={!open}
    >
      <header className="chat__head">
        <span className="chat__mark" aria-hidden="true">
          <LogoMark />
        </span>
        <span className="chat__title">
          <b>Ask about Ahmad</b>
          <small>Instant answers from this site</small>
        </span>
        <button type="button" className="chat__close" onClick={onClose} aria-label="Close the chat">
          <X aria-hidden="true" strokeWidth={2} />
        </button>
      </header>

      <div ref={listRef} className="chat__list" aria-live="polite" data-lenis-prevent="">
        {messages.map((m) => (
          <div key={m.id} className={`chat__msg chat__msg--${m.from}`}>
            <p>{m.text}</p>
            {m.actions && m.actions.length > 0 && (
              <div className="chat__actions">
                {m.actions.map((a) => (
                  <a
                    key={a.label}
                    href={a.href}
                    className="chat__action"
                    {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    onClick={(e) => follow(a, e.currentTarget)(e)}
                  >
                    {a.label}
                    <span aria-hidden="true">{a.external ? " ↗" : " →"}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div className="chat__msg chat__msg--bot chat__msg--typing" aria-label="Typing">
            <i />
            <i />
            <i />
          </div>
        )}
      </div>

      {chips.length > 0 && (
        <div className="chat__chips" data-lenis-prevent="">
          {chips.map((c) => (
            <button key={c} type="button" className="chat__chip" onClick={() => ask(c)}>
              {c}
            </button>
          ))}
        </div>
      )}

      <form className="chat__form" onSubmit={submit}>
        <label className="sr-only" htmlFor="site-chat-input">
          Your question
        </label>
        <input
          ref={inputRef}
          id="site-chat-input"
          className="chat__input"
          value={draft}
          maxLength={MAX_LENGTH}
          autoComplete="off"
          placeholder="Ask about prices, projects, hiring…"
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="chat__send" aria-label="Send" disabled={!draft.trim() || typing}>
          <ArrowUp aria-hidden="true" strokeWidth={2.25} />
        </button>
      </form>
      <p className="chat__note">Answers come from this site. Nothing you type is sent anywhere.</p>
    </section>
  );
}
