import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import intentslyIcon from "@/assets/intentsly-icon.png";
import intentslyLogo from "@/assets/intentsly-logo.png";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      const { data: profile } = await supabase.
      from("profiles").
      select("onboarding_complete").
      eq("user_id", authData.user.id).
      maybeSingle();
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
      redirect_uri: window.location.origin + "/dashboard"
    });
    if (result?.error) {
      toast.error("Google sign-in failed. Please try again.");
    }
    setGoogleLoading(false);
  };

  const inputCls =
  "w-full border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring bg-background transition-colors";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top-left logo */}
      <div className="px-8 py-5">
        <Link to="/" className="flex items-center gap-2">
          <img src={intentslyIcon} alt="Intentsly" className="w-7 h-7 object-contain" />
          
        </Link>
      </div>

      {/* Centered form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-normal text-foreground tracking-tight mb-2">Log in</h1>
            <p className="text-sm text-muted-foreground">Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                required />
              
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                  
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} pr-11`}
                  required />
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  
                  {showPassword ?
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg> :

                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  }
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-60 mt-2 ${
              password ?
              "bg-foreground text-background hover:opacity-90" :
              "bg-muted text-muted-foreground"}`
              }>
              {loading ?
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg> :
              null}
              {loading ? "Signing in..." : "Log in"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">Or</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Google */}
          











          

          {/* Sign up link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-foreground hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>);

}