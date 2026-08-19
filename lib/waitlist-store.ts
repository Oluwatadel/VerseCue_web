import { promises as fs } from "fs";
import path from "path";

export type WaitlistEntry = {
  id: string;
  name: string;
  email: string;
  church: string;
  role: string;
  createdAt: string;
};

const file = path.join(process.cwd(), "data", "waitlist.json");

export async function readWaitlist(): Promise<WaitlistEntry[]> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeWaitlist(entries: WaitlistEntry[]): Promise<void> {
  await fs.writeFile(file, JSON.stringify(entries, null, 2), "utf8");
}
