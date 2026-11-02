// Client-side head tags for pages whose metadata is only known at runtime.
// Prerendered pages already carry the same tags in their static HTML; this
// keeps them correct after in-app navigation.
interface SeoInput {
  title: string;
  description: string;
  url: string;
  type?: "website" | "article";
  image?: string;
  jsonLd?: unknown[];
  noindex?: boolean;
}

const JSONLD_ID = "page-jsonld";
const ROBOTS_INDEX = "index, follow, max-image-preview:large, max-snippet:-1";
const ROBOTS_NOINDEX = "noindex,follow";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

export function applySeo({ title, description, url, type = "website", image, jsonLd, noindex }: SeoInput) {
  document.title = title;
  upsertMeta("name", "description", description);
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:type", type);
  upsertMeta("property", "og:url", url);
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", description);
  if (image) {
    upsertMeta("property", "og:image", image);
    upsertMeta("name", "twitter:image", image);
  }

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = url;

  // A ?ref= URL stays noindexed even on an indexable page (see index.html).
  const hideFromIndex = noindex || /[?&]ref=/.test(window.location.search);
  upsertMeta("name", "robots", hideFromIndex ? ROBOTS_NOINDEX : ROBOTS_INDEX);

  document.getElementById(JSONLD_ID)?.remove();
  if (jsonLd?.length) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = JSONLD_ID;
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }

  return () => {
    document.getElementById(JSONLD_ID)?.remove();
    upsertMeta("name", "robots", ROBOTS_INDEX);
  };
}
