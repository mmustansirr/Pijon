"use client";

import { useEffect, useRef, useState } from "react";
import { connectMQTT, onAck, onStatusUpdate, publishFeed } from "../lib/mqttClient";

export default function Home() {
  const [locked, setLocked] = useState(false);
  const [amount, setAmount] = useState<"SMALL" | "MEDIUM" | "LARGE">("SMALL");
  const [status, setStatus] = useState<"ONLINE" | "OFFLINE">("OFFLINE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const offlineTimerRef = useRef<number | null>(null);

  useEffect(() => {
    connectMQTT();
    onAck((message: string) => {
      if (message === "FED") {
        setLocked(false);
        setErrorMessage(null);
        return;
      }

      if (message.startsWith("ERROR")) {
        setLocked(false);
        setErrorMessage(`Feeding failed: ${message}`);
      }
    });
    onStatusUpdate(() => {
      setStatus("ONLINE");
      setErrorMessage(null);
      if (offlineTimerRef.current) {
        window.clearTimeout(offlineTimerRef.current);
      }
      offlineTimerRef.current = window.setTimeout(() => {
        setStatus("OFFLINE");
      }, 10000);
    });

    return () => {
      if (offlineTimerRef.current) {
        window.clearTimeout(offlineTimerRef.current);
      }
    };
  }, []);

  const handleFeed = () => {
    if (locked || status === "OFFLINE") return;

    publishFeed(`FEED:${amount}`);
    setLocked(true);
    setErrorMessage(null);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 px-5 pb-14 pt-6 text-white sm:px-8 sm:pt-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_45%)]" />
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-blue-400/20 blur-[120px]" />

      <section className="relative mx-auto flex w-full max-w-2xl flex-col gap-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur sm:p-10">
        <header className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Pijon
              </p>
              <p className="text-lg font-semibold text-white">Feeder Control</p>
            </div>
            <div className="flex flex-col items-end gap-1 text-xs text-white/70">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  status === "ONLINE"
                    ? "bg-emerald-400/15 text-emerald-200"
                    : "bg-rose-400/15 text-rose-200"
                }`}
              >
                {status === "ONLINE" ? "🟢 Online" : "🔴 Offline"}
              </span>
              <span>{status === "ONLINE" ? "Heartbeat active" : "Waiting for device"}</span>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Feed with confidence
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Choose a portion size, then fire the motor. The button unlocks only
              after the device confirms.
            </p>
          </div>
        </header>

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {errorMessage}
          </div>
        ) : null}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm font-medium text-white/70">Feed amount</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {(["SMALL", "MEDIUM", "LARGE"] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setAmount(size)}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  amount === size
                    ? "border-white/40 bg-white text-zinc-900"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <button
          className="rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-zinc-900 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/50"
          onClick={handleFeed}
          disabled={locked || status === "OFFLINE"}
        >
          {status === "OFFLINE" ? "DEVICE OFFLINE" : locked ? "FEEDING..." : "FEED NOW"}
        </button>
      </section>
    </main>
  );
}
