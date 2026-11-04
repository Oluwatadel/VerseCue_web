import { existsSync } from "node:fs";
import { createPrivateKey } from "node:crypto";
import { fileURLToPath } from "node:url";

const envFile = fileURLToPath(new URL("../.env.local", import.meta.url));
if (existsSync(envFile)) {
  if (typeof process.loadEnvFile !== "function") { console.error("Use Node.js 20.12 or newer."); process.exit(1); }
  try { process.loadEnvFile(envFile); }
  catch { console.error("Could not load .env.local. Check its format and permissions."); process.exit(1); }
}
const e = process.env;
const checks = [];
let databaseValid = false, signingValid = false;
try {
  const url = new URL(e.DATABASE_URL);
  databaseValid = ["postgres:", "postgresql:"].includes(url.protocol) && !!url.hostname && url.pathname.length > 1;
} catch {}
try {
  const key = createPrivateKey((e.ACTIVATION_PRIVATE_KEY_PEM || "").replace(/\\n/g, "\n"));
  signingValid = key.asymmetricKeyType === "rsa" && key.asymmetricKeyDetails.modulusLength >= 2048;
} catch {}
checks.push(["DATABASE_URL", databaseValid, "use your actual Neon PostgreSQL connection string"]);
checks.push(["ADMIN_PASSWORD", (e.ADMIN_PASSWORD?.length || 0) >= 12, "set an admin password of at least 12 characters"]);
checks.push(["ADMIN_SESSION_SECRET", (e.ADMIN_SESSION_SECRET?.length || 0) >= 32, "set a random secret of at least 32 characters"]);
checks.push(["ACTIVATION_PRIVATE_KEY_PEM", signingValid, "use the production RSA private key PEM"]);
checks.push(["MODEL_CONTENT_KEY_BASE64", Buffer.from(e.MODEL_CONTENT_KEY_BASE64 || "", "base64").length === 32, "use the base64 key from production model-key.json"]);
checks.push(["MODEL_KEY_ID", /^[a-zA-Z0-9._-]{1,100}$/.test(e.MODEL_KEY_ID || ""), "use keyId from that same model-key.json"]);
const hours = Number(e.ACTIVATION_OFFLINE_HOURS || 72);
checks.push(["ACTIVATION_OFFLINE_HOURS", Number.isFinite(hours) && hours >= 1 && hours <= 168, "use a number between 1 and 168; default is 72"]);
for (const [name, valid, help] of checks) console.log(`${valid ? "OK" : "FIX"} ${name}${valid ? "" : ": " + help}`);
console.log("No secret values were printed. This checks configuration format, not database connectivity or migrations.");
process.exitCode = checks.every(([, valid]) => valid) ? 0 : 1;
