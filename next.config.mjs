/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [{ source: "/waitlist", destination: "/download", permanent: false }];
  },
};
export default (phase) => ({ ...nextConfig, distDir: process.env.VERSECUE_NEXT_DIST_DIR || (phase === "phase-development-server" ? ".next-dev" : ".next"), experimental: { cpus: 2 } });
