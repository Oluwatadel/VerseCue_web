import {api} from "../../../../lib/licensing-api";
import {LicenseError} from "../../../../lib/licensing-security";
export const runtime="nodejs";
export async function POST(){return api(async()=>{throw new LicenseError(410,"Create your free account on the VerseCue website, then sign in here. Activate AI separately from your account page.");});}
