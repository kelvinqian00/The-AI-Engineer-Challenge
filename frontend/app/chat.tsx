"use client";

import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import { sendMessage } from "@/lib/api";

type Turn = {
  role: "user" | "coach";
  content: string;
};

/**
 * Curved speech-bubble tail, drawn for the bottom-right corner and mirrored
 * in CSS for the coach. SVG point (8, 8) sits on the bubble's outer corner.
 * The path is left open on purpose: SVG fills an open path as if it were
 * closed, but only strokes the segments actually drawn. So the fill covers
 * the bubble's corner (and its border, for the outlined coach bubble) while
 * the outline runs only along the two curved outer edges of the tail.
 *
 * Each edge is a quadratic curve ("Q control end"). Both control points sit
 * on the same side of their edge (offset toward the bottom-left), so the two
 * edges bend the same way and the tail curls outward like a hook.
 */
function BubbleTail() {
  return (
    <svg className="tail" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M 8 0 Q 9 10 15 15 Q 5 14 0 8" />
    </svg>
  );
}

/** Chat form for the mental-coach API. The OpenAI key stays on the server. */
export function Chat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  function grow(element: HTMLTextAreaElement) {
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || pending) {
      return;
    }

    setDraft("");
    setError(null);
    if (messageRef.current) {
      messageRef.current.style.height = "auto";
    }
    setTurns((current) => [...current, { role: "user", content: message }]);
    setPending(true);

    try {
      const reply = await sendMessage(message);
      setTurns((current) => [...current, { role: "coach", content: reply }]);
    } catch (caught) {
      const detail = caught instanceof Error ? caught.message : "Request failed";
      setError(detail);
    } finally {
      setPending(false);
    }
  }

  /**
   * Enter sends the message; Shift+Enter falls through to the textarea's
   * default behavior and inserts a newline. We skip Enter while an IME
   * composition is active (e.g. picking a Chinese/Japanese candidate), since
   * that Enter is meant to confirm the composition, not to send.
   */
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    // requestSubmit() goes through the form's normal submit path, so onSubmit
    // stays the single place that validates and sends. Skip it for empty or
    // in-flight drafts so the browser doesn't pop a "required" tooltip.
    if (draft.trim() && !pending) {
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <>
      <section className="transcript" aria-live="polite">
        {turns.length === 0 ? (
          <p className="empty">Tell the coach what is on your mind.</p>
        ) : (
          turns.map((turn, index) => (
            <p key={`${turn.role}-${index}`} className={`bubble ${turn.role}`}>
              {turn.content}
              <BubbleTail />
            </p>
          ))
        )}
        {pending ? <p className="pending">The coach is thinking…</p> : null}
      </section>

      {error ? <p className="error">{error}</p> : null}

      <form className="composer" onSubmit={onSubmit}>
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          ref={messageRef}
          value={draft}
          placeholder="What do you want to work through?"
          rows={2}
          required
          onKeyDown={onKeyDown}
          onChange={(event) => {
            setDraft(event.target.value);
            grow(event.target);
          }}
        />
        <button type="submit" disabled={pending || draft.trim().length === 0}>
          {pending ? "Sending" : "Send"}
        </button>
      </form>
    </>
  );
}
