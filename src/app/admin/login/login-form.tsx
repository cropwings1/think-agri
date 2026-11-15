"use client";
import { FormEvent, useState } from "react";
import {
  Leaf,
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      console.log(response, "data");
      if (!response.ok)
        throw new Error(
          data.error?.message || data.error || "Unable to sign in."
        );
      window.location.assign("/admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
      setBusy(false);
    }
  }
  return (
    <main className="login-screen">
      <div className="login-glow login-glow-a" />
      <div className="login-glow login-glow-b" />
      <section className="login-card">
        <div className="login-brand">
          <span>
            <Leaf size={28} />
          </span>
          <div>
            <b>Think Agri</b>
            <small>Administration portal</small>
          </div>
        </div>
        <div className="login-heading">
          <div className="login-lock">
            <LockKeyhole size={22} />
          </div>
          <p className="eyebrow">SECURE ACCESS</p>
          <h1>Welcome back</h1>
          <p>Sign in to manage farmer registrations and communities.</p>
        </div>
        <form onSubmit={submit} className="login-form">
          <label>
            Email address
            <div className="login-input">
              <Mail size={17} />
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
          </label>
          <label>
            Password
            <div className="login-input">
              <LockKeyhole size={17} />
              <input
                type={show ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}
          <button className="login-submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in to dashboard"}
          </button>
        </form>
        <div className="login-secure">
          <ShieldCheck size={15} /> Protected administrator access
        </div>
      </section>
      <p className="login-footer">Think Agri · Admin</p>
    </main>
  );
}
