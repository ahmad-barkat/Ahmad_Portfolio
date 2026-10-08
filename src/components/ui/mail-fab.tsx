"use client";

import { Mail } from "lucide-react";
import { QUICK_EMAIL_HREF } from "@/data/contact";
import { usePageReady } from "./page-ready";

/**
 * A small round mail button fixed to the bottom right of every page. Not
 * everyone has WhatsApp or Messenger, so this opens a new email to Ahmad in
 * whatever mail app the visitor uses. Waits for the page to be visible.
 */
export default function MailFab() {
  const ready = usePageReady();

  return (
    <a
      href={QUICK_EMAIL_HREF}
      className="mail-fab"
      data-ready={ready ? "true" : "false"}
      aria-label="Send me an email"
    >
      <Mail aria-hidden="true" strokeWidth={1.75} />
      <span className="mail-fab__tip" aria-hidden="true">
        Send me an email
      </span>
    </a>
  );
}
