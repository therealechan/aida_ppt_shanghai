// Hero.jsx — "Deliver the best." hero
function BsHero() {
  return (
    <section className="bs-hero">
      <div className="bs-hero__inner">
        <div className="bs-hero__text">
          <div className="bs-hero__eyebrowRow">
            <span className="bs-hero__dotBadge" />
            <span className="bs-eyebrow">Beansmile · Since 2015</span>
          </div>
          <h1 className="bs-hero__title">Deliver<br/>the <em>best.</em></h1>
          <p className="bs-hero__lead">
            Tech solutions for entering the Chinese market — WeChat Mini-programs,
            Web, Mobile Apps, and AI-driven projects.
          </p>
          <div className="bs-hero__actions">
            <a href="mailto:hi@beansmile.com" className="bs-btn bs-btn--green">
              Let's Talk <span className="bs-arrow">→</span>
            </a>
            <a href="#work" className="bs-btn bs-btn--outline">See our work</a>
          </div>
          <div className="bs-hero__stamps">
            <span>WeChat Certified</span>
            <span className="bs-hero__dot" />
            <span>Shopify Partner</span>
            <span className="bs-hero__dot" />
            <span>Ruby &amp; Vue Sponsor</span>
          </div>
        </div>
        <div className="bs-hero__visual">
          <div className="bs-hero__block">
            <div className="bs-hero__blockTag">Ten-Year Track Record</div>
            <div>
              <div className="bs-hero__blockBig">200<span>+</span></div>
              <div className="bs-hero__blockLabel">Projects delivered for 100+ clients across 10+ countries.</div>
            </div>
            <div className="bs-hero__blockFoot">
              <small>广州 · 香港 · 東京</small>
              <small>→</small>
            </div>
          </div>
        </div>
      </div>
      <div className="bs-hero__ticker">
        <div className="bs-hero__tickerRow">
          <span>WeChat Mini-Program</span><i>◆</i>
          <span>Shopify Solutions</span><i>◆</i>
          <span>iOS / Android</span><i>◆</i>
          <span>AI Engineering</span><i>◆</i>
          <span>E-commerce Engine</span><i>◆</i>
          <span>Overseas Rollouts</span><i>◆</i>
          <span>WeChat Mini-Program</span><i>◆</i>
          <span>Shopify Solutions</span><i>◆</i>
          <span>iOS / Android</span><i>◆</i>
          <span>AI Engineering</span><i>◆</i>
          <span>E-commerce Engine</span><i>◆</i>
          <span>Overseas Rollouts</span><i>◆</i>
        </div>
      </div>
    </section>
  );
}
Object.assign(window, { BsHero });
