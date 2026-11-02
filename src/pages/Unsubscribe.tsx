import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/** /u/<token>: one click from an email. Marketing email stops; receipts don't. */
export default function Unsubscribe() {
  const { token } = useParams();
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const ran = useRef(false);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    if (!ran.current) {
      ran.current = true;
      supabase.functions.invoke("email-unsubscribe", { body: { token } }).then(({ error }) => setState(error ? "error" : "done"));
    }
    return () => meta.remove();
  }, [token]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6 text-center">
      <div className="max-w-md">
        {state === "working" && <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />}
        {state === "done" && (
          <>
            <Check className="w-8 h-8 mx-auto text-emerald-600" />
            <h1 className="mt-4 text-2xl font-medium tracking-tight">You're unsubscribed</h1>
            <p className="mt-2 text-neutral-600">No more marketing emails from Intentsly. If you have an account, you'll still get receipts and billing notices.</p>
          </>
        )}
        {state === "error" && (
          <>
            <h1 className="text-2xl font-medium tracking-tight">That link didn't work</h1>
            <p className="mt-2 text-neutral-600">Email <a className="underline" href="mailto:alex@intentsly.com">alex@intentsly.com</a> and we'll take you off the list.</p>
          </>
        )}
        <p className="mt-6 text-sm"><Link to="/" className="underline text-neutral-500">Back to intentsly.com</Link></p>
      </div>
    </main>
  );
}
