// Header.jsx — Beansmile marketing header
function BsHeader({ active = 'Home', onNav, scrolled = false }) {
  const links = ['Home', 'Portfolio', 'Publication', 'Community', 'Contact'];
  return (
    <header className={`bs-header ${scrolled ? 'bs-header--scrolled' : ''}`}>
      <div className="bs-header__inner">
        <a className="bs-brand" href="#" onClick={(e) => { e.preventDefault(); onNav?.('Home'); }}>
          <img src={(window.__resources && window.__resources.logoHex) || "../../assets/logo-hex-bean.png"} alt="" className="bs-brand__mark" />
          <span className="bs-brand__word">Beansmile</span>
        </a>
        <nav className="bs-nav">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l}`}
              onClick={(e) => { e.preventDefault(); onNav?.(l); }}
              className={active === l ? 'is-active' : ''}
            >{l}</a>
          ))}
        </nav>
        <div className="bs-header__right">
          <button className="bs-lang">EN <span className="bs-lang__caret">▾</span></button>
          <a href="mailto:hi@beansmile.com" className="bs-btn bs-btn--primary bs-btn--sm">Let's Talk</a>
        </div>
      </div>
    </header>
  );
}
Object.assign(window, { BsHeader });
