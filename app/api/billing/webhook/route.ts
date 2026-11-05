import {NextResponse} from "next/server";
import {Paystack} from "../../../../lib/paystack";
import {billing} from "../../../../lib/billing-api";
import {licensingDb} from "../../../../lib/licensing-db";
import {WebhookService} from "../../../../lib/webhook-service";
import {LicenseError} from "../../../../lib/licensing-security";
import {EmailService} from "../../../../lib/email-service";
export const runtime="nodejs";
export async function POST(request:Request){
 const reader=request.body?.getReader();if(!reader)return NextResponse.json({error:'Missing event.'},{status:400});
 const chunks:Uint8Array[]=[];let length=0;
 while(true){const value=await reader.read();if(value.done)break;length+=value.value.length;if(length>65536){await reader.cancel();return NextResponse.json({error:'Event too large.'},{status:413});}chunks.push(value.value);}
 const raw=Buffer.concat(chunks);const provider=new Paystack();
 if(!provider.validSignature(raw,request.headers.get('x-paystack-signature')))return NextResponse.json({error:'Invalid webhook signature.'},{status:401});
 try{
  const result=await new WebhookService(licensingDb(),billing(),provider.mode).handle(JSON.parse(raw.toString('utf8')));
  if(!result.duplicate)try{await new EmailService(licensingDb()).dispatch(1);}catch{}
  return NextResponse.json(result);
 }catch(error){return NextResponse.json({error:error instanceof LicenseError&&error.status===400?'Invalid webhook event.':'Event could not be processed. Retry required.'},{status:error instanceof LicenseError&&error.status===400?400:503});}
}
