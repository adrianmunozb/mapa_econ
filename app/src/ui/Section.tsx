import { useState, type ReactNode } from 'react';

interface SectionProps {
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** Generic collapsible panel group — same toggle/chevron pattern as RankingList. */
export function Section({ title, badge, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section">
      <button type="button" className="section__toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="section__title">{title}</span>
        {badge && <span className="section__badge">{badge}</span>}
        <span className={`chev${open ? ' chev--open' : ''}`}>▾</span>
      </button>
      {open && <div className="section__body">{children}</div>}
    </div>
  );
}
