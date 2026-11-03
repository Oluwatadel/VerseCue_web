import { neon } from "@neondatabase/serverless";
export type Row = Record<string, any>;
export type Statement = { text: string; values?: any[] };
export interface LicensingDb {
 query(text: string, values?: any[]): Promise<Row[]>;
 transaction(statements: Statement[]): Promise<Row[][]>;
}
export function licensingDb(): LicensingDb {
 const url = process.env.DATABASE_URL;
 if (!url) throw new Error("Licensing database is not configured");
 const sql = neon(url);
 return {
  query: async (text, values = []) => await sql.query(text, values) as Row[],
  transaction: async (items) => await sql.transaction(items.map((item) => sql.query(item.text, item.values || []))) as Row[][],
 };
}
