// Contact.jsx + Footer.jsx
function BsContact({ onSubmit }) {
  const [state, setState] = React.useState({ name: '', email: '', msg: '', service: 'WeChat mini-program' });
  const [sent, setSent] = React.useState(false);
  const update = (k) => (e) => setState({ ...state, [k]: e.target.value });
  const submit = (e) => { e.preventDefault(); setSent(true); onSubmit?.(state); };

  return (
    <section className="bs-contact" id="contact">
      <div className="bs-section__inner bs-contact__grid">
        <div>
          <span className="bs-eyebrow">Get in touch</span>
          <h2>Let's<br/><em>talk.</em></h2>
          <p className="bs-lead">
            Whether you need project consultation, technical support, or business cooperation,
            we are here to serve you wholeheartedly.
          </p>
          <ul className="bs-contact__offices">
            <li><strong>Guangzhou</strong><span>Room 1302, Guangzhou Ocean Plaza, Huacheng Avenue, Tianhe</span></li>
            <li><strong>Hong Kong</strong><span>Room 720, Star House, 3 Salisbury Road, Tsim Sha Tsui</span></li>
            <li><strong>Tokyo</strong><span>〒151-0051 渋谷区千駄ヶ谷 5-15-6 Vort代々木 11F</span></li>
          </ul>
          <div className="bs-contact__direct">
            <div><span className="bs-contact__label">Email</span><a href="mailto:hi@beansmile.com">hi@beansmile.com</a></div>
            <div><span className="bs-contact__label">Phone</span><a href="tel:02034240810">020-34240810</a></div>
          </div>
        </div>
        <form className="bs-contact__form" onSubmit={submit}>
          {sent ? (
            <div className="bs-contact__sent">
              <div className="bs-contact__check">✓</div>
              <h3>Thanks, {state.name || 'friend'}.</h3>
              <p>We'll reply within 1 business day — usually sooner.</p>
              <button type="button" className="bs-btn bs-btn--outline bs-btn--sm" onClick={() => { setSent(false); setState({ name:'', email:'', msg:'', service:'WeChat mini-program' }); }}>Send another</button>
            </div>
          ) : (
            <>
              <h3>Start a conversation</h3>
              <label><span>Your name</span><input required value={state.name} onChange={update('name')} placeholder="Zhang Wei" /></label>
              <label><span>Work email</span><input required type="email" value={state.email} onChange={update('email')} placeholder="you@company.com" /></label>
              <label><span>Service</span>
                <select value={state.service} onChange={update('service')}>
                  <option>WeChat mini-program</option>
                  <option>Shopify solution</option>
                  <option>Mobile app (iOS / Android)</option>
                  <option>AI-driven project</option>
                  <option>Something else</option>
                </select>
              </label>
              <label><span>How can we help?</span><textarea rows={4} value={state.msg} onChange={update('msg')} placeholder="Tell us about the project, timeline, and markets you're targeting." /></label>
              <button type="submit" className="bs-btn bs-btn--primary">Send message <span className="bs-arrow">→</span></button>
            </>
          )}
        </form>
      </div>
    </section>
  );
}

function BsFooter() {
  return (
    <footer className="bs-footer">
      <div className="bs-section__inner bs-footer__inner">
        <div className="bs-footer__brand">
          <img src={(window.__resources && window.__resources.wordmarkWhite) || "../../assets/beansmile-wordmark-white.png"} alt="Beansmile" />
          <p>Deliver the best. — Since 2015.</p>
        </div>
        <div className="bs-footer__cols">
          <div><h5>Portfolio</h5><a>E-commerce Engine</a><a>Overseas Projects</a><a>Shopify Solutions</a><a>AI era</a><a>WeChatHub</a></div>
          <div><h5>Publication</h5><a>Blog</a><a>Books</a><a>WeChat account</a></div>
          <div><h5>Offices</h5><a>Guangzhou</a><a>Hong Kong</a><a>Tokyo</a></div>
          <div><h5>Contact</h5><a>hi@beansmile.com</a><a>020-34240810</a></div>
        </div>
      </div>
      <div className="bs-footer__legal">
        <span>© 2026 Beansmile Co., Ltd. All rights reserved.</span>
        <span>粤ICP备15040562号-13</span>
      </div>
    </footer>
  );
}

Object.assign(window, { BsContact, BsFooter });
