import {createHmac,randomBytes} from 'node:crypto';
import {LicenseError} from './licensing-security';
export type DownloadKind='windows'|'android';
export function downloadGateway(){const value=process.env.DOWNLOAD_GATEWAY_URL?.trim();if(!value)throw new LicenseError(503,'Protected downloads are being configured. Please contact support.');const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/')throw new LicenseError(503,'The protected download gateway URL is invalid.');return url;}
export function startDownload(kind:DownloadKind){return new URL('/start?kind='+kind,downloadGateway());}
export function grantDownload(account:string,kind:DownloadKind,nonce:string){
 if(!/^[a-f0-9]{64}$/.test(nonce))throw new LicenseError(400,'Invalid download request. Start the download again.');
 const secret=process.env.DOWNLOAD_GATEWAY_SECRET;if(!secret||secret.length<32)throw new LicenseError(503,'Protected download signing is not configured.');
 const payload=Buffer.from(JSON.stringify({account,kind,nonce,exp:Math.floor(Date.now()/1000)+1800,id:randomBytes(16).toString('hex')})).toString('base64url');
 const signature=createHmac('sha256',secret).update(payload).digest('base64url');return new URL('/callback?ticket='+payload+'.'+signature,downloadGateway());
}
