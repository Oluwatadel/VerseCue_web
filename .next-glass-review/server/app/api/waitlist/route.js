"use strict";(()=>{var e={};e.id=6282,e.ids=[6282],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},43811:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>g,patchFetch:()=>w,requestAsyncStorage:()=>p,routeModule:()=>d,serverHooks:()=>h,staticGenerationAsyncStorage:()=>m});var s={};r.r(s),r.d(s,{POST:()=>c,runtime:()=>l});var a=r(49303),i=r(88716),n=r(60670),o=r(87070),u=r(59091);let l="nodejs";async function c(e){try{let t=await e.json(),r=String(t.name??"").trim(),s=String(t.email??"").trim().toLowerCase(),a=String(t.church??"").trim(),i=String(t.role??"").trim();if(!r||!s)return o.NextResponse.json({error:"Name and email are required."},{status:400});if(r.length>150)return o.NextResponse.json({error:"Name is too long."},{status:400});if(s.length>320)return o.NextResponse.json({error:"Email address is too long."},{status:400});if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))return o.NextResponse.json({error:"Please enter a valid email address."},{status:400});let n={id:crypto.randomUUID(),name:r,email:s,church:a,role:i,createdAt:new Date().toISOString()};if(!await (0,u.x)(n))return o.NextResponse.json({message:"You're already on the verseVIO waitlist."},{status:200});return o.NextResponse.json({message:"You're on the verseVIO waitlist!"},{status:201})}catch(e){return console.error("Waitlist submission error:",e),o.NextResponse.json({error:"Unable to join the waitlist. Please try again."},{status:500})}}let d=new a.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/waitlist/route",pathname:"/api/waitlist",filename:"route",bundlePath:"app/api/waitlist/route"},resolvedPagePath:"C:\\Users\\DELL\\Documents\\Projects\\VerseVIO-app-web\\versecue-web-nextjs\\app\\api\\waitlist\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:p,staticGenerationAsyncStorage:m,serverHooks:h}=d,g="/api/waitlist/route";function w(){return(0,n.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:m})}},59091:(e,t,r)=>{r.d(t,{J:()=>i,x:()=>n});var s=r(62237);function a(){let e=process.env.DATABASE_URL;if(!e)throw Error("DATABASE_URL is not configured.");return(0,s.qn)(e)}async function i(){let e=a();return await e`
    SELECT
      id::text AS id,
      name,
      email,
      COALESCE(church, '') AS church,
      COALESCE(role, '') AS role,
      created_at::text AS "createdAt"
    FROM waitlist
    ORDER BY created_at DESC
  `}async function n(e){let t=a();return(await t`
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
  `).length>0}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[8948,5972,2237],()=>r(43811));module.exports=s})();