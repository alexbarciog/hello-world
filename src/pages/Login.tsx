import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import gojiIcon from "@/assets/gojiberry-icon.png";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      // Check onboarding status
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("user_id", authData.user.id)
        .maybeSingle();
      if (profile?.onboarding_complete) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result?.error) {
      toast.error("Google sign-in failed. Please try again.");
    }
    setGoogleLoading(false);
  };

  const inputCls = "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[hsl(var(--goji-coral))] focus:ring-[hsl(var(--goji-coral))] bg-white";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left – form */}
      <div className="w-[45%] relative flex flex-col bg-white">
        {/* Top-right switch link */}
        <div className="absolute top-5 right-6 text-sm text-gray-500">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold hover:underline" style={{ color: "hsl(var(--goji-coral))" }}>
            Sign up here
          </Link>
        </div>

        {/* Centered form */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-full max-w-sm">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <img src={gojiIcon} alt="Gojiberry" className="w-8 h-8 object-contain" />
              <span className="text-2xl font-bold text-gray-900 tracking-tight">gojiberry</span>
            </div>
            <p className="text-sm text-gray-500 text-center mb-7">Sign in to your account</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 accent-[hsl(var(--goji-coral))]"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium hover:underline"
                  style={{ color: "hsl(var(--goji-coral))" }}
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "hsl(5 80% 50%)" }}
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400">Or continue with</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            {/* Social buttons */}
            <div className="space-y-3">
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-md py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {googleLoading ? "Connecting..." : "Continue with Google"}
              </button>

              <button
                className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-md py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors opacity-60 cursor-not-allowed"
                title="Coming soon"
                disabled
              >
                <svg viewBox="0 0 24 24" fill="#0A66C2" className="w-4 h-4">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                Continue with LinkedIn
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right – testimonial panel */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        style={{
          background: "radial-gradient(ellipse 100% 100% at 60% 50%, hsl(5 85% 88%) 0%, hsl(20 80% 92%) 40%, hsl(30 70% 95%) 70%, hsl(0 0% 100%) 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-20" style={{ background: "hsl(5 85% 75%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-1/3 right-1/3 w-48 h-48 rounded-full opacity-15" style={{ background: "hsl(20 80% 70%)", filter: "blur(60px)" }} />

        {/* Testimonial card */}
        <div className="relative bg-white rounded-2xl shadow-xl p-7 max-w-xs w-full mx-8">
          {/* Quote icon */}
          <div className="text-5xl font-serif leading-none mb-4" style={{ color: "hsl(var(--goji-coral) / 0.3)" }}>"</div>

          {/* Avatar + name */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white text-sm font-bold shrink-0">
              SB
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Stuart Brent</p>
              <p className="text-xs text-gray-500">Founder @ SaasyDB (B2B SaaS)</p>
            </div>
          </div>

          {/* Quote */}
          <p className="text-sm text-gray-700 leading-relaxed italic mb-4">
            "We made our money back 6× already, and our week is now fully booked with leads GojiberryAI found for us."
          </p>

          {/* Stars */}
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} viewBox="0 0 24 24" fill="hsl(45 93% 57%)" className="w-4 h-4">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
