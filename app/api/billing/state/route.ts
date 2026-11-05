import {api,bearer} from "../../../../lib/licensing-api";
import {billing} from "../../../../lib/billing-api";
export const runtime="nodejs";
export async function GET(request:Request){return api(async()=>billing().state(bearer(request),Number(new URL(request.url).searchParams.get("computers")||1)));}
