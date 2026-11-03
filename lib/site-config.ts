export function getWindowsInstallerUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL?.trim();
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : null; }
  catch { return null; }
}

export function getSupportEmail(): string | null {
  const value = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  return value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}
