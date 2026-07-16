import type { Metadata } from "next";
import { SiteHeader } from "../components/SiteHeader";
import { TransactionExplorer } from "../components/TransactionExplorer";
import { advanced } from "../lib/advanced";

export const metadata: Metadata = {
  title: "AFFL Transaction Lab",
  description: "Every AFFL add, drop, official trade count, inferred player movement, and four-week expected fantasy point estimate.",
};

export default function TransactionsPage() {
  const annuals = Object.values(advanced.seasons).sort((a, b) => a.season - b.season);
  const maxMoves = Math.max(...annuals.map((season) => season.official.adds + season.official.drops + season.official.trades));
  const totals = annuals.reduce((sum, season) => ({
    adds: sum.adds + season.official.adds,
    trades: sum.trades + season.official.trades,
  }), { adds: 0, trades: 0 });

  return (
    <main className="transactions-page">
      <SiteHeader />
      <section className="transactions-hero">
        <div className="reveal">
          <span className="eyebrow">AFFL front office / 2014-2025</span>
          <h1>Every move.<br /><em>Measured.</em></h1>
          <p>Official league counters meet the full ESPN event ledger, with a four-week expected-points model for every covered acquisition.</p>
        </div>
        <div className="transaction-hero-ledger reveal">
          <div><span>Official adds</span><strong>{totals.adds.toLocaleString()}</strong></div>
          <div><span>Official trades</span><strong>{totals.trades.toLocaleString()}</strong></div>
          <div><span>Event detail</span><strong>2018-25</strong></div>
        </div>
      </section>

      <section className="era-section section-pad">
        <div className="section-intro reveal">
          <div className="section-index">01</div>
          <div><span className="eyebrow">Twelve-year market tape</span><h2>The transaction eras</h2><p>Official ESPN team counters are complete for all twelve seasons. The colored bands compare total adds, drops, and reported trades.</p></div>
        </div>
        <div className="era-chart reveal">
          {annuals.map((season) => (
            <div className="era-row" key={season.season}>
              <strong>{season.season}</strong>
              <div className="era-stack">
                <i className="stack-add" style={{ width: `${(season.official.adds / maxMoves) * 100}%` }} />
                <i className="stack-drop" style={{ width: `${(season.official.drops / maxMoves) * 100}%` }} />
                <i className="stack-trade" style={{ width: `${(season.official.trades / maxMoves) * 100}%` }} />
              </div>
              <span>{season.official.adds + season.official.drops + season.official.trades}</span>
            </div>
          ))}
          <div className="chart-legend"><span className="legend-add">Adds</span><span className="legend-drop">Drops</span><span className="legend-trade">Trades</span></div>
        </div>
      </section>

      <section className="ledger-section section-pad" id="ledger">
        <div className="section-intro reveal">
          <div className="section-index">02</div>
          <div><span className="eyebrow">Search the tape</span><h2>The complete ledger</h2><p>Filter every executed add and drop, then compare projected value with actual starter points over the same four-week window.</p></div>
        </div>
        <TransactionExplorer data={advanced} />
      </section>

      <section className="methodology-section section-pad">
        <div><span className="eyebrow">Read this before litigating a trade</span><h2>Method, not mythology.</h2></div>
        <div className="methodology-grid">
          <article><span>01</span><h3>Official counters</h3><p>Add, drop, and trade totals come directly from ESPN&apos;s season-level team records for 2014-2025.</p></article>
          <article><span>02</span><h3>Event ledger</h3><p>Executed add and drop items come from ESPN transaction events for 2018-2025. Event-item totals can differ from season counters because their grains are different.</p></article>
          <article><span>03</span><h3>xFP added</h3><p>{advanced.metric.definition} {advanced.metric.missingness}</p></article>
          <article><span>04</span><h3>Inferred moves</h3><p>ESPN&apos;s retrieved event feed does not expose direct trade events. Roster-to-roster transitions are shown separately at 75% confidence and must not be read as official trades.</p></article>
        </div>
      </section>
    </main>
  );
}
