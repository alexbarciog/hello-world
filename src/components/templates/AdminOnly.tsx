import { Loader2 } from "lucide-react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import NotFound from "@/pages/NotFound";

/** Renders the 404 page for anyone who isn't a platform admin. */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { data: isAdmin, isLoading } = useAdminCheck();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return isAdmin ? <>{children}</> : <NotFound />;
}
