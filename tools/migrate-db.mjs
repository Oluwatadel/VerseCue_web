import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

const root = fileURLToPath(new URL("../", import.meta.url));
const files = ["001-licensing.sql", "002-complimentary-access.sql"];

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
  console.log("Applying licensing migrations to the database configured by DATABASE_URL...");
  try {
    const sql = neon(process.env.DATABASE_URL);
    // Apply both additive, repeatable migrations atomically and in order.
    await sql.transaction(migrations.flatMap(migration => migration.statements.map(statement => sql.query(statement))));
  } catch (error) {
    // Driver errors can include connection details. Print a safe diagnostic only.
    const code = typeof error?.code === "string" && /^[0-9A-Z]{5}$/.test(error.code) ? ` (PostgreSQL ${error.code})` : "";
    throw new Error(`Migration failed${code}. Check DATABASE_URL, database permissions and network access. Both migrations run in one transaction; you can retry this additive setup.`);
  }
  for (const migration of migrations) console.log(`Applied ${migration.name}`);
  console.log("Done. Account, licensing and complimentary-access tables/columns are ready.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
