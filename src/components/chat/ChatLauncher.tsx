"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { MessageCircle } from "lucide-react";
import { usePageReady } from "@/components/ui/page-ready";
import type { ChatPanelProps } from "./ChatPanel";

/* The panel and the assistant's knowledge are their own chunk, fetched the
   first time the visitor shows interest (hover, focus or a tap), so the chat
   costs the page nothing until somebody wants it. */
let panelChunk: Promise<{ default: ComponentType<ChatPanelProps> }> | null = null;
const loadPanel = () => (panelChunk ??= import("./ChatPanel"));

/**
 * The round chat button above the mail button, on every page, and the panel
 * it opens: an assistant that answers questions about Ahmad from the site's
 * own content, in the visitor's browser (see knowledge.ts).
 */
export default function ChatLauncher() {
  const ready = usePageReady();
  const [open, setOpen] = useState(false);
  const [Panel, setPanel] = useState<ComponentType<ChatPanelProps> | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const warm = useCallback(() => {
    loadPanel().then((m) => setPanel(() => m.default));
  }, []);

  const toggle = () => {
    warm();
    setOpen((o) => !o);
  };

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  // Escape closes it from anywhere
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="chat-fab"
        data-magnetic=""
        data-ready={ready ? "true" : "false"}
        data-open={open ? "true" : "false"}
        aria-label={open ? "Close the chat" : "Ask a question"}
        aria-expanded={open}
        aria-controls="site-chat"
        onPointerEnter={warm}
        onFocus={warm}
        onClick={toggle}
      >
        <MessageCircle aria-hidden="true" strokeWidth={1.75} />
        <span className="chat-fab__x" aria-hidden="true" />
        <span className="mail-fab__tip" aria-hidden="true">
          Ask me anything
        </span>
      </button>
      {Panel && <Panel open={open} onClose={close} />}
    </>
  );
}
