"use client";

import { useEffect, useState, type FormEvent } from "react";

export default function ClassAccessPanel() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/class-access", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { username?: string }) => {
        if (data.username) setUsername(data.username);
      })
      .catch(() => undefined);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (password !== repeat) {
      setError("Las dos contraseñas no coinciden");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/class-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "No se pudo cambiar");
        return;
      }
      setPassword("");
      setRepeat("");
      setMessage(data?.message ?? "Contraseña cambiada.");
    } catch {
      setError("No se pudo cambiar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-sm text-white/85">Contraseña de la clase</p>
      <p className="mt-1 text-xs text-white/45">
        Usuario <span className="text-white/70">{username || "…"}</span>. Al cambiarla, tienen que volver a entrar.
      </p>
      <input
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Nueva contraseña"
        className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-base text-white outline-none focus:border-amber-200/40 sm:text-sm"
      />
      <input
        type="password"
        autoComplete="new-password"
        value={repeat}
        onChange={(e) => setRepeat(e.target.value)}
        placeholder="Repetir contraseña"
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-base text-white outline-none focus:border-amber-200/40 sm:text-sm"
      />
      {error ? <p className="mt-2 text-xs text-red-200">{error}</p> : null}
      {message ? <p className="mt-2 text-xs text-emerald-200">{message}</p> : null}
      <button
        type="submit"
        disabled={busy || password.length === 0 || repeat.length === 0}
        className="aula-cta mt-3 rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-40"
      >
        {busy ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
