"use client";

import { FormEvent, useRef, useState } from "react";
import { sendMessage } from "@/lib/api";

type Turn = {
  role: "user" | "coach";
  content: string;
};

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

  return (
    <>
      <section className="transcript" aria-live="polite">
        {turns.length === 0 ? (
          <p className="empty">Tell the coach what is on your mind.</p>
        ) : (
          turns.map((turn, index) => (
            <p key={`${turn.role}-${index}`} className={`bubble ${turn.role}`}>
              {turn.content}
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
