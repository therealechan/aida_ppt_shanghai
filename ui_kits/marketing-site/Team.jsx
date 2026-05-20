// Team.jsx & Stats.jsx combined
function BsTeam() {
  const pillars = [
    { title: 'Experienced experts',
      body: 'Over a decade specializing in tech solutions for entering the Chinese market — WeChat official accounts, mini-programs, enterprise platforms.' },
    { title: 'Full-stack developers',
      body: 'Bespoke iOS, Android, and Web services backed by an international design team experienced with global brands.' },
    { title: 'Professional marketing team',
      body: 'Well-versed in the Chinese market. Strategies that are effective, culturally relevant, and measurable.' },
  ];
  return (
    <section className="bs-team">
      <div className="bs-section__inner">
        <span className="bs-eyebrow">Team Beansmile</span>
        <h2>Ten years,<br/>one <em>standard.</em></h2>
        <div className="bs-team__grid">
          {pillars.map((p) => (
            <div key={p.title} className="bs-team__cell">
              <div className="bs-team__num">{String(pillars.indexOf(p) + 1).padStart(2, '0')}</div>
              <h4>{p.title}</h4>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BsStats() {
  const stats = [
    { n: '200', suffix: '+', label: 'Projects Completed' },
    { n: '100', suffix: '+', label: 'Clients' },
    { n: '10', suffix: '+', label: 'Countries' },
  ];
  return (
    <section className="bs-stats">
      <div className="bs-section__inner">
        <h2 className="bs-stats__title">A decade<br/>of delivery.</h2>
        <div className="bs-stats__row">
          {stats.map((s) => (
            <div key={s.label} className="bs-stats__cell">
              <div className="bs-stats__num">{s.n}<span>{s.suffix}</span></div>
              <div className="bs-stats__label">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="bs-stats__sponsors">
          <span className="bs-eyebrow">Community support &amp; sponsorships</span>
          <div className="bs-stats__sponsorRow">
            <div className="bs-stats__sponsor"><strong>Ruby Conference</strong><span>Active sponsor since 2016</span></div>
            <div className="bs-stats__sponsor"><strong>Vue Community</strong><span>Ongoing community sponsor</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { BsTeam, BsStats });
