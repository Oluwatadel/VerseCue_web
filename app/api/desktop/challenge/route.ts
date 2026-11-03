import { api,service } from "../../../../lib/licensing-api";
export const runtime="nodejs";
export async function POST(){ return api(()=>service().challenge()); }
