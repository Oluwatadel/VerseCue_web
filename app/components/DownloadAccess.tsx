"use client";
import {InstallerDownloadButton} from "./InstallerDownloadButton";
import Link from "next/link";
import {useEffect,useState} from "react";
export function DownloadAccess({available}:{available:boolean}){
 const[state,setState]=useState<"loading"|"guest"|"ready"|"profile"|"error">("loading");
 const[attempt,setAttempt]=useState(0);
 useEffect(()=>{let mounted=true;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);setState('loading');
 fetch('/api/account',{cache:'no-store',signal:controller.signal}).then(async response=>{if(response.status===401){if(mounted)setState('guest');return;}if(!response.ok)throw new Error();const data=await response.json();if(mounted)setState(data.account.organisationName?.trim()?'ready':'profile');}).catch(()=>{if(mounted)setState('error');}).finally(()=>clearTimeout(timeout));
 return()=>{mounted=false;clearTimeout(timeout);controller.abort();};},[attempt]);
 return <div className="mt-7">{state==='loading'?<p role="status" className="text-sm text-slate-600">Checking account…</p>:state==='ready'?(available?<InstallerDownloadButton platform="windows" label="Download Windows installer"/>:<button disabled className="btn-primary">Windows installer coming soon</button>):state==='profile'?<Link href="/account/profile" className="btn-primary inline-flex">Add your organisation to download</Link>:state==='error'?<><p role="alert" className="text-sm text-red-700">Unable to check your account. Please try again.</p><button className="btn-primary mt-3" onClick={()=>setAttempt(n=>n+1)}>Retry account check</button></>:<><Link href="/account/register?next=/download" className="btn-primary inline-flex">Create free account</Link><Link href="/account/login?next=/download" className="mt-3 block text-sm text-blue-700 underline">Already registered? Sign in</Link></>}<p className="mt-4 text-sm leading-6 text-slate-500">{available?'A free account with your email and organisation name is required to download.':'The Windows installer has not been published yet. You can create your free account now.'}</p></div>;
}
