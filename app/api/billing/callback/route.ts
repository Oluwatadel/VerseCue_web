import {NextResponse} from "next/server";
import {billing} from "../../../../lib/billing-api";
import {siteOrigin} from "../../../../lib/billing-plans";
export const runtime="nodejs";
export async function GET(request:Request){
 const reference=new URL(request.url).searchParams.get('reference')||new URL(request.url).searchParams.get('trxref')||'';
 let state='pending';try{await billing().confirm(reference);state='verified';}catch{}
 const url=new URL('/account/upgrade',siteOrigin());url.searchParams.set('payment',state);
 if(/^[a-zA-Z0-9._-]{6,100}$/.test(reference))url.searchParams.set('reference',reference);
 const response=NextResponse.redirect(url);response.headers.set('Cache-Control','no-store');return response;
}
