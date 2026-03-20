import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import intentslyIcon from "@/assets/intentsly-icon.png";

const SUPABASE_URL = "https://uwwajlezgeurnvvrvdvb.supabase.co";

type Step = "email" | "code" | "password" | "done";

const inputCls =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[hsl(var(--goji-coral))] focus:ring-[hsl(var(--goji-coral))] bg-white";

async function callReset(body: object) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);

  // Step 1
  const [email, setEmail] = useState("");

  // Step 2 – six digit boxes
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 3
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  function startCooldown() {
    setResendCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((v) => {
        if (v <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return v - 1;
      });
    }, 1000);
  }

  // ── Step 1: send code ────────────────────────────────────────────────────
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setLoading(true);
    try {
      await callReset({ action: "send_code", email: trimmed });
      setStep("code");
      startCooldown();
      toast.success("Code sent! Check your inbox.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await callReset({ action: "send_code", email: email.trim().toLowerCase() });
      setDigits(["", "", "", "", "", ""]);
      startCooldown();
      toast.success("New code sent!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: verify code ──────────────────────────────────────────────────
  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) { toast.error("Enter all 6 digits"); return; }
    setLoading(true);
    try {
      await callReset({ action: "verify_code", email: email.trim().toLowerCase(), code });
      setStep("password");
    } catch (err: any) {
      toast.error(err.message);
      setDigits(["", "", "", "", "", ""]);
      digitRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handleDigitChange(idx: number, val: string) {
    const char = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    if (char && idx < 5) digitRefs.current[idx + 1]?.focus();
  }

  function handleDigitKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      digitRefs.current[idx - 1]?.focus();
    }
  }

  function handleDigitPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      digitRefs.current[5]?.focus();
      e.preventDefault();
    }
  }

  // ── Step 3: reset password ───────────────────────────────────────────────
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    try {
      await callReset({
        action: "reset_password",
        email: email.trim().toLowerCase(),
        code: digits.join(""),
        password,
      });
      setStep("done");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left – form */}
      <div className="w-[45%] relative flex flex-col bg-white">
        <div className="absolute top-5 right-6 text-sm text-gray-500">
          <Link to="/login" className="font-semibold hover:underline" style={{ color: "hsl(var(--goji-coral))" }}>
            Back to Sign in
          </Link>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-full max-w-sm">

            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <img src={gojiIcon} alt="Intentsly" className="w-8 h-8 object-contain" />
              <span className="text-2xl font-bold text-gray-900 tracking-tight">intentsly</span>
            </div>

            {/* ── STEP: email ── */}
            {step === "email" && (
              <>
                <p className="text-sm text-gray-500 text-center mb-7">Reset your password</p>
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls}
                      required
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ background: "hsl(5 80% 50%)" }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                          <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending code...
                      </span>
                    ) : "Send verification code"}
                  </button>
                </form>
              </>
            )}

            {/* ── STEP: code ── */}
            {step === "code" && (
              <>
                <div className="text-center mb-7">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "hsl(5 85% 95%)" }}>
                    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" style={{ stroke: "hsl(var(--goji-coral))" }} strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Check your inbox</p>
                  <p className="text-xs text-gray-500 mt-1">We sent a 6-digit code to <strong>{email}</strong></p>
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-5">
                  {/* 6 digit boxes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Enter verification code</label>
                    <div className="flex gap-2 justify-center" onPaste={handleDigitPaste}>
                      {digits.map((d, i) => (
                        <input
                          key={i}
                          ref={(el) => { digitRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={d}
                          onChange={(e) => handleDigitChange(i, e.target.value)}
                          onKeyDown={(e) => handleDigitKeyDown(i, e)}
                          className="w-11 h-14 text-center text-xl font-bold border-2 rounded-xl transition-all focus:outline-none"
                          style={{
                            borderColor: d ? "hsl(var(--goji-coral))" : "hsl(220 15% 85%)",
                            color: "hsl(220 15% 15%)",
                            background: d ? "hsl(5 85% 97%)" : "white",
                          }}
                          autoFocus={i === 0}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || digits.join("").length < 6}
                    className="w-full py-2.5 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ background: "hsl(5 80% 50%)" }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                          <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Verifying...
                      </span>
                    ) : "Verify code"}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="text-xs text-gray-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't receive it? Resend code"}
                  </button>
                </div>

                <div className="mt-3 text-center">
                  <button onClick={() => setStep("email")} className="text-xs text-gray-400 hover:underline">
                    ← Change email
                  </button>
                </div>
              </>
            )}

            {/* ── STEP: password ── */}
            {step === "password" && (
              <>
                <div className="text-center mb-7">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "hsl(5 85% 95%)" }}>
                    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" style={{ stroke: "hsl(var(--goji-coral))" }} strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Create new password</p>
                  <p className="text-xs text-gray-500 mt-1">Choose a strong password for your account</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                    <input
                      type="password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputCls}
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                    <input
                      type="password"
                      placeholder="Repeat your password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className={inputCls}
                      required
                    />
                    {confirm && password !== confirm && (
                      <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                    )}
                  </div>

                  {/* Password strength hint */}
                  {password.length > 0 && (
                    <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => {
                        const strength = password.length >= 12 ? 4 : password.length >= 10 ? 3 : password.length >= 8 ? 2 : 1;
                        return (
                          <div
                            key={i}
                            className="flex-1 h-1 rounded-full transition-all"
                            style={{
                              background: i < strength
                                ? strength === 1 ? "hsl(0 80% 55%)" : strength === 2 ? "hsl(35 90% 50%)" : strength === 3 ? "hsl(55 90% 45%)" : "hsl(142 70% 45%)"
                                : "hsl(220 15% 90%)"
                            }}
                          />
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || password !== confirm || password.length < 8}
                    className="w-full py-2.5 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ background: "hsl(5 80% 50%)" }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                          <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Resetting...
                      </span>
                    ) : "Reset password"}
                  </button>
                </form>
              </>
            )}

            {/* ── STEP: done ── */}
            {step === "done" && (
              <div className="text-center space-y-4 mt-4">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                  <svg viewBox="0 0 24 24" fill="none" stroke="hsl(142 70% 45%)" strokeWidth="2.5" className="w-7 h-7">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-base font-bold text-gray-900">Password reset!</p>
                <p className="text-xs text-gray-500">Your password has been updated successfully. You can now sign in with your new password.</p>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-2.5 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-90 mt-2"
                  style={{ background: "hsl(5 80% 50%)" }}
                >
                  Go to Sign in
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Right – decorative */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        style={{
          background: "radial-gradient(ellipse 100% 100% at 60% 50%, hsl(5 85% 88%) 0%, hsl(20 80% 92%) 40%, hsl(30 70% 95%) 70%, hsl(0 0% 100%) 100%)",
        }}
      >
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-20" style={{ background: "hsl(5 85% 75%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-1/3 right-1/3 w-48 h-48 rounded-full opacity-15" style={{ background: "hsl(20 80% 70%)", filter: "blur(60px)" }} />

        {/* Floating card */}
        <div className="relative bg-white rounded-2xl shadow-xl p-7 max-w-xs w-full mx-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "hsl(5 85% 95%)" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" style={{ stroke: "hsl(var(--goji-coral))" }} strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Secure reset</p>
              <p className="text-xs text-gray-500">6-digit code · 15 min expiry</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Your verification code is sent directly to your email and expires in 15 minutes for your security.
          </p>
          <div className="mt-4 flex gap-2">
            {["🔒", "📧", "✅"].map((icon, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 bg-gray-50 rounded-lg p-2">
                <span className="text-lg">{icon}</span>
                <span className="text-[10px] text-gray-400 text-center">{["Secure", "Email", "Instant"][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
