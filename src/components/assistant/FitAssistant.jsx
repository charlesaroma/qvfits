/* Fit Assistant (from Quivogue js/assistant.js widget) */
import { useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";

import { assistantGreeting, forgetAssistant, useAskAssistant, useSettings } from "@/store/tanstackStore/queries/site";
import AssistantMessage from "./AssistantMessage";
import { AssistantMark } from "./AssistantMark";
import { onAskVee } from "./askVee";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { whatsappLink } from "@/utils/whatsapp";

const bot = (text) => ({ from: "bot", blocks: [{ type: "text", paras: [text] }] });

/**
 * Vee: the round button and the chat panel. Opened by the button, by
 * askVee("…") from any page, and closed with Escape. Her name, greeting,
 * starter questions, human WhatsApp handoff and on/off switch are set in the dashboard (Vee).
 */
export default function FitAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const ask = useAskAssistant();
  const { data: settings } = useSettings();
  const vee = settings?.assistant;
  const chips = vee?.chips ?? [];
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const sendRef = useRef(null);

  // A new reply opens at its first line, so the shopper reads it from the top (a long outfit reply used to land at its end, with the start scrolled away). Her own message and the typing dots keep the view at the bottom.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const last = messages[messages.length - 1];
    if (last?.from === "bot" && !ask.isPending) {
      const turn = [...body.querySelectorAll("[data-turn]")].at(-1);
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      // Measured from the panel itself, since the turn's offset parent is not the scrolling body.
      const top = turn ? turn.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 12 : body.scrollHeight;
      body.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
    } else {
      body.scrollTo({ top: body.scrollHeight });
    }
  }, [messages, ask.isPending]);

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => inputRef.current?.focus(), 320);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // askVee("…") from any page opens the panel and sends the question.
  useEffect(
    () =>
      onAskVee((question) => {
        setOpen(true);
        if (question) setTimeout(() => sendRef.current?.(question), 250);
      }),
    [],
  );

  const send = async (text) => {
    if (!text.trim() || ask.isPending) return;
    setMessages((m) => [...m, { from: "me", text }]);
    try {
      const blocks = await ask.mutateAsync(text);
      setMessages((m) => [...m, { from: "bot", blocks }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          from: "bot",
          blocks: [
            { type: "text", paras: ["Something went wrong on my side. But our team is right here to help on WhatsApp:"] },
            {
              type: "whatsapp",
              label: "Chat with Admin on WhatsApp",
              note: "Direct line to our studio team in Kampala",
              message: "Hi QVfits team, I was chatting with Vee and ran into an issue.",
              phone: settings?.whatsapp || "256758981959",
            },
          ],
        },
      ]);
    }
  };

  useEffect(() => {
    sendRef.current = send;
  });

  if (vee && vee.enabled === false) return null;

  // Her greeting leads the chat; it follows the dashboard's words until she knows the shopper's name.
  const thread = [bot(assistantGreeting(vee?.greeting)), ...messages];
  // The starter buttons show until a reply brings its own quick replies.
  const last = thread[thread.length - 1];
  const ownChips = last.blocks?.some((b) => b.type === "chips");

  return (
    <>
      <button type="button" className={`asst-btn ${open ? "is-open" : ""}`} aria-label="Open the Style Assistant" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <AssistantMark />
      </button>

      <section className={`asst ${open ? "is-open" : ""}`} aria-live="polite" aria-label="Style Assistant">
        <header className="asst__head">
          <div className="asst__av"><AssistantMark /></div>
          <div className="asst__meta">
            <strong>{vee?.name || "Vee"}</strong>
            <span>Your QV fit guide</span>
          </div>

          {vee?.whatsappHandover !== false && (
            <a
              href={whatsappLink(
                settings?.whatsapp || "256758981959",
                "Hi QVfits team, I'm browsing the store and would like to speak with a human."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="asst__human-btn"
              title="Talk to Admin on WhatsApp"
              aria-label="Connect to Admin on WhatsApp"
            >
              <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" />
              <span className="asst__human-label">Talk to Human</span>
            </a>
          )}

          <button type="button" className="asst__close" aria-label="Close" onClick={() => setOpen(false)}>
            <X className="h-[19px] w-[19px]" aria-hidden="true" />
          </button>
        </header>

        <div className="asst__body" ref={bodyRef}>
          {thread.map((m, i) => (
            // Each turn is its own block, so a reply's top can be found and scrolled to.
            <div key={i} className="asst__turn" {...(m.from === "bot" && i > 0 ? { "data-turn": true } : {})}>
              <AssistantMessage message={m} onLeave={() => setOpen(false)} onAsk={send} isLast={i === thread.length - 1 && !ask.isPending} />
            </div>
          ))}
          {ask.isPending && (
            <div className="msg msg--bot msg--typing"><span className="typing"><i /><i /><i /></span></div>
          )}
        </div>

        {!ask.isPending && !ownChips && (
          <div className="asst__chips">
            {chips.map((c) => <button key={c} type="button" onClick={() => send(c)}>{c}</button>)}
            {vee?.whatsappHandover !== false && !chips.some((c) => /human|admin|whatsapp/i.test(c)) && (
              <button
                type="button"
                className="asst__chip--human"
                onClick={() => send("Can I talk to a human?")}
              >
                Talk to a human
              </button>
            )}
          </div>
        )}

        <div className="asst__foot">
          <form
            className="asst__form"
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
              setDraft("");
            }}
          >
            <input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask me anything…" autoComplete="off" aria-label="Message the Style Assistant" />
            <button className="asst__send" type="submit" aria-label="Send"><ArrowRight className="h-[15px] w-[15px]" aria-hidden="true" /></button>
          </form>
          <p className="asst__note">
            Need a person?{" "}
            <a
              href={whatsappLink(settings?.whatsapp || "256758981959", "Hi QVfits team, I'd like to chat with a person.")}
              target="_blank"
              rel="noopener noreferrer"
              className="asst__wa-note-link"
            >
              Chat on WhatsApp
            </a>
            {" · "}
            <button type="button" className="asst__forget" onClick={() => { forgetAssistant(); setMessages((m) => [...m, bot("Done. I have forgotten your name, size and budget.")]); }}>Forget me</button>
          </p>
        </div>
      </section>
    </>
  );
}
