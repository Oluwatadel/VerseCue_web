export function accountReturnPath(value:string|null,fallback="/account"){
 if(value==="/download"||value==="/account"||value==="/account/support")return value;
 if(value?.startsWith("/account/upgrade")){
  try{const url=new URL(value,"https://versecue.invalid");if(url.origin!=="https://versecue.invalid"||url.pathname!=="/account/upgrade")return fallback;
   const reference=url.searchParams.get('reference');return '/account/upgrade'+(reference&&/^[A-Za-z0-9._-]{6,100}$/.test(reference)?'?reference='+encodeURIComponent(reference):'');}catch{}
 }
 return fallback;
}
