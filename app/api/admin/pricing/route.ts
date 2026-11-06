import {admin,api} from '../../../../lib/licensing-api';
import {licensingDb} from '../../../../lib/licensing-db';
import {readJson} from '../../../../lib/licensing-security';
import {PricingService} from '../../../../lib/pricing-service';
export const runtime='nodejs';
export async function GET(request:Request){return api(async()=>{await admin(request);return new PricingService(licensingDb()).read();});}
export async function PUT(request:Request){return api(async()=>{await admin(request);const body=await readJson(request);return new PricingService(licensingDb()).save(body.rates,body.revision);});}
