import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Captures ?ref=CODE from the URL and stores it in localStorage.
 * Used at signup to attribute referrals.
 */
export function RefCodeCapture() {
  const [params] = useSearchParams();
  useEffect(() => {
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("intentsly_ref_code", ref);
    }
  }, [params]);
  return null;
}
