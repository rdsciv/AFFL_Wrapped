export function Mark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "mark mark-compact" : "mark"} aria-label="AFFL">
      <span>A</span>
      <span>F</span>
      <span>F</span>
      <span>L</span>
    </span>
  );
}

export function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function TrophyIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M20 8h24v10c0 10-5 17-12 17S20 28 20 18V8Z" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M20 13H9c0 11 4 17 14 17M44 13h11c0 11-4 17-14 17M32 35v11M22 54h20M26 46h12v8" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}
