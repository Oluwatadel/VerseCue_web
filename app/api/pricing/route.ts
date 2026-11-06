import {api} from '../../../lib/licensing-api';
import {licensingDb} from '../../../lib/licensing-db';
import {PricingService} from '../../../lib/pricing-service';
import {DEFAULT_PRICING} from '../../../lib/billing-plans';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){return api(async()=>process.env.DATABASE_URL?new PricingService(licensingDb()).read():{rates:DEFAULT_PRICING,revision:0,updatedAt:null});}
