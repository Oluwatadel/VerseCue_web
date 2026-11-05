export function accountReturnPath(value:string|null,fallback="/account"){
 if(value==="/download"||value==="/account"||value==="/account/support"||value==="/account/profile"||value==="/account/organisation")return value;
 if(value?.startsWith("/account/upgrade")){
  try{const url=new URL(value,"https://versecue.invalid");if(url.origin!=="https://versecue.invalid"||url.pathname!=="/account/upgrade")return fallback;
   const query=new URLSearchParams(),reference=url.searchParams.get('reference'),computers=url.searchParams.get('computers'),plan=url.searchParams.get('plan');
   if(reference&&/^[A-Za-z0-9._-]{6,100}$/.test(reference))query.set('reference',reference);
   if(computers&&/^\d{1,5}$/.test(computers)&&Number(computers)>=1&&Number(computers)<=10000)query.set('computers',String(Number(computers)));
   if(plan&&['monthly','six-months','annual'].includes(plan))query.set('plan',plan);
   return '/account/upgrade'+(query.size?'?'+query.toString():'');}catch{}
 }
 return fallback;
}
