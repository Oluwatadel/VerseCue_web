import Image from "next/image";

/**
 * Primary VerseCue brand mark: icon + wordmark, laid out horizontally.
 * Two separate image assets (icon / wordmark) are used instead of the
 * single combined lockup so each can be sized independently and stay
 * crisp at small navbar heights.
 */
export function Logo({
  className = "",
  iconSize = 36,
}: {
  className?: string;
  iconSize?: number;
}) {
  // Source aspect ratios: icon 777x560, wordmark 941x131.
  const wordmarkHeight = iconSize * 0.62;
  const wordmarkWidth = wordmarkHeight * (941 / 131);

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/versecue-icon.png"
        alt=""
        width={iconSize * (777 / 560)}
        height={iconSize}
        priority
        className="shrink-0"
      />
      <Image
        src="/versecue-wordmark-dark.png"
        alt="VerseCue"
        width={wordmarkWidth}
        height={wordmarkHeight}
        priority
        className="shrink-0"
      />
    </span>
  );
}

/**
 * Airis IT Consult's wordmark uses dark text, so it needs a light
 * surface behind it on this dark theme. Wrapped in a small rounded
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
