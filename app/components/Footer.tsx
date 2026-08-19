import { AirisBadge } from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="container-x flex flex-col gap-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span>© {new Date().getFullYear()} VerseCue</span>
          <span className="hidden text-slate-700 sm:inline">•</span>
          <span>Right Verse. Right Time. Your Approval.</span>
        </div>
        <AirisBadge height={18} />
      </div>
    </footer>
  );
}
