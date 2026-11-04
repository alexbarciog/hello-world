// LinkedIn document (PDF) posts. LinkedIn only shows a swipeable carousel when
// a post carries a single PDF document, so superscale-publish-post sends the PDF
// as the post's only attachment when `linkedin_posts.metrics.document_url` is set.
//
// Unipile's create-post API has no title field, so the title travels as the
// file name. After publishing, Unipile's GET /posts/{id} reports documents as
// attachments of type "file" (images are "img"), which is how we check it.

export interface PostDocument {
  url: string;
  title: string | null;
}

/** `metrics.document_url` / `metrics.document_title`, or null for a normal post. */
export function documentFromMetrics(metrics: unknown): PostDocument | null {
  if (!metrics || typeof metrics !== "object") return null;
  const m = metrics as Record<string, unknown>;
  const url = typeof m.document_url === "string" ? m.document_url.trim() : "";
  if (!/^https?:\/\//i.test(url)) return null;
  const title = typeof m.document_title === "string" && m.document_title.trim() ? m.document_title.trim() : null;
  return { url, title };
}

/** A PDF file starts with "%PDF". */
export function isPdf(buf: Uint8Array): boolean {
  return buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
}

/** File name LinkedIn shows as the document title: the title without path or control characters. */
export function documentFileName(title: string | null): string {
  const base = (title || "")
    // deno-lint-ignore no-control-regex
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
  return `${base || "document"}.pdf`;
}

/** Whether a Unipile post (GET /api/v1/posts/{id}) carries a document. */
export function documentCheck(post: unknown): { ok: boolean; attachment_types: string[] } {
  const attachments = (post as { attachments?: unknown })?.attachments;
  const types = Array.isArray(attachments)
    ? attachments.map((a) => String((a as { type?: unknown })?.type ?? "unknown"))
    : [];
  return { ok: types.includes("file"), attachment_types: types };
}
