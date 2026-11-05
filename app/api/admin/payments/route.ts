import {api,admin} from "../../../../lib/licensing-api";
import {licensingDb} from "../../../../lib/licensing-db";
import {Paystack} from "../../../../lib/paystack";
import {siteOrigin} from "../../../../lib/billing-plans";
export const runtime="nodejs";
export async function GET(request:Request){return api(async()=>{await admin(request);const db=licensingDb();return {integration:{siteUrl:siteOrigin(),webhookUrl:siteOrigin()+'/api/billing/webhook',callbackUrl:siteOrigin()+'/api/billing/callback',configured:new Paystack().configured,testCheckoutEnabled:process.env.BILLING_ALLOW_TEST_CHECKOUT==='1'||process.env.BILLING_ALLOW_TEST_ACTIVATION==='1'&&process.env.NODE_ENV!=='production',mode:new Paystack().mode},webhooks:await db.query("SELECT mode,event_key,event_type,status,locked_at,completed_at,last_error FROM vc_webhook_events ORDER BY locked_at DESC LIMIT 50"),payments:await db.query("SELECT p.reference,p.plan_id,p.computer_count,p.organisation_id,p.amount,p.currency,p.mode,p.status,p.created_at,a.email,a.organisation_name FROM vc_payment_receipts p JOIN vc_accounts a ON a.id=p.account_id ORDER BY p.created_at DESC LIMIT 100")};});}
