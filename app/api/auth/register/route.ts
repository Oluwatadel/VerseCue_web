import {api,service,ACCOUNT_COOKIE} from "../../../../lib/licensing-api";
import {readJson,sameOrigin} from "../../../../lib/licensing-security";
import {EmailService} from "../../../../lib/email-service";
import {licensingDb} from "../../../../lib/licensing-db";
export const runtime="nodejs";
export async function POST(request:Request){let session="";const response=await api(async()=>{sameOrigin(request);const result=await service().webRegister(await readJson(request));session=result.session;try{const mail=new EmailService(licensingDb());await mail.welcome(result.account as any);await mail.dispatch(1);}catch{}return {account:result.account};});if(session)response.cookies.set(ACCOUNT_COOKIE,session,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:60*60*24*30});return response;}
