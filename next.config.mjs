/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers(){return [
    ...['/admin/:path*','/account/:path*','/api/:path*'].map(source=>({source,headers:[{key:'Cache-Control',value:'private, no-store, max-age=0'},{key:'X-Content-Type-Options',value:'nosniff'}]})),
    ...['/admin-sw.js','/support-sw.js','/pwa/workspace-worker.js','/pwa/:name.webmanifest'].map(source=>({source,headers:[{key:'Cache-Control',value:'no-cache, no-store, must-revalidate'},{key:'X-Content-Type-Options',value:'nosniff'}]})),
  ];},
  async redirects() {
    return [{ source: "/waitlist", destination: "/download", permanent: false }];
  },
};
export default (phase) => ({ ...nextConfig, distDir: process.env.VERSECUE_NEXT_DIST_DIR || (phase === "phase-development-server" ? ".next-dev" : ".next"), experimental: { cpus: 2 } });
