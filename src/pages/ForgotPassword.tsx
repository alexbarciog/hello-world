import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import gojiIcon from "@/assets/gojiberry-icon.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-[45%] relative flex flex-col bg-white">
        <div className="absolute top-5 right-6 text-sm text-gray-500">
          <Link to="/login" className="font-semibold hover:underline" style={{ color: "hsl(var(--goji-coral))" }}>
            Back to Sign in
          </Link>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-full max-w-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img src={gojiIcon} alt="Gojiberry" className="w-8 h-8 object-contain" />
              <span className="text-2xl font-bold text-gray-900 tracking-tight">gojiberry</span>
            </div>
            <p className="text-sm text-gray-500 text-center mb-7">Reset your password</p>

            {sent ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                  <svg viewBox="0 0 24 24" fill="none" stroke="hsl(142 70% 45%)" strokeWidth="2" className="w-7 h-7">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-800">Check your email</p>
                <p className="text-xs text-gray-500">We sent a reset link to <strong>{email}</strong></p>
                <Link to="/login" className="block text-sm font-semibold hover:underline" style={{ color: "hsl(var(--goji-coral))" }}>
                  Back to Sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[hsl(var(--goji-coral))] focus:ring-[hsl(var(--goji-coral))] bg-white"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: "hsl(5 80% 50%)" }}
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <div
        className="flex-1"
        style={{
          background: "radial-gradient(ellipse 100% 100% at 60% 50%, hsl(5 85% 88%) 0%, hsl(20 80% 92%) 40%, hsl(30 70% 95%) 70%, hsl(0 0% 100%) 100%)",
        }}
      />
    </div>
  );
}
