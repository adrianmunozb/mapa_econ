/** Meridiano's mark: a globe with its parallels and one highlighted meridian, plus the name. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg className="logo__mark" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="21" fill="#0f1d48" stroke="#aab7da" strokeWidth="2" />
      <path d="M5 24h38M8.5 13.5h31M8.5 34.5h31" stroke="#5a76c2" strokeWidth="1.6" fill="none" />
      <ellipse cx="24" cy="24" rx="9" ry="21" stroke="#5a76c2" strokeWidth="1.6" fill="none" />
      <path d="M24 3v42" stroke="#ffc933" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="24" cy="24" r="3.4" fill="#ffc933" />
    </svg>
  );
}

export function Logo({ size = 32, subtitle }: { size?: number; subtitle?: string }) {
  return (
    <span className="logo" style={{ ['--logo-size' as string]: `${size}px` }}>
      <LogoMark size={size} />
      <span className="logo__text">
        <span className="logo__name">Meridiano</span>
        {subtitle && <span className="logo__sub">{subtitle}</span>}
      </span>
    </span>
  );
}
