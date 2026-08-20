import { neon } from "@neondatabase/serverless";

export type WaitlistEntry = {
  id: string;
  name: string;
  email: string;
  church: string;
  role: string;
  createdAt: string;
};

function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return neon(databaseUrl);
}

export async function readWaitlist(): Promise<WaitlistEntry[]> {
  const sql = getDatabase();

  const rows = await sql`
    SELECT
      id::text AS id,
      name,
      email,
      COALESCE(church, '') AS church,
      COALESCE(role, '') AS role,
      created_at::text AS "createdAt"
    FROM waitlist
    ORDER BY created_at DESC
  `;

  return rows as WaitlistEntry[];
}

export async function addWaitlistEntry(
  entry: WaitlistEntry
): Promise<boolean> {
  const sql = getDatabase();

  const rows = await sql`
    INSERT INTO waitlist (
      id,
      name,
      email,
      church,
      role,
      created_at
    )
    VALUES (
      ${entry.id}::uuid,
      ${entry.name},
      ${entry.email},
      ${entry.church || null},
      ${entry.role || null},
      ${entry.createdAt}
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id
  `;

  return rows.length > 0;
}