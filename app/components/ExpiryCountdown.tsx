"use client";
import {createContext,useCallback,useContext,useEffect,useMemo,useState} from 'react';
type ClockState={now:number|null;subscribe:()=>()=>void};
const Clock=createContext<ClockState>({now:null,subscribe:()=>()=>{}});
export function CountdownClock({children}:{children:React.ReactNode}){
 const[now,setNow]=useState<number|null>(null),[consumers,setConsumers]=useState(0);
 const subscribe=useCallback(()=>{setConsumers(n=>n+1);return()=>setConsumers(n=>Math.max(0,n-1));},[]);
 useEffect(()=>{
  if(!consumers)return;
  let timer:ReturnType<typeof setInterval>|undefined;
  const sync=()=>{if(timer)clearInterval(timer);timer=undefined;if(document.visibilityState!=='hidden'){setNow(Date.now());timer=setInterval(()=>setNow(Date.now()),1000);}};
  sync();document.addEventListener('visibilitychange',sync);
  return()=>{if(timer)clearInterval(timer);document.removeEventListener('visibilitychange',sync);};
 },[consumers]);
 const value=useMemo(()=>({now,subscribe}),[now,subscribe]);
 return <Clock.Provider value={value}>{children}</Clock.Provider>;
}
export function remainingTime(expiresAt:string,now:number){const seconds=Math.max(0,Math.floor((Date.parse(expiresAt)-now)/1000));if(!seconds)return 'Expired';const days=Math.floor(seconds/86400),hours=Math.floor(seconds%86400/3600),minutes=Math.floor(seconds%3600/60),rest=seconds%60;return days?days+'d '+hours+'h '+minutes+'m':hours+'h '+minutes+'m '+rest+'s';}
export default function ExpiryCountdown({expiresAt,active=true}:{expiresAt:string|null|undefined;active?:boolean}){const {now,subscribe}=useContext(Clock);useEffect(()=>{if(active&&expiresAt)return subscribe();},[active,expiresAt,subscribe]);if(!active)return <span className="text-slate-500">No active plan</span>;if(!expiresAt)return <span className="text-blue-700">No expiry</span>;const expired=now!==null&&Date.parse(expiresAt)<=now;return <span className={'whitespace-nowrap font-medium tabular-nums '+(expired?'text-red-700':'text-blue-700')} title={new Date(expiresAt).toLocaleString()}>{now===null?'Calculating…':remainingTime(expiresAt,now)}</span>;}
