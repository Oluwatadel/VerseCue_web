import { neon } from "@neondatabase/serverless";
import { LicenseError } from "./licensing-security";
export type Row = Record<string, any>;
export type Statement = { text: string; values?: any[] };
export interface LicensingDb {
 query(text: string, values?: any[]): Promise<Row[]>;
 transaction(statements: Statement[]): Promise<Row[][]>;
}
export function licensingDb(): LicensingDb {
 const url = process.env.DATABASE_URL?.trim();
 try {
  if (!url) throw new Error();
  const parsed = new URL(url);
  if (!["postgres:", "postgresql:"].includes(parsed.protocol) || !parsed.hostname || parsed.pathname.length <= 1) throw new Error();
 } catch {
  throw new LicenseError(503,"The account database is not configured. Ask your administrator to set a valid DATABASE_URL and restart the website.");
 }
 const sql = neon(url!);
 return {
  query: async (text, values = []) => await sql.query(text, values) as Row[],
  transaction: async (items) => await sql.transaction(items.map((item) => sql.query(item.text, item.values || []))) as Row[][],
 };
}
