import {modelCompatibility,installedModelIdentity} from '../../../../lib/model-identity';
import {createPrivateKey} from 'node:crypto';
import {api,admin} from '../../../../lib/licensing-api';
import {issuerConfig} from '../../../../lib/licensing-service';
export const runtime='nodejs';
export async function GET(request:Request){return api(async()=>{await admin(request);const config=issuerConfig();let signing=false;try{const key=createPrivateKey(config.signingKey.replace(/\\n/g,'\n'));signing=key.asymmetricKeyType==='rsa'&&(key.asymmetricKeyDetails?.modulusLength||0)>=2048;}catch{}const checks={ACTIVATION_PRIVATE_KEY_PEM:signing,...modelCompatibility(config.modelKey,config.modelKeyId),ACTIVATION_OFFLINE_HOURS:Number.isFinite(config.offlineHours)&&(config.offlineHours??72)>=1&&(config.offlineHours??72)<=168};return {configured:Object.values(checks).every(Boolean),checks,expectedModelKeyId:installedModelIdentity.keyId};});}
