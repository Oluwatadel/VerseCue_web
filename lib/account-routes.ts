const publicAccountPages=new Set(['/account/login','/account/register','/account/forgot-password','/account/reset-password','/account/activate']);
export function isAccountWorkspace(path:string){return (path==='/account'||path.startsWith('/account/'))&&!publicAccountPages.has(path);}
