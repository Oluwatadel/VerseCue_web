import {NextResponse} from "next/server";
import {Paystack} from "../../../../lib/paystack";
import {billing} from "../../../../lib/billing-api";
import {licensingDb} from "../../../../lib/licensing-db";
import {EmailService} from "../../../../lib/email-service";
export const runtime="nodejs";
export async function POST(request:Request){
 const reader=request.body?.getReader();if(!reader)return NextResponse.json({error:'Missing event.'},{status:400});
 const chunks:Uint8Array[]=[];let length=0;
 while(true){const value=await reader.read();if(value.done)break;length+=value.value.length;if(length>65536){await reader.cancel();return NextResponse.json({error:'Event too large.'},{status:413});}chunks.push(value.value);}
 const raw=Buffer.concat(chunks);const provider=new Paystack();
 if(!provider.validSignature(raw,request.headers.get('x-paystack-signature')))return NextResponse.json({error:'Invalid webhook signature.'},{status:401});
 try{
  const {event,data}=JSON.parse(raw.toString('utf8'));const service=billing();
  if(event==='charge.success')await service.confirm(data.reference,undefined,data.subscription?.subscription_code);
  else if(event==='invoice.update'&&data.paid===true&&data.transaction?.status==='success')await service.confirm(data.transaction.reference,undefined,data.subscription?.subscription_code);
  else if(['subscription.create','subscription.not_renew','subscription.disable'].includes(event))await service.subscriptionEvent(event,data);
  else if(event==='refund.processed')await service.paymentReversed(data.transaction?.reference||data.transaction_reference,'refunded');
  else if(event==='charge.dispute.create')await service.paymentReversed(data.transaction?.reference,'disputed');
  else if(event==='invoice.payment_failed'){
   const db=licensingDb();const rows=await db.query(`SELECT a.id,a.email FROM vc_accounts a JOIN vc_billing_subscriptions s ON s.account_id=a.id WHERE s.code=$1 AND s.mode=$2`,[data.subscription?.subscription_code,provider.mode]);
   if(rows[0])await new EmailService(db).queue('payment-failed:'+String(data.invoice_code||data.id),rows[0].id,rows[0].email,'VerseCue renewal payment needs attention','Your automatic renewal payment did not succeed. Review your plan and payment details on your VerseCue account. Free Bible and media features remain available.');
  }
  try{await new EmailService(licensingDb()).dispatch(1);}catch{}
  return NextResponse.json({received:true});
 }catch{return NextResponse.json({error:'Event could not be processed. Retry required.'},{status:503});}
}
