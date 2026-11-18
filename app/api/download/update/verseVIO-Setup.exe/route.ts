import {NextResponse} from 'next/server';
import {downloadGateway} from '../../../../../lib/download-access';
import {api} from '../../../../../lib/licensing-api';
export const dynamic='force-dynamic';
// The gateway requires a desktop download credential: this public entry URL grants no file access.
export async function GET(){try{return NextResponse.redirect(new URL('/update/verseVIO-Setup.exe',downloadGateway()),{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});}catch(error){return api(async()=>{throw error;});}}
