// Build-time only: scripts/prerender.mjs renders the public marketing routes
// to static HTML so crawlers that don't run JavaScript get real content.
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { AppProviders, AppContent } from "./App";

export { caseStudies } from "./data/caseStudies";

export function render(url: string) {
  return renderToString(
    <AppProviders>
      <StaticRouter location={url}>
        <AppContent />
      </StaticRouter>
    </AppProviders>,
  );
}
