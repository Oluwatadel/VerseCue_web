import {admin,api} from '../../../../lib/licensing-api';
import {licensingDb} from '../../../../lib/licensing-db';
import {installationReport,installationReportError} from '../../../../lib/installation-report';
export const dynamic='force-dynamic';
export async function GET(request:Request){return api(async()=>{await admin(request);try{return await installationReport(licensingDb(),Object.fromEntries(new URL(request.url).searchParams));}catch(error){throw installationReportError(error);}});}
