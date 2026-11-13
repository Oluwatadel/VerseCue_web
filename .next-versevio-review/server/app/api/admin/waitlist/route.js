"use strict";(()=>{var e={};e.id=2613,e.ids=[2613],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},93371:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>w,patchFetch:()=>E,requestAsyncStorage:()=>m,routeModule:()=>p,serverHooks:()=>A,staticGenerationAsyncStorage:()=>h});var a={};r.r(a),r.d(a,{GET:()=>d,dynamic:()=>l,runtime:()=>c});var i=r(49303),n=r(88716),o=r(60670),s=r(87070),u=r(59091);let l="force-dynamic",c="nodejs";async function d(){try{let e=await (0,u.J)();return s.NextResponse.json({entries:e})}catch(e){return console.error("Unable to load waitlist:",e),s.NextResponse.json({error:"Unable to load waitlist entries."},{status:500})}}let p=new i.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/admin/waitlist/route",pathname:"/api/admin/waitlist",filename:"route",bundlePath:"app/api/admin/waitlist/route"},resolvedPagePath:"C:\\Users\\DELL\\Documents\\Projects\\VerseVIO-app-web\\versecue-web-nextjs\\app\\api\\admin\\waitlist\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:m,staticGenerationAsyncStorage:h,serverHooks:A}=p,w="/api/admin/waitlist/route";function E(){return(0,o.patchFetch)({serverHooks:A,staticGenerationAsyncStorage:h})}},59091:(e,t,r)=>{r.d(t,{J:()=>n,x:()=>o});var a=r(62237);function i(){let e=process.env.DATABASE_URL;if(!e)throw Error("DATABASE_URL is not configured.");return(0,a.qn)(e)}async function n(){let e=i();return await e`
    SELECT
      id::text AS id,
      name,
      email,
      COALESCE(church, '') AS church,
      COALESCE(role, '') AS role,
      created_at::text AS "createdAt"
    FROM waitlist
    ORDER BY created_at DESC
  `}async function o(e){let t=i();return(await t`
    INSERT INTO waitlist (
      id,
      name,
      email,
      church,
      role,
      created_at
    )
    VALUES (
      ${e.id}::uuid,
      ${e.name},
      ${e.email},
      ${e.church||null},
      ${e.role||null},
      ${e.createdAt}
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id
  `).length>0}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[8948,5972,2237],()=>r(93371));module.exports=a})();