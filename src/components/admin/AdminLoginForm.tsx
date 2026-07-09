"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FiLock, FiLogIn } from "react-icons/fi";

export default function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;

        throw new Error(data?.error || "Login gagal.");
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login gagal.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-md rounded-[1.75rem] border border-light-border/70 bg-white/75 p-6 shadow-2xl shadow-black/10 backdrop-blur-2xl dark:border-white/10 dark:bg-black/35"
    >
      <div className="mb-7 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary">
          <FiLock className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-light-primary dark:text-text-dark-primary">Admin Login</h1>
          <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">Muhammad Nur Ramadhan</p>
        </div>
      </div>

      <label className="mb-2 block text-sm font-bold text-text-light-primary dark:text-text-dark-primary" htmlFor="admin-password">
        Password
      </label>
      <input
        id="admin-password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
        placeholder="Password admin"
        className="h-12 w-full rounded-2xl border border-light-border/70 bg-white/80 px-4 text-sm font-medium text-text-light-primary outline-none transition-colors placeholder:text-text-light-muted focus:border-accent-primary dark:border-white/10 dark:bg-white/5 dark:text-text-dark-primary"
      />

      {error && (
        <p className="mt-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !password.trim()}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent-primary to-accent-secondary px-5 text-sm font-black text-white shadow-xl shadow-accent-primary/25 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        <span>{isSubmitting ? "Memeriksa" : "Masuk Admin"}</span>
        <FiLogIn className="h-4 w-4" />
      </button>
    </form>
  );
}
