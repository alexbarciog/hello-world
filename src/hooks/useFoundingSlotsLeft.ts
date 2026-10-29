import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Founding spots left (first 10 paying customers), or null until it's known. */
export function useFoundingSlotsLeft() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    supabase.rpc("founding_slots_remaining" as never).then(({ data, error }) => {
      if (!error && typeof data === "number") setLeft(data);
    });
  }, []);
  return left;
}
