import {createHash} from 'node:crypto';
import productionIdentity from './model-identity.json';
export type ModelIdentity={keyId:string;keySha256:string};
export const installedModelIdentity:ModelIdentity=productionIdentity;
export function modelCompatibility(modelKey:string,modelKeyId:string,identity:ModelIdentity=installedModelIdentity){const key=Buffer.from(modelKey,'base64');try{return {MODEL_KEY_ID:modelKeyId===identity.keyId,MODEL_CONTENT_KEY_BASE64:key.length===32&&createHash('sha256').update(key).digest('hex')===identity.keySha256};}finally{key.fill(0);}}
