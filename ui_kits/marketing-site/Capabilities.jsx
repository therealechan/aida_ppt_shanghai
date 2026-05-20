// Capabilities.jsx — the 6-card grid
function BsCapabilityCard({ title, blurb, tags, num, onOpen }) {
  return (
    <article className="bs-cap" onClick={onOpen}>
      <div className="bs-cap__num">{num}</div>
      <h3 className="bs-cap__title">{title}</h3>
      <p className="bs-cap__blurb">{blurb}</p>
      <ul className="bs-cap__tags">
        {tags.map((t) => <li key={t}>{t}</li>)}
      </ul>
      <a className="bs-cap__more" onClick={(e) => { e.preventDefault(); onOpen?.(); }} href="#">
        Learn More →
      </a>
    </article>
  );
}

function BsCapabilities({ onOpen }) {
  const caps = [
    { title: 'E-commerce Engine', num: '01',
      blurb: 'APP + mini-program + web, one integrated stack. Deployed by NBA, Mead Johnson, Dettol, Durex for rapid go-to-market.',
      tags: ['Modularity', 'Scalability', 'Compliance'] },
    { title: 'Overseas Projects', num: '02',
      blurb: 'Professional solutions and operational support for a global clientele — adapted to local markets and compliance.',
      tags: ['Cross-Cultural', 'Integration', 'Regulatory'] },
    { title: 'Shopify Solutions', num: '03',
      blurb: 'Certified Shopify partner. Theme customization, app ecosystem integration, end-to-end rollouts for brands going global.',
      tags: ['Partner Verified', 'Custom Theme', 'Marketplace'] },
    { title: 'AI Era', num: '04',
      blurb: "Smart tools and bespoke AI solutions. Evidenced by advanced products like LOOKyahAI and agentic workflows for clients.",
      tags: ['Frontier Models', 'Agentic', 'AI Team'] },
    { title: 'Full Industry', num: '05',
      blurb: 'Expertise across social, finance, education, transportation, and auctions — informed by deep industry insight.',
      tags: ['Diverse', 'Quality', 'Informed'] },
    { title: 'WeChatHub', num: '06',
      blurb: 'Revolutionizing overseas ticketing for Chinese tourists. Lightweight display + unified API + data sync.',
      tags: ['Display', 'API Gateway', 'Data Sync'] },
  ];
  return (
    <section className="bs-caps" id="work">
      <div className="bs-section__inner">
        <div className="bs-caps__head">
          <span className="bs-eyebrow bs-eyebrow--light">What we can do for you</span>
          <h2>Built for brands<br/>entering <em>China.</em></h2>
          <p>As WeChat certified partner, we offer comprehensive services along with iOS, Android, and Web apps — designed by international artists, shipped by engineers who know the market.</p>
        </div>
        <div className="bs-caps__grid">
          {caps.map((c) => (
            <BsCapabilityCard key={c.title} {...c} onOpen={() => onOpen?.(c.title)} />
          ))}
        </div>
      </div>
    </section>
  );
}
Object.assign(window, { BsCapabilities, BsCapabilityCard });
