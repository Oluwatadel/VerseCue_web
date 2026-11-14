function installerUrl(value:string|undefined):string|null {
  if(!value?.trim())return null;
  try {const url=new URL(value.trim());return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}
  catch{return null;}
}
export function getWindowsInstallerUrl(): string | null {return installerUrl(process.env.WINDOWS_DOWNLOAD_URL);}
export function getAndroidInstallerUrl(): string | null {return installerUrl(process.env.MOBILE_ANDROID_DOWNLOAD_URL);}

export function getSupportEmail(): string | null {
  const value = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  return value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}
