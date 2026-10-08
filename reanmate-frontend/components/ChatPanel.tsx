"use client";

import { useEffect, useRef, useState } from "react";
import ListenButton from "@/components/ListenButton";
import Mascot from "@/components/Mascot";
import { getChatMessages, sendChatMessage } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import type { ChatMessage, SubjectId } from "@/lib/types";

const WELCOME =
  "សួស្តី! ខ្ញុំជា ReanMate។ មានចំណុចមិនយល់ក្នុងមេរៀននេះ សួរខ្ញុំបាន។";

const SUGGESTIONS: Record<SubjectId, string[]> = {
  math: ["តើអនុគមន៍គឺជាអ្វី?", "ដែនកំណត់នៃ f(x) = 1/x", "ជួយគណនា f(4)"],
  history: ["ហ្វូណនគឺជាអ្វី?", "អូរកែវសំខាន់ដូចម្តេច?", "ចេនឡាទាក់ទងនឹងហ្វូណនដូចម្តេច?"],
};

export default function ChatPanel({
  chapterId,
  subject,
  autoFocus = false,
}: {
  chapterId: string;
  subject: SubjectId;
  autoFocus?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const suggestions = SUGGESTIONS[subject] ?? SUGGESTIONS.math;
  const showSuggestions = messages.length === 0 && !typing;

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    getChatMessages(chapterId)
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch(() => {
        // Signed out or offline: start with an empty conversation.
      });
    return () => {
      cancelled = true;
    };
  }, [chapterId]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardInset(inset);
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, typing]);

  const send = async (raw?: string) => {
    const content = (raw ?? input).trim();
    if (!content || typing) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      chapterId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    const withUser = [...messages, userMessage];
    setMessages(withUser);
    setInput("");
    setTyping(true);

    try {
      // Swap the optimistic message for the stored one so ids match the backend.
      const { userMessage: saved, assistantMessage } = await sendChatMessage(chapterId, content);
      setMessages([...messages, saved, assistantMessage]);
    } catch {
      setMessages(messages);
      toast.error("AI មិនអាចឆ្លើយបានទេ។ សូមពិនិត្យការតភ្ជាប់ ហើយព្យាយាមម្ដងទៀត។");
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="ui-card flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center gap-3 bg-primary-dark px-4 py-3 text-white">
        <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary">
          <Mascot size={32} onDark />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">ReanMate</p>
          <p className="flex items-center gap-1.5 text-[11px] text-white/55">
            <span className="online-dot" />
            មិត្ត AI · ភាសាខ្មែរ
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-[#f7fafa] p-4"
      >
        <AssistantBubble content={WELCOME} />
        {messages.map((message) =>
          message.role === "user" ? (
            <div
              key={message.id}
              className="msg-in ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm text-white"
            >
              {message.content}
            </div>
          ) : (
            <AssistantBubble key={message.id} content={message.content} />
          ),
        )}
        {typing ? (
          <div className="msg-in max-w-[85%] rounded-2xl bg-white px-3.5 py-3 text-sm text-ink-muted shadow-sm ring-1 ring-black/[0.04]">
            <span className="typing-dots" aria-label="កំពុងសរសេរ">
              <span />
              <span />
              <span />
            </span>
          </div>
        ) : null}

        {showSuggestions ? (
          <div className="mt-1 flex flex-wrap gap-2">
            {suggestions.map((item, i) => (
              <button
                key={item}
                type="button"
                onClick={() => send(item)}
                style={{ animationDelay: `${0.08 * i}s` }}
                className="chip-in min-h-10 cursor-pointer rounded-full border border-line bg-white px-3 py-2 text-left text-xs text-primary transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-white"
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <p className="border-t border-line bg-surface px-3 pt-2 text-center text-[11px] text-ink-muted">
        ReanMate អាចមានកំហុស។ សូមពិនិត្យជាមួយវីដេអូ MoEYS និងសៀវភៅសិក្សា។
      </p>
      <div
        className="flex gap-2 bg-surface p-3"
        style={{ paddingBottom: `max(0.75rem, ${keyboardInset}px)` }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="សរសេរសំណួរ…"
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="off"
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-line px-3 py-2.5 text-base focus:border-primary focus:outline-none"
        />
              <button
                type="button"
                onClick={() => {
                  if (!input.trim()) {
                    inputRef.current?.focus();
                    toast.info("សូមសរសេរសំណួរជាមុនសិន។");
                    return;
                  }
                  send();
                }}
                className={`ui-btn min-h-11 rounded-xl bg-cta px-4 py-2 text-sm font-semibold text-white hover:bg-cta-dark ${
                  typing || !input.trim() ? "opacity-50" : ""
                }`}
              >
          ផ្ញើ
        </button>
      </div>
    </div>
  );
}

function AssistantBubble({ content }: { content: string }) {
  return (
    <div className="msg-in max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm ring-1 ring-black/[0.04]">
      <p className="whitespace-pre-line">{content}</p>
      <div className="mt-2">
        <ListenButton text={content} />
      </div>
    </div>
  );
}
