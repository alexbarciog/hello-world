import { useState, useEffect } from "react";
import { Radar, Target, Zap } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { ttqCompleteRegistration } from "@/lib/tiktok-pixel";
import intentslyIcon from "@/assets/intentsly-icon.png";
import intentslyLogo from "@/assets/intentsly-logo.png";
import registerBg from "@/assets/hero-bg-2.avif";

interface InviteData {
  email: string;
  inviter_name: string | null;
  organization_name: string | null;
  expires_at: string;
  accepted_at: string | null;
}



const passwordRules = [
{ label: "8+ characters", test: (p: string) => p.length >= 8 },
{ label: "1 uppercase and 1 lowercase letter", test: (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p) },
{ label: "1 number", test: (p: string) => /\d/.test(p) }];


export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");

  // Step state
  const [step, setStep] = useState(1);

  // Step 1
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);
  const [inviteError, setInviteError] = useState<string | null>(null);


  useEffect(() => {
    if (!inviteToken) return;
    async function loadInvite() {
      setInviteLoading(true);
      const { data, error } = await supabase.
      from("invitations").
      select("email, inviter_name, organization_name, expires_at, accepted_at").
      eq("token", inviteToken).
      maybeSingle();
      if (error || !data) {
        setInviteError("This invitation link is invalid or has expired.");
      } else if (data.accepted_at) {
        setInviteError("This invitation has already been used.");
      } else if (new Date(data.expires_at) < new Date()) {
        setInviteError("This invitation has expired. Please ask for a new one.");
      } else {
        setInviteData(data as InviteData);
        setEmail(data.email);
      }
      setInviteLoading(false);
    }
    loadInvite();
  }, [inviteToken]);

  const allRulesPassed = passwordRules.every((r) => r.test(password));

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!allRulesPassed) {
      toast.error("Password doesn't meet requirements");
      return;
    }
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName) {
      toast.error("Please enter your first name");
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
        emailRedirectTo: window.location.origin + "/dashboard"
      }
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (inviteToken && inviteData) {
      await supabase.
      from("invitations").
      update({ accepted_at: new Date().toISOString() }).
      eq("token", inviteToken);
    }

    setLoading(false);
    ttqCompleteRegistration();
    toast.success("Account created! Let's set up your first campaign.");
    navigate("/onboarding");
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
    <div className="flex h-screen overflow-hidden">
      {/* LEFT — form */}
      <div className="w-full md:w-[55%] flex flex-col bg-background">
        {/* Logo */}
        <div className="px-8 py-5">
          <Link to="/" className="flex items-center gap-2">
            <img src={intentslyIcon} alt="Intentsly" className="w-7 h-7 object-contain" />
            
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-10">
          <div className="w-full max-w-sm">
            {/* Step progress */}
            <div className="flex flex-col items-center mb-8">
              <p className="text-sm text-muted-foreground mb-2">Step {step} of 2</p>
              <div className="flex gap-1 w-48">
                <div className="h-0.5 flex-1 rounded-full bg-foreground transition-all duration-300" />
                <div className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${step === 2 ? "bg-foreground" : "bg-border"}`} />
              </div>
            </div>

            {step === 1 ?
            <>
                <h1 className="text-3xl font-normal text-foreground tracking-tight mb-6 text-center">
                  Create your account
                </h1>

                {/* Invite banners */}
                {inviteLoading &&
              <div className="mb-5 flex items-center justify-center gap-2 bg-muted border border-border rounded-lg p-3">
                    <svg className="w-4 h-4 animate-spin text-muted-foreground" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm text-muted-foreground">Loading your invitation...</span>
                  </div>
              }
                {inviteError &&
              <div className="mb-5 bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                    ⚠️ {inviteError}
                  </div>
              }
                {inviteData && !inviteError &&
              <div className="mb-5 rounded-lg p-3.5 bg-muted border border-border">
                    <p className="text-sm font-semibold text-foreground">
                      {inviteData.inviter_name || "A teammate"} invited you
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Join <strong>{inviteData.organization_name || "the team"}</strong> on Intentsly
                    </p>
                  </div>
              }

                <form onSubmit={handleStep1} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                    <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${inputCls} ${inviteData ? "opacity-60" : ""}`}
                    readOnly={!!inviteData}
                    required />
                  
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                    <div className="relative">
                      <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputCls} pr-11 [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden`}
                      autoComplete="new-password"
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

                    {/* Password rules */}
                    {password.length > 0 &&
                  <div className="mt-2.5 space-y-1.5">
                        <p className="text-xs text-muted-foreground">Your password must contain:</p>
                        {passwordRules.map((rule) => {
                      const passed = rule.test(password);
                      return (
                        <div key={rule.label} className="flex items-center gap-2">
                              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 shrink-0">
                                <circle cx="12" cy="12" r="10" stroke={passed ? "hsl(142 70% 45%)" : "hsl(var(--muted-foreground))"} strokeWidth="2" />
                                {passed && <polyline points="9 12 11 14 15 10" stroke="hsl(142 70% 45%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                              </svg>
                              <span className={`text-xs ${passed ? "text-foreground" : "text-muted-foreground"}`}>{rule.label}</span>
                            </div>);

                    })}
                      </div>
                  }
                  </div>

                  <button
                  type="submit"
                  disabled={!!inviteError}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-60 mt-2 ${
                  email && allRulesPassed ?
                  "bg-foreground text-background hover:opacity-90" :
                  "bg-muted text-muted-foreground"}`
                  }>
                  
                    Continue
                  </button>
                </form>

                <p className="text-center text-xs text-muted-foreground mt-3 font-medium">
                  ✨ No credit card required
                </p>

                {/* Divider */}
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-xs text-muted-foreground">Or</span>
                  <div className="flex-1 border-t border-border" />
                </div>

                {/* Google */}
                

                <p className="text-center text-sm text-muted-foreground mt-3">
                  Already have an account?{" "}
                  <Link to="/login" className="font-medium text-foreground hover:underline">
                    Log in
                  </Link>
                </p>
                <p className="text-center text-xs text-muted-foreground mt-3">
                  By creating an account, you agree to our{" "}
                  <Link to="/terms" className="underline hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>{" "}and{" "}
                  <Link to="/privacy" className="underline hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </p>
              </> :

            <>
                <h1 className="text-3xl font-normal text-foreground tracking-tight mb-6 text-center">
                  One last step
                </h1>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">First name</label>
                      <input
                      type="text"
                      placeholder="Enter your first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={inputCls}
                      required />
                    
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Last name</label>
                      <input
                      type="text"
                      placeholder="Enter your last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={inputCls} />
                    
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Company <span className="text-muted-foreground font-normal">(Optional)</span>
                    </label>
                    <input
                    type="text"
                    placeholder="Enter your company name"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className={inputCls} />
                  
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-2.5 px-1">
                    
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                      </svg>
                      Previous
                    </button>
                    <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-60 ${
                    firstName ?
                    "bg-foreground text-background hover:opacity-90" :
                    "bg-muted text-muted-foreground"}`
                    }>
                    
                      {loading ?
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg> :
                    null}
                      {loading ? "Creating account..." : inviteData ? "Accept & Create Account" : "Create my account"}
                    </button>
                  </div>
                </form>

                <p className="text-center text-xs text-muted-foreground mt-3 font-medium">
                  ✨ No credit card required
                </p>

                <p className="text-center text-sm text-muted-foreground mt-3">
                  Already have an account?{" "}
                  <Link to="/login" className="font-medium text-foreground hover:underline">
                    Log in
                  </Link>
                </p>
              </>
            }

            {/* Terms */}
            




            
          </div>
        </div>
      </div>

      {/* RIGHT — gradient + testimonials */}
      <div
        className="hidden md:flex flex-1 m-5 rounded-[30px] flex-col items-center justify-center relative overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `url(${registerBg})`
        }}>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-start px-12 max-w-md w-full">
          <h2 className="text-3xl font-semibold text-white tracking-tight mb-2">
            Find buyers before your competitors do
          </h2>
          <p className="text-sm text-white/60 mb-10">
            Intent-driven prospecting that fills your pipeline on autopilot.
          </p>

          <div className="space-y-6 w-full">
            {[
              {
                icon: Radar,
                title: "Detect Intent Signals",
                desc: "Our AI monitors Reddit, X, and LinkedIn to find people actively looking for your services."
              },
              {
                icon: Target,
                title: "Score & Qualify Leads",
                desc: "Every prospect is scored against your ICP so you only talk to the right people."
              },
              {
                icon: Zap,
                title: "Automate Outreach",
                desc: "Start relevant conversations on LinkedIn automatically and book more demos on autopilot."
              }
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
    </div>);

}