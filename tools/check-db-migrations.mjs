import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { loadMigrations, splitMigration, validateDatabaseUrl, migrationFailure } from "./migrate-db.mjs";

for (const value of ["secret-password-only", "YOUR_NEON_CONNECTION_STRING", "https://example.invalid", "psql 'postgresql://test:password@example.invalid/database'"]) {
  assert.throws(() => validateDatabaseUrl(value), error => error.message.includes("full Neon connection string") && !error.message.includes(value));
}
assert.equal(validateDatabaseUrl(" postgresql://test:password@example.invalid/database "), "postgresql://test:password@example.invalid/database");
const privateDetail = "postgresql://private:password@example.invalid/database";
const networkError = migrationFailure({ message: privateDetail, cause: { code: "ENOTFOUND", message: privateDetail } });
assert.match(networkError, /could not be resolved/);
assert.ok(!networkError.includes(privateDetail));
assert.match(migrationFailure({ code: "28P01", message: privateDetail }), /authentication failed/);
assert.ok(!migrationFailure({ message: privateDetail }).includes(privateDetail));
console.log("PASS: Invalid connection strings fail before connecting; database failures give credential-safe diagnostics.");
const db = new PGlite();
try {
  const migrations = loadMigrations();
  assert.deepEqual(migrations.map(m => m.statements.length), [7, 1, 4, 2, 6, 8, 9, 5, 2, 1, 3, 2]);
  const apply = async () => {
    await db.exec("BEGIN");
    try {
      for (const migration of migrations)
        for (const statement of migration.statements) await db.exec(statement);
      await db.exec("COMMIT");
    } catch (error) { await db.exec("ROLLBACK"); throw error; }
  };
  await apply();
  const id = randomUUID();
  await db.query("INSERT INTO vc_licenses (id,owner_email,code_hash) VALUES ($1,$2,$3)", [id, "migration-test@example.invalid", randomUUID()]);
  await db.query("INSERT INTO vc_accounts(id,email,organisation_name,password_hash) VALUES($1,$2,$3,$4)",[id,'migration-account@example.invalid','Migration Church','fixture']);
  await db.query("INSERT INTO vc_payment_receipts(reference,transaction_id,account_id,plan_id,months,amount,currency,mode,status) VALUES($1,$2,$3,'monthly',1,600000,'NGN','test','test')",['migration-test-receipt','migration-test-transaction',id]);
  await apply();
  assert.equal((await db.query("SELECT status FROM vc_payment_receipts WHERE reference='migration-test-receipt'")).rows[0].status,'test');
  console.log('PASS: All migrations rerun with an existing hosted-test receipt without narrowing its status constraint.');
  const { rows } = await db.query("SELECT id,access_kind FROM vc_licenses");
  assert.deepEqual(rows, [{ id, access_kind: "standard" }]);
  await db.query("UPDATE vc_licenses SET access_kind='complimentary' WHERE id=$1", [id]);
  await apply();
  assert.equal((await db.query("SELECT access_kind FROM vc_licenses WHERE id=$1", [id])).rows[0].access_kind, "complimentary");
  await assert.rejects(db.query("UPDATE vc_licenses SET access_kind='invalid' WHERE id=$1", [id]));
  assert.equal(splitMigration("-- comment;\nSELECT 'it''s; quoted'; SELECT 2;").length, 2);
  assert.throws(() => splitMigration("SELECT $$body;$$;"));
  assert.throws(() => splitMigration("SELECT 'unterminated"));
  console.log("PASS: Both migrations apply, preserve existing licences on rerun, retain complimentary grants and enforce valid access types.");
  console.log("PASS: SQL splitting preserves quoted semicolons and rejects unsupported or incomplete syntax.");
  console.log("All checks used a local temporary database. No Neon connection was made.");
} finally { await db.close(); }
