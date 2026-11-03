import { createHash, createPublicKey, randomBytes, scrypt, timingSafeEqual, verify, constants } from "node:crypto";
export class LicenseError extends Error { constructor(public status: number, message: string) { super(message); } }
export const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export const normalizeEmail = (value: unknown) => String(value ?? "").trim().toLowerCase();
export function checkEmail(email: string) { if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new LicenseError(400, "Enter a valid email address."); }
let activeHashes=0;
async function derive(password: string, salt: Buffer): Promise<Buffer> {
 if(activeHashes>=2) throw new LicenseError(429,"Sign-in is busy. Please retry shortly.");
 activeHashes++;
 try { return await deriveKey(password,salt); } finally { activeHashes--; }
}
function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
 return new Promise((resolve,reject) => scrypt(password, salt, 32, { N:131072, r:8, p:1, maxmem:256*1024*1024 }, (error,key) => error ? reject(error) : resolve(key)));
}
export async function hashPassword(password: string) {
 if (password.length < 12 || password.length > 128) throw new LicenseError(400,"Use a password between 12 and 128 characters.");
 const salt = randomBytes(16); const key = await derive(password,salt);
 return `scrypt$131072$8$1$${salt.toString("base64")}$${key.toString("base64")}`;
}
export async function verifyPassword(password: string, encoded: string) {
 if (password.length > 128) return false;
 const parts = encoded.split("$"); if (parts.length !== 6 || parts.slice(0,4).join("$") !== "scrypt$131072$8$1") return false;
 const salt = Buffer.from(parts[4],"base64"), expected = Buffer.from(parts[5],"base64");
 if (salt.length !== 16 || expected.length !== 32) return false;
 return timingSafeEqual(await derive(password,salt), expected);
}
export type Device = { id: string; machineHash: string; publicKey: string; name: string; nonce: string; proof: string };
export function validateDevice(value: unknown, email: string): Device {
 const d = value as Device;
 if (!d || !/^[a-f0-9]{64}$/.test(d.id) || !/^[a-f0-9]{64}$/.test(d.machineHash) || typeof d.publicKey !== "string" || d.publicKey.length > 2000 || typeof d.nonce !== "string" || d.nonce.length > 100 || typeof d.proof !== "string" || d.proof.length > 2000)
  throw new LicenseError(400,"Invalid device proof.");
 try {
  const key = createPublicKey({ key:Buffer.from(d.publicKey,"base64"), format:"der", type:"spki" });
  if (key.asymmetricKeyType !== "rsa" || (key.asymmetricKeyDetails?.modulusLength || 0) < 2048) throw new Error();
  const canonical = key.export({type:"spki",format:"der"}).toString("base64");
  if (canonical !== d.publicKey || d.id !== hash(`versecue-device-v1\n${d.machineHash}\n${canonical}`)) throw new Error();
  if (!verify("sha256",Buffer.from(`VerseCue-device-v1\n${d.nonce}\n${email}\n${d.id}`),{key,padding:constants.RSA_PKCS1_PSS_PADDING,saltLength:32},Buffer.from(d.proof,"base64"))) throw new Error();
 } catch { throw new LicenseError(401,"Device verification failed."); }
 return { ...d, name: String(d.name || "Windows computer").slice(0,100) };
}
export async function readJson(request: Request): Promise<Record<string, any>> {
 const reader = request.body?.getReader(); if (!reader) throw new LicenseError(400,"A request body is required.");
 const chunks: Uint8Array[] = []; let length = 0;
 while (true) { const part = await reader.read(); if(part.done) break; length += part.value.length; if(length > 16384) { await reader.cancel(); throw new LicenseError(413,"Request too large."); } chunks.push(part.value); }
 try { const body = JSON.parse(Buffer.concat(chunks).toString("utf8")); if(!body || typeof body!=="object" || Array.isArray(body)) throw new Error(); return body; }
 catch { throw new LicenseError(400,"Invalid request."); }
}
export function sameOrigin(request: Request) {
 const origin = request.headers.get("origin");
 if (origin && origin !== new URL(request.url).origin) throw new LicenseError(403,"Request origin is not allowed.");
 if (!origin && request.headers.get("sec-fetch-site") === "cross-site") throw new LicenseError(403,"Request origin is not allowed.");
}
