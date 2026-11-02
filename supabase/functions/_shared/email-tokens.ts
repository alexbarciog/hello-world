// Signed one-click unsubscribe tokens. A token names a user ("u") or a free-tool
// email ("e") and can't be forged, so nobody can unsubscribe someone else.
const enc = new TextEncoder();

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
  return b64url(mac.slice(0, 16));
}

export type UnsubTarget = { kind: "u" | "e"; value: string };

export async function makeUnsubToken(target: UnsubTarget, secret: string): Promise<string> {
  const payload = b64url(enc.encode(`${target.kind}:${target.value}`));
  return `${payload}.${await sign(payload, secret)}`;
}

export async function readUnsubToken(token: string, secret: string): Promise<UnsubTarget | null> {
  const [payload, mac] = token.split(".");
  if (!payload || !mac || !secret) return null;
  if ((await sign(payload, secret)) !== mac) return null;
  try {
    const text = new TextDecoder().decode(fromB64url(payload));
    const i = text.indexOf(":");
    const kind = text.slice(0, i);
    const value = text.slice(i + 1);
    return (kind === "u" || kind === "e") && value ? { kind, value } : null;
  } catch {
    return null;
  }
}
