"use client";

import { useState, type FormEvent } from "react";
import AulaDecor from "./AulaDecor";
import { Disc } from "./icons";

type Props = {
  title: string;
  onSuccess: (admin: boolean) => void;
};

export default function AulaLogin({ title, onSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; admin?: boolean } | null;
      if (!res.ok) {
        setError(data?.error ?? "No se pudo entrar");
        return;
      }
      onSuccess(Boolean(data?.admin));
    } catch {
      setError("No se pudo entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center px-4">
      <AulaDecor floating />
      <form
        onSubmit={(e) => void submit(e)}
        className="glass-strong relative w-full max-w-sm rounded-3xl p-6 shadow-2xl"
      >
        <div className="vinyl mb-4 grid h-14 w-14 place-items-center rounded-full">
          <Disc className="h-7 w-7 text-[#f3e0b0]" />
        </div>
        <h1 className="font-display text-4xl text-[#f6efe6]">{title}</h1>
        <p className="mt-1 font-display text-sm italic text-[#f3e0b0]/75">
          Entra con el usuario que te hayan dado.
        </p>

        <label className="mt-5 block text-xs text-white/50" htmlFor="aula-user">
          Usuario
        </label>
        <input
          id="aula-user"
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-base text-white outline-none transition focus:border-violet-400/60 focus:bg-white/10 sm:text-sm"
        />

        <label className="mt-3 block text-xs text-white/50" htmlFor="aula-pass">
          Contraseña
        </label>
        <input
          id="aula-pass"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-base text-white outline-none transition focus:border-violet-400/60 focus:bg-white/10 sm:text-sm"
        />

        {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}

        <button
          type="submit"
          disabled={loading || username.trim().length === 0 || password.length === 0}
          className="aula-cta mt-5 w-full rounded-full px-4 py-2 text-sm font-semibold transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
