import {LicenseError} from './licensing-security';
export type ChurchLocation={country:string;region:string;city:string;address:string};
export function churchLocation(value:unknown):ChurchLocation{
 if(value!==undefined&&value!==null&&(typeof value!=='object'||Array.isArray(value)))throw new LicenseError(400,'Enter structured church location details.');
 const input=(value||{}) as Record<string,unknown>,result={} as ChurchLocation;
 for(const key of ['country','region','city','address'] as const){if(input[key]!==undefined&&input[key]!==null&&typeof input[key]!=='string')throw new LicenseError(400,'Enter a valid church '+key+'.');const text=String(input[key]??'').trim();if(text.length>(key==='address'?300:120)||/[\x00-\x1f]/.test(text))throw new LicenseError(400,'Enter a valid church '+key+'.');result[key]=text;}return result;
}
