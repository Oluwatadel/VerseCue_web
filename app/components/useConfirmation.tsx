"use client";
import {useEffect,useId,useRef,useState} from 'react';
type Confirmation={title:string;message:string;details?:string[];confirmLabel?:string};
export function useConfirmation(){const titleId=useId();const[content,setContent]=useState<Confirmation|null>(null),dialog=useRef<HTMLDialogElement>(null),resolve=useRef<((confirmed:boolean)=>void)|null>(null);
 function finish(confirmed:boolean){const pending=resolve.current;resolve.current=null;setContent(null);pending?.(confirmed);}
 useEffect(()=>{if(content)dialog.current?.showModal();else dialog.current?.close();},[content]);
 useEffect(()=>()=>{resolve.current?.(false);resolve.current=null;},[]);
 function confirm(options:Confirmation){if(resolve.current)return Promise.resolve(false);return new Promise<boolean>(done=>{resolve.current=done;setContent(options);});}
 const confirmationDialog=<dialog ref={dialog} aria-labelledby={titleId} onCancel={()=>finish(false)} onClose={()=>{if(resolve.current)finish(false);}} className="m-auto max-h-[90dvh] w-[min(32rem,calc(100%_-_2rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 text-slate-900 backdrop:bg-black/70">{content&&<><p className="text-sm font-semibold text-amber-800">Please confirm</p><h2 id={titleId} className="mt-3 text-2xl font-semibold">{content.title}</h2><p className="mt-4 text-sm leading-7 text-slate-600">{content.message}</p>{content.details&&<ul className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">{content.details.map(detail=><li key={detail}>{detail}</li>)}</ul>}<div className="mt-6 flex flex-wrap justify-end gap-3"><button autoFocus className="btn-secondary" onClick={()=>finish(false)}>Cancel</button><button className="btn-primary" onClick={()=>finish(true)}>{content.confirmLabel||'Continue'}</button></div></>}</dialog>;
 return {confirm,confirmationDialog};}
