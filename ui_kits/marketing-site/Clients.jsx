// Clients.jsx — "Trusted by" logo wall
function BsClients() {
  const clients = [
    'Google', 'NBA', 'WeChat', 'Douyin', 'ZEISS', 'VISA', 'SIXT',
    'Mead Johnson', 'Durex', '三只松鼠', 'Calvin Klein', 'Dettol',
    'Volkswagen', 'Flexform', 'Global Express'
  ];
  return (
    <section className="bs-clients">
      <div className="bs-section__inner">
        <span className="bs-eyebrow">Trusted by</span>
        <div className="bs-clients__head">
          <h2 className="bs-clients__title">Brands that<br/>bet <em>big.</em></h2>
          <p className="bs-clients__sub">Global leaders choose Beansmile to launch and scale in China and beyond.</p>
        </div>
        <div className="bs-clients__grid">
          {clients.map((c) => (
            <div key={c} className="bs-clients__tile">{c}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
Object.assign(window, { BsClients });
