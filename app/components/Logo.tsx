import Image from "next/image";

/** Use the supplied complete logo consistently across public and admin pages. */
export function Logo({ className = "", iconSize = 36, wordmark = true }: { className?: string; iconSize?: number; wordmark?: boolean }) {
  return <span className={`inline-flex shrink-0 items-center gap-2 ${className}`}><Image src="/versevio-icon.png" alt="" width={iconSize} height={iconSize} priority className="shrink-0 object-contain"/>{wordmark&&<span className="text-xl font-bold tracking-tight text-verse-ink">verse<span className="text-[#765314]">VIO</span></span>}</span>;
}

/**
 * Airis IT Consult's wordmark uses dark text, so it needs a light
 * surface behind it. Wrapped in a small rounded
 * badge — the standard "powered by" partner-logo treatment.
 */
export function AirisBadge({
  className = "",
  height = 22,
  label = "Powered by",
}: {
  className?: string;
  height?: number;
  label?: string | null;
}) {
  // Source aspect ratio: 441x388.
  const width = height * (441 / 388);
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {label && (
        <span className="text-xs uppercase tracking-wider text-slate-500">
          {label}
        </span>
      )}
      <span className="inline-flex items-center rounded-lg bg-white px-2 py-1">
        <Image
          src="/airis-logo.png"
          alt="Airis IT Consult"
          width={width}
          height={height}
        />
      </span>
    </span>
  );
}
