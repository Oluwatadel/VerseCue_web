import {api,admin} from "../../../../lib/licensing-api";
import {licensingDb} from "../../../../lib/licensing-db";
export const runtime="nodejs";
export async function GET(request:Request){return api(async()=>{await admin(request);const db=licensingDb();return {payments:await db.query("SELECT p.reference,p.plan_id,p.computer_count,p.organisation_id,p.amount,p.currency,p.mode,p.status,p.created_at,a.email,a.organisation_name FROM vc_payment_receipts p JOIN vc_accounts a ON a.id=p.account_id ORDER BY p.created_at DESC LIMIT 100")};});}
