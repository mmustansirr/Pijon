"use client";

import { useEffect, useRef, useState } from "react";
import { connectMQTT, onAck, onStatusUpdate, publishFeed } from "../lib/mqttClient";

export default function Home() {
  const [locked, setLocked] = useState(false);
  const [amount, setAmount] = useState<"SMALL" | "MEDIUM" | "LARGE">("SMALL");
  const [scheduleAmount, setScheduleAmount] = useState<"SMALL" | "MEDIUM" | "LARGE">("SMALL");
  const [scheduleTime, setScheduleTime] = useState("07:30");
  const [schedules, setSchedules] = useState<
    { id: string; time: string; amount: "SMALL" | "MEDIUM" | "LARGE" }[]
  >([]);
  const [status, setStatus] = useState<"CONNECTING" | "ONLINE" | "OFFLINE">("CONNECTING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const offlineTimerRef = useRef<number | null>(null);
  const scheduleTimersRef = useRef<Record<string, number>>({});

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

    const connectTimer = window.setTimeout(() => {
      setStatus((current) => (current === "ONLINE" ? current : "OFFLINE"));
    }, 10000);

    return () => {
      if (offlineTimerRef.current) {
        window.clearTimeout(offlineTimerRef.current);
      }
      window.clearTimeout(connectTimer);
    };
  }, []);

  const handleFeed = () => {
    if (locked || status === "OFFLINE") return;

    publishFeed(`FEED:${amount}`);
    setLocked(true);
    setErrorMessage(null);
  };

  const handleAddSchedule = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const [hours, minutes] = scheduleTime.split(":");
    const now = new Date();
    const scheduled = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      Number(hours),
      Number(minutes)
    );

    if (scheduled.getTime() <= now.getTime()) {
      scheduled.setDate(scheduled.getDate() + 1);
    }

    const delayMs = scheduled.getTime() - now.getTime();
    const id = crypto.randomUUID();

    const timeoutId = window.setTimeout(() => {
      publishFeed(`FEED:${scheduleAmount}`);
      setSchedules((prev) => prev.filter((schedule) => schedule.id !== id));
      delete scheduleTimersRef.current[id];
    }, delayMs);

    scheduleTimersRef.current[id] = timeoutId;

    setSchedules((prev) => [
      ...prev,
      {
        id,
        time: scheduleTime,
        amount: scheduleAmount,
      },
    ]);
  };

  const handleRemoveSchedule = (id: string) => {
    const timerId = scheduleTimersRef.current[id];
    if (timerId) {
      window.clearTimeout(timerId);
      delete scheduleTimersRef.current[id];
    }
    setSchedules((prev) => prev.filter((schedule) => schedule.id !== id));
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
                    : status === "CONNECTING"
                      ? "bg-amber-400/20 text-amber-200"
                      : "bg-rose-400/15 text-rose-200"
                }`}
              >
                {status === "ONLINE"
                  ? "🟢 Online"
                  : status === "CONNECTING"
                    ? "🟡Connecting"
                    : "🔴Offline"}
              </span>
              <span>
                {status === "ONLINE"
                  ? "Heartbeat active"
                  : status === "CONNECTING"
                    ? "Searching for signal"
                    : "Waiting for device"}
              </span>
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
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/70">Quick feed</p>
            <span className="text-xs text-white/50">Manual control</span>
          </div>
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
          <button
            className="mt-5 w-full rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-zinc-900 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/50"
            onClick={handleFeed}
            disabled={locked || status === "OFFLINE"}
          >
            {status === "OFFLINE" ? "DEVICE OFFLINE" : locked ? "FEEDING..." : "FEED NOW"}
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/70">Schedule feed</p>
            <span className="text-xs text-white/50">Local device</span>
          </div>
          <form onSubmit={handleAddSchedule} className="mt-4 grid gap-4">
            <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Time
                </label>
                <input
                  type="time"
                  className="mt-2 w-full bg-transparent text-base font-semibold text-white outline-none"
                  value={scheduleTime}
                  onChange={(event) => setScheduleTime(event.target.value)}
                />
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Amount
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(["SMALL", "MEDIUM", "LARGE"] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setScheduleAmount(size)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        scheduleAmount === size
                          ? "border-white/40 bg-white text-zinc-900"
                          : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Add schedule
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {schedules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 px-4 py-4 text-sm text-white/50">
                No schedules yet. Add your first feeding time above.
              </div>
            ) : (
              schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {schedule.time}
                    </p>
                    <p className="text-xs text-white/60">{schedule.amount} portion</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSchedule(schedule.id)}
                    className="text-xs font-semibold text-rose-200 transition hover:text-rose-100"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
