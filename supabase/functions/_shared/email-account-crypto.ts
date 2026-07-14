// AES-GCM encryption for stored SMTP passwords.
// Uses EMAIL_ACCOUNT_ENCRYPTION_KEY (hex or arbitrary string, we derive 32 bytes via SHA-256).

async function getKey(): Promise<CryptoKey> {
  const raw = Deno.env.get('EMAIL_ACCOUNT_ENCRYPTION_KEY');
  if (!raw) throw new Error('EMAIL_ACCOUNT_ENCRYPTION_KEY not configured');
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

function toB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encryptPassword(plaintext: string): Promise<{ ciphertext: string; iv: string }> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  return { ciphertext: toB64(ct), iv: toB64(iv.buffer) };
}

export async function decryptPassword(ciphertext: string, iv: string): Promise<string> {
  const key = await getKey();
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(iv) },
    key,
    fromB64(ciphertext),
  );
  return new TextDecoder().decode(pt);
}
