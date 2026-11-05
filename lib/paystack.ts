import {createHmac,timingSafeEqual} from "node:crypto";
import {LicenseError} from "./licensing-security";
export class Paystack {
 constructor(private secret=process.env.PAYSTACK_SECRET_KEY||"",private request:typeof fetch=fetch){}
 get configured(){return /^sk_(test|live)_[a-zA-Z0-9]+$/.test(this.secret);}
 get mode(){return this.secret.startsWith("sk_live_")?"live":"test";}
 async call(path:string,body?:unknown){
  if(!this.configured)throw new LicenseError(503,"Payment checkout is not configured yet. Your free features remain available.");
  let response:Response;
  try{response=await this.request("https://api.paystack.co"+path,{method:body?"POST":"GET",headers:{Authorization:"Bearer "+this.secret,"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(12000),cache:"no-store"});}
  catch{throw new LicenseError(503,"Could not reach Paystack. Please try again.");}
  let result:any;try{const text=await response.text();result=JSON.parse(text.replace(/("id"\s*:\s*)(\d{16,})(?=\s*[,}])/g,'$1"$2"'));}catch{throw new LicenseError(503,"Unexpected payment provider response.");}
  if(!response.ok||!result.status)throw new LicenseError(503,"Paystack could not complete this request. Please retry or contact support.");
  return result.data;
 }
 validSignature(raw:Buffer,signature:string|null){
  if(!this.configured||!signature||!/^[a-f0-9]{128}$/i.test(signature))return false;
  const expected=createHmac("sha512",this.secret).update(raw).digest();const supplied=Buffer.from(signature,"hex");
  return supplied.length===expected.length&&timingSafeEqual(supplied,expected);
 }
 static checkoutUrl(value:unknown){
  try{const url=new URL(String(value));if(url.protocol==="https:"&&["checkout.paystack.com","paystack.com"].includes(url.hostname)&&!url.username&&!url.password)return url.href;}catch{}
  throw new LicenseError(503,"Unexpected payment checkout address.");
 }
}
