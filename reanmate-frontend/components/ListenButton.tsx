"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { synthesizeSpeech } from "@/lib/api";

// Audio already fetched this page load, keyed by text, so replays are free.
const audioUrls = new Map<string, string>();

/**
 * Reads text aloud. Plays server-generated audio (Gemini TTS) first;
 * if that fails, falls back to the browser's speechSynthesis — but only when
 * the device has a voice for the language, otherwise we say audio is unavailable.
 */
export default function ListenButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const cancelledRef = useRef(false);
  const toast = useToast();

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      audioRef.current?.pause();
      if (utteranceRef.current) window.speechSynthesis?.cancel();
    };
  }, []);

  const markUnavailable = () => {
    setSpeaking(false);
    setUnavailable(true);
    toast.info("សំឡេងមិនអាចប្រើបាននៅលើឧបករណ៍នេះ។");
  };

  const speakWithBrowser = () => {
    if (!("speechSynthesis" in window)) return markUnavailable();

    const isKhmer = /[ក-៿]/u.test(text);
    const selectedVoice = window.speechSynthesis.getVoices().find((voice) => {
      const voiceLanguage = voice.lang.toLowerCase();
      return isKhmer
        ? voiceLanguage === "km-kh" || voiceLanguage.startsWith("km-") || voiceLanguage === "khm"
        : voiceLanguage.startsWith("en-");
    });
    // Without a Khmer voice, browsers read Khmer silently or as gibberish.
    if (isKhmer && !selectedVoice) return markUnavailable();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isKhmer ? "km-KH" : "en-US";
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = (event) => {
      if (event.error === "interrupted" || event.error === "canceled") return setSpeaking(false);
      markUnavailable();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const stop = () => {
    audioRef.current?.pause();
    if (utteranceRef.current) window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  const toggle = async () => {
    if (speaking) return stop();
    if (loading) return;

    setLoading(true);
    try {
      let url = audioUrls.get(text);
      if (!url) {
        url = URL.createObjectURL(await synthesizeSpeech(text));
        audioUrls.set(text, url);
      }
      if (cancelledRef.current) return;

      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.src = url;
      audio.onended = () => setSpeaking(false);
      audio.onpause = () => setSpeaking(false);
      await audio.play();
      setSpeaking(true);
    } catch {
      if (!cancelledRef.current) speakWithBrowser();
    } finally {
      setLoading(false);
    }
  };

  if (unavailable) {
    return (
      <span className="shrink-0 text-xs text-ink-muted">មិនមានសំឡេង</span>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-busy={loading}
      className={`inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition disabled:cursor-wait disabled:opacity-70 ${
        speaking
          ? "speak-on bg-primary text-white"
          : "text-primary hover:bg-primary hover:text-white"
      }`}
    >
      {speaking ? "◼ បញ្ឈប់" : loading ? "… កំពុងផ្ទុក" : "🔊 ស្តាប់"}
    </button>
  );
}
