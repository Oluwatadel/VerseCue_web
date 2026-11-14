"use client";
import {useState,type InputHTMLAttributes} from 'react';
export default function PasswordInput(props:InputHTMLAttributes<HTMLInputElement>){const[visible,setVisible]=useState(true);return <span className="relative block"><input {...props} type={visible?'text':'password'} className={(props.className||'input')+' pr-20'}/><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-blue-700" aria-label={visible?'Hide password':'Show password'} aria-pressed={visible} onClick={()=>setVisible(v=>!v)}>{visible?'Hide':'Show'}</button></span>;}
