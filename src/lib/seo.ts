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

  const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (noindex) upsertMeta("name", "robots", "noindex");
  else if (robots?.content === "noindex") robots.remove();

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
    document.head.querySelector('meta[name="robots"][content="noindex"]')?.remove();
  };
}
