import {api,service,bearer} from "../../../../../lib/licensing-api";
import {readJson} from "../../../../../lib/licensing-security";
export const runtime="nodejs";
export async function POST(request:Request){return api(async()=>service().freeDesktopRefresh(bearer(request),(await readJson(request)).device));}
