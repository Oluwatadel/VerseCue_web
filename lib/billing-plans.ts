export const BILLING_PLANS=[
 {id:"monthly",name:"Monthly",months:1,amount:600000,monthlyNaira:6000,interval:"monthly",env:"PAYSTACK_PLAN_MONTHLY"},
 {id:"six-months",name:"Six months",months:6,amount:3300000,monthlyNaira:5500,interval:"biannually",env:"PAYSTACK_PLAN_SIX_MONTHS"},
 {id:"annual",name:"Annual",months:12,amount:6000000,monthlyNaira:5000,interval:"annually",env:"PAYSTACK_PLAN_ANNUAL"}
] as const;
export function billingPlan(id:unknown){return BILLING_PLANS.find(plan=>plan.id===id);}
export function quotePlan(id:unknown,computers:unknown=1){
 const base=billingPlan(id);
 if(!base||typeof computers!=='number'||!Number.isInteger(computers)||computers<1||computers>10000)return undefined;
 const perComputerNaira=computers===1?base.monthlyNaira:computers<=9?(base.months===1?4000:3500):computers===10?4000:3500;
 return {...base,computerCount:computers,perComputerNaira,monthlyNaira:perComputerNaira*computers,amount:perComputerNaira*computers*base.months*100};
}
export function siteOrigin(){
 const url=new URL(process.env.NEXT_PUBLIC_SITE_URL||"https://versecue.app");
 if(url.protocol!=="https:" && !(url.protocol==="http:"&&["localhost","127.0.0.1"].includes(url.hostname)))throw new Error("Configure a secure site URL.");
 return url.origin;
}
