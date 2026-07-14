import Link from "next/link";
import { seasons } from "../lib/data";

export function SeasonRail({ active }: { active?: number }) {
  return (
    <nav className="season-rail" aria-label="AFFL seasons">
      <span className="eyebrow">Season archive</span>
      <div className="season-links">
        {seasons.map((season) => (
          <Link
            href={`/wrapped/${season}`}
            key={season}
            aria-current={active === season ? "page" : undefined}
            className={active === season ? "active" : ""}
          >
            {season}
          </Link>
        ))}
      </div>
    </nav>
  );
}
