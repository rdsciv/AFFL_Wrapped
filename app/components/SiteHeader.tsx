import Link from "next/link";
import { Mark } from "./Mark";

export function SiteHeader({ season }: { season?: number }) {
  return (
    <header className="site-header">
      <Link href="/" className="brand-link">
        <Mark compact />
        <span>League history</span>
      </Link>
      <nav className="header-nav" aria-label="Primary navigation">
        <Link href="/">Annuals</Link>
        <Link href="/transactions">Transactions</Link>
      </nav>
      <div className="header-meta">
        <span>Est. 2014</span>
        {season ? <span>{season} Annual</span> : <span>12 Seasons</span>}
      </div>
    </header>
  );
}
