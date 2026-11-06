import {DEFAULT_PRICING,PRICING_GROUPS,BILLING_PLANS,type PricingRates} from './billing-plans';
import type {LicensingDb} from './licensing-db';
import {LicenseError} from './licensing-security';
export function validatePricing(value:unknown):PricingRates{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new LicenseError(400,'Enter all pricing rates.');
 const rates={} as PricingRates;
 for(const [group] of PRICING_GROUPS){rates[group]={} as PricingRates[typeof group];for(const plan of BILLING_PLANS){const amount=(value as any)[group]?.[plan.id];if(typeof amount!=='number'||!Number.isInteger(amount)||amount<1||amount>1000000)throw new LicenseError(400,'Every rate must be a whole naira amount between ₦1 and ₦1,000,000 per computer per month.');rates[group][plan.id]=amount;}}
 return rates;
}
export class PricingService{
 constructor(private db:LicensingDb){}
 async read(){let rows;try{rows=await this.db.query('SELECT rates,revision,updated_at FROM vc_pricing WHERE id=1');}catch(error){if((error as {code?:string}).code==='42P01')throw new LicenseError(503,'Pricing setup is incomplete. Run npm run db:migrate on the website database.');throw error;}const [row]=rows;return row?{rates:validatePricing(row.rates),revision:Number(row.revision),updatedAt:row.updated_at}:{rates:DEFAULT_PRICING,revision:0,updatedAt:null};}
 async save(value:unknown,revision:unknown){const rates=validatePricing(value);if(typeof revision!=='number'||!Number.isSafeInteger(revision)||revision<0)throw new LicenseError(400,'Reload pricing before saving.');
 const [saved]=await this.db.query(`INSERT INTO vc_pricing(id,rates,revision) VALUES(1,$1,1)
 ON CONFLICT(id) DO UPDATE SET rates=EXCLUDED.rates,revision=vc_pricing.revision+1,updated_at=now() WHERE vc_pricing.revision=$2
 RETURNING rates,revision,updated_at`,[JSON.stringify(rates),revision]);
 if(!saved)throw new LicenseError(409,'Pricing changed in another session. Reload before saving.');
 return {rates:validatePricing(saved.rates),revision:Number(saved.revision),updatedAt:saved.updated_at};
 }
}
