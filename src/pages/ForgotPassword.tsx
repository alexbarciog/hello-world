import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radar, Target, Zap, Mail, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import intentslyIcon from "@/assets/intentsly-icon.png";
import registerBg from "@/assets/hero-bg-2.avif";

const SUPABASE_URL = "https://uwwajlezgeurnvvrvdvb.supabase.co";

type Step = "email" | "code" | "password" | "done";

const inputCls =
  "w-full border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring bg-background transition-colors";

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

  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setLoading(true);
    try {
      await callReset({ action: "send_code", email: trimmed });
      setStep("code");
      startCooldown();
      toast.success("If an account exists, a code has been sent.");
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

  const stepIndex = step === "email" ? 1 : step === "code" ? 2 : 3;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* LEFT — form */}
      <div className="w-full md:w-[55%] flex flex-col bg-background">
        {/* Logo */}
        <div className="px-8 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={intentslyIcon} alt="Intentsly" className="w-7 h-7 object-contain" />
          </Link>
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Back to Sign in
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-10">
          <div className="w-full max-w-sm">
            {/* Step progress */}
            {step !== "done" && (
              <div className="flex flex-col items-center mb-8">
                <p className="text-sm text-muted-foreground mb-2">Step {stepIndex} of 3</p>
                <div className="flex gap-1 w-48">
                  <div className="h-0.5 flex-1 rounded-full bg-foreground transition-all duration-300" />
                  <div className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${stepIndex >= 2 ? "bg-foreground" : "bg-border"}`} />
                  <div className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${stepIndex >= 3 ? "bg-foreground" : "bg-border"}`} />
                </div>
              </div>
            )}

            {/* ── STEP: email ── */}
            {step === "email" && (
              <>
                <h1 className="text-3xl font-normal text-foreground tracking-tight mb-2 text-center">
                  Reset your password
                </h1>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Enter your email and we'll send you a verification code.
                </p>

                <form onSubmit={handleSendCode} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
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
                    disabled={loading || !email}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-60 mt-2 ${
                      email ? "bg-foreground text-background hover:opacity-90" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending code...
                      </>
                    ) : "Send verification code"}
                  </button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Remember your password?{" "}
                  <Link to="/login" className="font-medium text-foreground hover:underline">
                    Log in
                  </Link>
                </p>
              </>
            )}

            {/* ── STEP: code ── */}
            {step === "code" && (
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Mail className="w-5 h-5 text-foreground" />
                  </div>
                  <h1 className="text-3xl font-normal text-foreground tracking-tight mb-2 text-center">
                    Check your inbox
                  </h1>
                  <p className="text-sm text-muted-foreground text-center">
                    We sent a 6-digit code to <span className="text-foreground font-medium">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3 text-center">
                      Enter verification code
                    </label>
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
                          className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 bg-background text-foreground transition-all focus:outline-none focus:border-foreground ${
                            d ? "border-foreground" : "border-border"
                          }`}
                          autoFocus={i === 0}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || digits.join("").length < 6}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-60 ${
                      digits.join("").length === 6 ? "bg-foreground text-background hover:opacity-90" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Verifying...
                      </>
                    ) : "Verify code"}
                  </button>
                </form>

                <div className="mt-4 flex items-center justify-center gap-4">
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                  <span className="text-xs text-border">•</span>
                  <button
                    onClick={() => { setStep("email"); setDigits(["", "", "", "", "", ""]); }}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
                  >
                    Change email
                  </button>
                </div>
              </>
            )}

            {/* ── STEP: password ── */}
            {step === "password" && (
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Lock className="w-5 h-5 text-foreground" />
                  </div>
                  <h1 className="text-3xl font-normal text-foreground tracking-tight mb-2 text-center">
                    Create new password
                  </h1>
                  <p className="text-sm text-muted-foreground text-center">
                    Choose a strong password for your account.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">New password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${inputCls} pr-11`}
                        autoComplete="new-password"
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Confirm password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className={inputCls}
                      autoComplete="new-password"
                      required
                    />
                    {confirm && password !== confirm && (
                      <p className="text-xs text-destructive mt-1.5">Passwords don't match</p>
                    )}
                  </div>

                  {/* Password strength */}
                  {password.length > 0 && (
                    <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => {
                        const strength = password.length >= 12 ? 4 : password.length >= 10 ? 3 : password.length >= 8 ? 2 : 1;
                        return (
                          <div
                            key={i}
                            className={`flex-1 h-1 rounded-full transition-all ${
                              i < strength
                                ? strength === 1 ? "bg-destructive" : strength === 2 ? "bg-amber-500" : strength === 3 ? "bg-yellow-500" : "bg-emerald-500"
                                : "bg-border"
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || password !== confirm || password.length < 8}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-60 mt-2 ${
                      password.length >= 8 && password === confirm ? "bg-foreground text-background hover:opacity-90" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Resetting...
                      </>
                    ) : "Reset password"}
                  </button>
                </form>
              </>
            )}

            {/* ── STEP: done ── */}
            {step === "done" && (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-normal text-foreground tracking-tight">
                  Password reset!
                </h1>
                <p className="text-sm text-muted-foreground">
                  Your password has been updated successfully. You can now sign in with your new password.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold bg-foreground text-background hover:opacity-90 transition-opacity mt-2"
                >
                  Go to Sign in
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT — gradient + features (matches Register) */}
      <div
        className="hidden md:flex flex-1 m-5 rounded-[30px] flex-col items-center justify-center relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${registerBg})` }}
      >
        <div className="relative z-10 flex flex-col items-start px-12 max-w-md w-full">
          <h2 className="text-4xl font-medium text-white tracking-tight mb-2">
            Welcome back to Intentsly
          </h2>
          <p className="text-sm text-white/60 mb-10">
            Get back to filling your pipeline on autopilot.
          </p>

          <div className="space-y-6 w-full">
            {[
              { icon: Radar, title: "Detect Intent Signals", desc: "Our AI monitors Reddit, X, and LinkedIn to find people actively looking for your services." },
              { icon: Target, title: "Score & Qualify Leads", desc: "Every prospect is scored against your ICP so you only talk to the right people." },
              { icon: Zap, title: "Automate Outreach", desc: "Start relevant conversations on LinkedIn automatically and book more demos on autopilot." }
            ].map((item) => (
              <div key={item.title} className="flex gap-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-white/40 mt-12">
            Trusted by 500+ B2B founders and sales teams
          </p>
        </div>
      </div>
    </div>
  );
}
