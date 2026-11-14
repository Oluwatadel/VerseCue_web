import {createPrivateKey} from 'node:crypto';
import {api,admin} from '../../../../lib/licensing-api';
import {issuerConfig} from '../../../../lib/licensing-service';
export const runtime='nodejs';
export async function GET(request:Request){return api(async()=>{await admin(request);const config=issuerConfig();let signing=false;try{const key=createPrivateKey(config.signingKey.replace(/\\n/g,'\n'));signing=key.asymmetricKeyType==='rsa'&&(key.asymmetricKeyDetails?.modulusLength||0)>=2048;}catch{}const checks={ACTIVATION_PRIVATE_KEY_PEM:signing,MODEL_CONTENT_KEY_BASE64:Buffer.from(config.modelKey,'base64').length===32,MODEL_KEY_ID:/^[a-zA-Z0-9._-]{1,100}$/.test(config.modelKeyId),ACTIVATION_OFFLINE_HOURS:Number.isFinite(config.offlineHours)&&(config.offlineHours??72)>=1&&(config.offlineHours??72)<=168};return {configured:Object.values(checks).every(Boolean),checks};});}
