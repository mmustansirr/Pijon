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
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <section className="flex w-full max-w-lg flex-col items-center gap-6 rounded-3xl bg-white p-10 text-center shadow-lg">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          PIJON
        </h1>
        <p className="text-base text-zinc-500">
          Control your feeder from anywhere.
        </p>
        <p className="text-sm font-medium text-zinc-700">
          Status: {status === "ONLINE" ? "🟢 ONLINE" : "🔴 OFFLINE"}
        </p>
        {errorMessage ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        ) : null}
        <div className="w-full">
          <label className="mb-2 block text-sm font-medium text-zinc-600">
            Feed amount
          </label>
          <select
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm focus:border-zinc-400 focus:outline-none"
            value={amount}
            onChange={(event) => setAmount(event.target.value as "SMALL" | "MEDIUM" | "LARGE")}
          >
            <option value="SMALL">Small</option>
            <option value="MEDIUM">Medium</option>
            <option value="LARGE">Large</option>
          </select>
        </div>
        <button
          className="rounded-full bg-zinc-900 px-8 py-4 text-lg font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleFeed}
          disabled={locked || status === "OFFLINE"}
        >
          {status === "OFFLINE" ? "DEVICE OFFLINE" : locked ? "FEEDING..." : "FEED NOW"}
        </button>
      </section>
    </main>
  );
}
