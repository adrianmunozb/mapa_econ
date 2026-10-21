import { FLAGS } from '../data/flags';

export function Flag({ iso2, className }: { iso2?: string; className?: string }) {
  const src = iso2 && FLAGS[iso2.toLowerCase()];
  const cls = `flag-icon${className ? ` ${className}` : ''}`;
  if (!src) return <span className={`${cls} flag-icon--placeholder`} aria-hidden="true" />;
  return <img className={cls} src={src} alt="" aria-hidden="true" loading="lazy" />;
}
