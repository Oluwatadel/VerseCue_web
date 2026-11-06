import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

const root = fileURLToPath(new URL("../", import.meta.url));
const files = ["001-licensing.sql", "002-complimentary-access.sql", "003-free-accounts.sql", "004-usage-analytics.sql", "005-billing-email.sql", "006-admin-organisations-support.sql", "007-organisation-computers.sql", "008-webhook-idempotency.sql", "009-hosted-test-checkout.sql", "010-admin-pricing.sql", "011-activation-delivery.sql", "012-subscription-notices.sql"];

// These migrations contain ordinary DDL. Refuse advanced SQL bodies rather
// than silently splitting statements inside a function or quoted identifier.
export function splitMigration(source) {
  const statements = [];
  let statement = "", quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i], next = source[i + 1];
    if (quoted) {
      statement += char;
      if (char === "'" && next === "'") { statement += next; i++; }
      else if (char === "'") quoted = false;
    } else if (char === "'") {
      quoted = true;
      statement += char;
    } else if (char === "-" && next === "-") {
      while (i < source.length && source[i] !== "\n") i++;
      statement += "\n";
    } else if (char === '"' || char === "$" || char === "\\" || (char === "/" && next === "*")) {
      throw new Error("Unsupported SQL syntax: review the migration runner before adding this migration.");
    } else if (char === ";") {
      if (statement.trim()) statements.push(statement.trim());
      statement = "";
    } else statement += char;
  }
  if (quoted) throw new Error("Unterminated SQL string in migration.");
  if (statement.trim()) statements.push(statement.trim());
  return statements;
}

export function loadMigrations() {
  return files.map(name => ({ name, statements: splitMigration(readFileSync(resolve(root, "db", name), "utf8")) }));
}

export function validateDatabaseUrl(value) {
  const url = value?.trim();
  try {
    const parsed = new URL(url);
    if (!["postgres:", "postgresql:"].includes(parsed.protocol) || !parsed.hostname || parsed.pathname.length <= 1) throw new Error();
  } catch {
    throw new Error("DATABASE_URL is not a PostgreSQL connection string. Put the full Neon connection string (starting with postgresql://) in .env.local. Do not use a password, API key, project ID or psql command by itself.");
  }
  return url;
}

export function migrationFailure(error) {
  const details = {
    "28P01": "Database authentication failed. Copy a fresh Neon connection string with the correct role and password.",
    "28000": "Database authentication was rejected. Check the Neon role and connection string.",
    "3D000": "The selected database does not exist. Check the database chosen in Neon Connect.",
    "42501": "The database role cannot create or alter the licensing tables. Use a role with the required schema permissions.",
    "ENOTFOUND": "The database endpoint could not be resolved. Check the hostname and internet connection.",
    "EAI_AGAIN": "Database hostname lookup temporarily failed. Check your connection and retry.",
    "ETIMEDOUT": "The database connection timed out. Check network access and retry.",
    "UND_ERR_CONNECT_TIMEOUT": "The database connection timed out. Check network access and retry.",
    "ECONNREFUSED": "The database connection was refused. Check the endpoint and network access.",
    "ECONNRESET": "The database connection was reset. Check network access and retry."
  };
  for (let cause = error, depth = 0; cause && depth < 6; cause = cause.cause, depth++) {
    if (details[cause.code]) return `Migration failed. ${details[cause.code]}`;
  }
  const code = typeof error?.code === "string" && /^[0-9A-Z]{5}$/.test(error.code) ? ` (PostgreSQL ${error.code})` : "";
  return `Migration failed${code}. Check DATABASE_URL, database permissions and network access. All migrations run in one transaction; you can retry this additive setup.`;
}

async function main() {
  const migrations = loadMigrations();
  if (process.argv.includes("--dry-run")) {
    for (const migration of migrations) console.log(`${migration.name}: ${migration.statements.length} statements checked`);
    console.log("Dry run complete. No database connection was made.");
    return;
  }
  const envFile = resolve(root, ".env.local");
  if (existsSync(envFile)) {
    if (typeof process.loadEnvFile !== "function") throw new Error("Use Node.js 20.12 or newer to load .env.local.");
    try { process.loadEnvFile(envFile); }
    catch { throw new Error("Could not load .env.local. Check that the file is readable and formatted as KEY=value."); }
  }
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is missing. Add your Neon connection string to .env.local or your terminal environment.");
  }
  const databaseUrl = validateDatabaseUrl(process.env.DATABASE_URL);
  console.log("Applying licensing migrations to the database configured by DATABASE_URL...");
  try {
    const sql = neon(databaseUrl);
    // Apply the additive, repeatable migrations atomically and in order.
    await sql.transaction(migrations.flatMap(migration => migration.statements.map(statement => sql.query(statement))));
  } catch (error) {
    // Driver errors can include connection details. Print a safe diagnostic only.
    throw new Error(migrationFailure(error));
  }
  for (const migration of migrations) console.log(`Applied ${migration.name}`);
  console.log("Done. Account, organisation, download and licensing tables/columns are ready.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
