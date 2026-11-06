export const BILLING_PLANS=[
 {id:"monthly",name:"Monthly",months:1,amount:600000,monthlyNaira:6000,interval:"monthly",env:"PAYSTACK_PLAN_MONTHLY"},
 {id:"six-months",name:"Six months",months:6,amount:3300000,monthlyNaira:5500,interval:"biannually",env:"PAYSTACK_PLAN_SIX_MONTHS"},
 {id:"annual",name:"Annual",months:12,amount:6000000,monthlyNaira:5000,interval:"annually",env:"PAYSTACK_PLAN_ANNUAL"}
] as const;
export function billingPlan(id:unknown){return BILLING_PLANS.find(plan=>plan.id===id);}
export const PRICING_GROUPS=[['individual','Individual · 1 PC'],['team','Organisation · 2–9 PCs'],['ten','Organisation · exactly 10 PCs'],['large','Organisation · 11+ PCs']] as const;
export type PricingRates=Record<typeof PRICING_GROUPS[number][0],Record<typeof BILLING_PLANS[number]['id'],number>>;
export const DEFAULT_PRICING:PricingRates={individual:{monthly:6000,'six-months':5500,annual:5000},team:{monthly:4000,'six-months':3500,annual:3500},ten:{monthly:4000,'six-months':4000,annual:4000},large:{monthly:3500,'six-months':3500,annual:3500}};
export function quotePlan(id:unknown,computers:unknown=1,rates:PricingRates=DEFAULT_PRICING){
 const base=billingPlan(id);
 if(!base||typeof computers!=='number'||!Number.isInteger(computers)||computers<1||computers>10000)return undefined;
 const perComputerNaira=rates[computers===1?'individual':computers<=9?'team':computers===10?'ten':'large'][base.id];
 return {...base,computerCount:computers,perComputerNaira,monthlyNaira:perComputerNaira*computers,amount:perComputerNaira*computers*base.months*100};
}
export function siteOrigin(){
 const url=new URL(process.env.NEXT_PUBLIC_SITE_URL||"https://versecue.app");
 if(url.protocol!=="https:" && !(url.protocol==="http:"&&["localhost","127.0.0.1"].includes(url.hostname)))throw new Error("Configure a secure site URL.");
 return url.origin;
}
