/*
 * Guest Stories island for bridget-uganda.github.io
 * Self-contained vanilla JS module that injects a "Guest Stories" section
 * into the React-rendered SPA after the "My tour adventures" block.
 *
 * Data source : ./testimonials.json   (array of testimonial objects)
 * Submit form : Formspree (same endpoint as the contact form)
 *
 * Testimonial schema (testimonials.json):
 *   {
 *     "name":      "Anna",
 *     "country":   "Germany",
 *     "flag":      "🇩🇪",            // optional emoji
 *     "rating":    5,                // 1-5
 *     "tourType":  "Bwindi Gorilla Trek",
 *     "tourDate":  "Aug 2025",
 *     "text":      "Bridget turned our safari into the most unforgettable trip of our lives.",
 *     "verified":  true              // optional badge
 *   }
 */
(function () {
  'use strict';

  // ============================================================
  //  PASTE YOUR APPS SCRIPT WEB APP URL HERE (ends with /exec)
  //  See apps-script/Code.gs for the one-time setup steps.
  // ============================================================
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxqlYPANgFiRBMQtYULkqNO_ZesqLUJOck8xTk6g7fwuh27_Fw3AA-KNdT51_IupaB8/exec';

  const SECTION_ID = 'guest-stories';
  const STYLE_ID   = 'guest-stories-styles';
  const PROMO_ID   = 'gs-promo-banner';
  const REVIEWS_URL = 'reviews.html';

  // mountConfig is overwritten in boot() depending on context:
  //   - About me embed:  { limit: 3, seeAllUrl: 'reviews.html' }
  //   - standalone /reviews.html: { limit: null, seeAllUrl: null }
  let mountConfig = { limit: 3, seeAllUrl: REVIEWS_URL };

  // --------------------------------------------------------------------------
  // Styles — scoped via .gs- prefix, reuses Tailwind CSS vars from the main bundle
  // --------------------------------------------------------------------------
  const CSS = `
.gs-section{padding:5rem 1rem;background:hsl(var(--background));color:hsl(var(--foreground));font-family:Montserrat,sans-serif}
.gs-container{max-width:1200px;margin:0 auto}
.gs-head{display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;margin-bottom:2.5rem;padding-bottom:1.5rem;border-bottom:1px solid hsl(var(--border))}
.gs-head-text{flex:1 1 auto;min-width:0}
.gs-title{font-family:"Playfair Display",serif;font-size:clamp(1.5rem,3vw,2rem);line-height:1.15;margin:0;font-weight:500;color:hsl(var(--foreground))}
.gs-stats{display:flex;align-items:center;gap:.5rem;margin:.5rem 0 0;font-size:.95rem;color:hsl(var(--muted-foreground))}
.gs-stats-stars{color:hsl(var(--primary));letter-spacing:.1em;font-size:1rem}
.gs-stats-num{font-weight:600;color:hsl(var(--foreground))}
.gs-head .gs-btn{flex:0 0 auto;padding:.7rem 1.4rem;font-size:.9rem}
@media (max-width:520px){.gs-head{flex-direction:column;align-items:flex-start}.gs-head .gs-btn{width:100%;justify-content:center}}
.gs-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:2.5rem 2rem;margin-top:3rem}
.gs-card{position:relative;flex:0 1 320px;max-width:340px;background:hsl(var(--card));padding:1.5rem 1.5rem 1.4rem;box-shadow:0 14px 30px -10px rgba(0,0,0,.18),0 4px 8px -4px rgba(0,0,0,.06);border-radius:18px;transform:rotate(-1.2deg);transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s}
.gs-card:nth-child(3n+2){transform:rotate(1.4deg)}
.gs-card:nth-child(3n+3){transform:rotate(-.4deg)}
.gs-card:hover{transform:rotate(0) translateY(-6px);box-shadow:0 22px 40px -12px rgba(0,0,0,.22),0 6px 12px -4px rgba(0,0,0,.08)}
.gs-rating{color:hsl(var(--primary));letter-spacing:.18em;font-size:1.1rem;margin-bottom:.75rem}
.gs-quote{font-family:"Playfair Display",serif;font-style:italic;font-size:1.2rem;line-height:1.5;margin:0 0 1.25rem;color:hsl(var(--foreground))}
.gs-meta{border-top:1px solid hsl(var(--border));padding-top:1rem;margin-top:.5rem}
.gs-name{font-weight:600;font-size:1.02rem;color:hsl(var(--foreground))}
.gs-tour{color:hsl(var(--muted-foreground));font-size:.85rem;margin-top:.25rem}
.gs-badge{display:inline-block;font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:hsl(var(--accent));background:hsl(var(--accent)/.08);padding:.15rem .45rem;border-radius:99px;margin-left:.4rem;vertical-align:middle;font-weight:600}
.gs-empty{margin-top:1rem;text-align:center;padding:3rem 1.5rem;border:2px dashed hsl(var(--border));border-radius:18px;background:hsl(var(--card));max-width:560px;margin-left:auto;margin-right:auto}
.gs-empty-icon{font-size:2.4rem;margin-bottom:1rem;opacity:.8}
.gs-empty-title{font-family:"Playfair Display",serif;font-size:1.4rem;font-weight:500;margin:0 0 .5rem;color:hsl(var(--foreground))}
.gs-empty-text{color:hsl(var(--muted-foreground));font-size:.95rem;line-height:1.55;margin:0 auto 1.5rem;max-width:420px}
.gs-btn{display:inline-flex;align-items:center;gap:.5rem;background:hsl(var(--primary));color:hsl(var(--primary-foreground));border:none;padding:.9rem 1.85rem;font-family:inherit;font-weight:600;font-size:.95rem;border-radius:9999px;cursor:pointer;transition:background .2s,transform .2s,box-shadow .2s;box-shadow:0 4px 12px -4px hsla(25,90%,50%,.45)}
.gs-btn:hover{background:hsl(25 90% 45%);transform:translateY(-1px);box-shadow:0 8px 18px -6px hsla(25,90%,50%,.55)}
.gs-btn:active{transform:translateY(0)}
@media (max-width:640px){
 .gs-section{padding:3.5rem 1rem}
 .gs-grid{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:1.25rem;padding:1rem 1rem 1.5rem;margin:2rem -1rem 0;scrollbar-width:none}
 .gs-grid::-webkit-scrollbar{display:none}
 .gs-card{flex:0 0 78%;scroll-snap-align:center}
}
.gs-backdrop{position:fixed;inset:0;background:rgba(20,12,5,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem;opacity:0;pointer-events:none;transition:opacity .25s}
.gs-backdrop.gs-open{opacity:1;pointer-events:auto}
.gs-modal{background:hsl(var(--card));max-width:480px;width:100%;max-height:92vh;overflow-y:auto;border-radius:14px;padding:2rem 1.75rem;position:relative;transform:translateY(8px) scale(.98);transition:transform .25s cubic-bezier(.2,.8,.2,1);font-family:Montserrat,sans-serif;color:hsl(var(--foreground))}
.gs-backdrop.gs-open .gs-modal{transform:translateY(0) scale(1)}
.gs-close{position:absolute;top:.85rem;right:.85rem;width:32px;height:32px;border-radius:99px;background:transparent;border:none;font-size:1.4rem;line-height:1;cursor:pointer;color:hsl(var(--muted-foreground));display:flex;align-items:center;justify-content:center}
.gs-close:hover{background:hsl(var(--muted));color:hsl(var(--foreground))}
.gs-modal h3{font-family:"Playfair Display",serif;font-size:1.5rem;font-weight:500;margin:0 0 .35rem;color:hsl(var(--foreground))}
.gs-modal p.gs-modal-sub{color:hsl(var(--muted-foreground));margin:0 0 1.5rem;font-size:.9rem;line-height:1.5}
.gs-field{display:flex;flex-direction:column;gap:.35rem;margin-bottom:.95rem}
.gs-field label{font-size:.78rem;font-weight:500;color:hsl(var(--muted-foreground));letter-spacing:.02em}
.gs-field input,.gs-field textarea,.gs-field select{font-family:inherit;font-size:.95rem;padding:.65rem .8rem;border:1px solid hsl(var(--border));border-radius:8px;background:hsl(var(--background));color:hsl(var(--foreground));outline:none;transition:border-color .15s,box-shadow .15s;width:100%;box-sizing:border-box}
.gs-field textarea{resize:vertical;min-height:96px;font-family:inherit}
.gs-field input:focus,.gs-field textarea:focus,.gs-field select:focus{border-color:hsl(var(--primary));box-shadow:0 0 0 3px hsla(25,90%,50%,.18)}
.gs-row{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}
.gs-stars{display:flex;gap:.25rem;align-self:flex-start;padding:.15rem 0}
.gs-stars button{background:transparent;border:none;font-size:1.7rem;line-height:1;color:hsl(var(--border));cursor:pointer;padding:.1rem;transition:color .12s,transform .12s}
.gs-stars button.gs-on{color:hsl(var(--primary))}
.gs-stars:hover button{color:hsl(var(--primary))}
.gs-stars button:hover ~ button{color:hsl(var(--border))}
.gs-stars button:hover{transform:scale(1.1)}
.gs-consent{display:flex;align-items:flex-start;gap:.55rem;font-size:.82rem;color:hsl(var(--muted-foreground));line-height:1.45;margin:.25rem 0 1.25rem}
.gs-consent input{margin-top:.2rem;accent-color:hsl(var(--primary))}
.gs-submit{width:100%;justify-content:center;margin-top:.25rem}
.gs-submit[disabled]{opacity:.7;cursor:wait}
.gs-msg{margin:1rem 0 0;padding:.85rem 1rem;border-radius:8px;font-size:.9rem;line-height:1.45}
.gs-msg.gs-ok{background:hsl(150 40% 94%);color:hsl(150 45% 22%);border:1px solid hsl(150 40% 80%)}
.gs-msg.gs-err{background:hsl(0 55% 95%);color:hsl(0 55% 30%);border:1px solid hsl(0 55% 85%)}
.gs-seeall{text-align:center;margin-top:2.5rem}
.gs-link{display:inline-block;color:hsl(var(--primary));text-decoration:none;font-weight:600;font-size:.95rem;padding:.4rem 0;border-bottom:2px solid currentColor;transition:color .15s}
.gs-link:hover{color:hsl(25 90% 40%)}
.gs-promo{background:hsl(var(--card));border-top:1px solid hsl(var(--border));border-bottom:1px solid hsl(var(--border));padding:.85rem 1rem;font-family:Montserrat,sans-serif}
.gs-promo-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:.75rem 1rem;flex-wrap:wrap;font-size:.92rem;color:hsl(var(--foreground))}
.gs-promo-text{display:inline-flex;align-items:center;gap:.5rem}
.gs-promo-stars{color:hsl(var(--primary));letter-spacing:.1em}
.gs-promo-link{color:hsl(var(--primary));font-weight:600;text-decoration:none}
.gs-promo-link:hover{text-decoration:underline}
`;

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]
  ));

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // Find the rendered "Meet your local guide" section. We insert OUR section
  // directly before it, so the order becomes:
  //   Tour adventures → Guest Stories → Meet your local guide
  function findAnchor() {
    const headings = document.querySelectorAll('h1, h2, h3');
    for (const h of headings) {
      const t = (h.textContent || '').trim();
      if (/^Meet your local guide/i.test(t)) {
        let el = h;
        while (el && el.tagName !== 'SECTION' && el.parentElement) el = el.parentElement;
        if (el && el.tagName === 'SECTION') return el;
      }
    }
    // Fallback: insert after "My tour adventures" section if "Meet" isn't found
    for (const h of headings) {
      const t = (h.textContent || '').trim();
      if (/^My tour adventures/i.test(t)) {
        let el = h;
        while (el && el.tagName !== 'SECTION' && el.parentElement) el = el.parentElement;
        if (el && el.tagName === 'SECTION' && el.nextElementSibling) {
          return el.nextElementSibling;
        }
      }
    }
    return null;
  }

  // --------------------------------------------------------------------------
  // Section building
  // --------------------------------------------------------------------------
  function buildSection() {
    const section = document.createElement('section');
    section.id = SECTION_ID;
    section.className = 'gs-section';
    section.innerHTML = `
      <div class="gs-container">
        <header class="gs-head">
          <div class="gs-head-text">
            <h2 class="gs-title">Customer Reviews for Bridget</h2>
            <p class="gs-stats" hidden></p>
          </div>
          <button type="button" class="gs-btn" data-action="open">Write a review</button>
        </header>
        <div class="gs-body" data-state="loading"></div>
      </div>
    `;
    section.querySelector('[data-action="open"]').addEventListener('click', openModal);
    return section;
  }

  function renderCards(list) {
    const body = document.querySelector('#' + SECTION_ID + ' .gs-body');
    if (!body) return;

    const stats = document.querySelector('#' + SECTION_ID + ' .gs-stats');

    if (!Array.isArray(list) || list.length === 0) {
      if (stats) stats.hidden = true;
      body.dataset.state = 'empty';
      body.innerHTML = `
        <div class="gs-empty">
          <h3 class="gs-empty-title">No reviews yet</h3>
          <p class="gs-empty-text">Travelled with Bridget? Be the first to share your experience.</p>
        </div>
      `;
      return;
    }

    if (stats) {
      const avg = list.reduce((s, t) => s + (Number(t.rating) || 0), 0) / list.length;
      const avgRounded = Math.round(avg);
      const avgStars = '★'.repeat(avgRounded) + '☆'.repeat(5 - avgRounded);
      const word = list.length === 1 ? 'review' : 'reviews';
      stats.innerHTML =
        `<span class="gs-stats-stars">${avgStars}</span>` +
        `<span class="gs-stats-num">${avg.toFixed(1)}</span>` +
        `<span class="gs-stats-count">· ${list.length} ${word}</span>`;
      stats.hidden = false;
    }

    body.dataset.state = 'filled';
    const visible = mountConfig.limit ? list.slice(0, mountConfig.limit) : list;
    const cards = visible.map(t => {
      const rating = Math.max(0, Math.min(5, Number(t.rating) || 0));
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      const flagCountry = [t.flag, t.country].filter(Boolean).join(' ');
      const tourLine = [flagCountry, t.tourType, t.tourDate]
        .filter(Boolean).map(esc).join(' · ');
      const verified = t.verified
        ? `<span class="gs-badge">Verified</span>` : '';
      return `
        <article class="gs-card">
          <div class="gs-rating" aria-label="${rating} out of 5">${stars}</div>
          <p class="gs-quote">“${esc(t.text || '')}”</p>
          <div class="gs-meta">
            <div class="gs-name">${esc(t.name || 'Guest')}${verified}</div>
            <div class="gs-tour">${tourLine}</div>
          </div>
        </article>
      `;
    }).join('');
    const seeAll = (mountConfig.seeAllUrl && list.length > visible.length)
      ? `<div class="gs-seeall"><a class="gs-link" href="${mountConfig.seeAllUrl}">See all ${list.length} reviews →</a></div>`
      : '';
    body.innerHTML = `<div class="gs-grid">${cards}</div>${seeAll}`;
  }

  function loadAndRender() {
    if (!APPS_SCRIPT_URL) { renderCards([]); return; }
    fetch(APPS_SCRIPT_URL, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then(list => renderCards(Array.isArray(list) ? list : []))
      .catch(() => renderCards([]));
  }

  // --------------------------------------------------------------------------
  // Modal + form
  // --------------------------------------------------------------------------
  let modalEl = null;
  let currentRating = 5;

  function buildModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.className = 'gs-backdrop';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.innerHTML = `
      <div class="gs-modal" role="document">
        <button type="button" class="gs-close" aria-label="Close" data-action="close">×</button>
        <h3>Submit a review</h3>
        <p class="gs-modal-sub">Share your experience with Bridget so other travellers know what to expect. Your review will appear on the site shortly.</p>
        <form class="gs-form" novalidate>
          <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px">

          <div class="gs-field">
            <label for="gs-name">Your name</label>
            <input id="gs-name" name="name" type="text" required maxlength="80" placeholder="Anna" />
          </div>

          <div class="gs-row">
            <div class="gs-field">
              <label for="gs-country">Country</label>
              <input id="gs-country" name="country" type="text" maxlength="60" placeholder="Germany" />
            </div>
            <div class="gs-field">
              <label for="gs-email">Email (not shown)</label>
              <input id="gs-email" name="email" type="email" required maxlength="120" placeholder="you@example.com" />
            </div>
          </div>

          <div class="gs-row">
            <div class="gs-field">
              <label for="gs-tour">Tour</label>
              <select id="gs-tour" name="tour_type">
                <option value="">— select —</option>
                <option>Uganda Safari</option>
                <option>Rwanda Culture & Gorillas</option>
                <option>Kenya & Tanzania</option>
                <option>Mixed East Africa</option>
                <option>Other</option>
              </select>
            </div>
            <div class="gs-field">
              <label for="gs-date">When (month/year)</label>
              <input id="gs-date" name="tour_date" type="text" maxlength="40" placeholder="Aug 2025" />
            </div>
          </div>

          <div class="gs-field">
            <label>Rating</label>
            <div class="gs-stars" data-rating="5">
              <button type="button" data-v="1" class="gs-on" aria-label="1 star">★</button>
              <button type="button" data-v="2" class="gs-on" aria-label="2 stars">★</button>
              <button type="button" data-v="3" class="gs-on" aria-label="3 stars">★</button>
              <button type="button" data-v="4" class="gs-on" aria-label="4 stars">★</button>
              <button type="button" data-v="5" class="gs-on" aria-label="5 stars">★</button>
            </div>
            <input type="hidden" name="rating" value="5">
          </div>

          <div class="gs-field">
            <label for="gs-story">Your review</label>
            <textarea id="gs-story" name="text" required minlength="20" maxlength="800" placeholder="What moment will you remember most?"></textarea>
          </div>

          <label class="gs-consent">
            <input type="checkbox" name="consent" required>
            <span>I'm OK with Bridget publishing my first name, country and story on the site. Email stays private.</span>
          </label>

          <button type="submit" class="gs-btn gs-submit">Submit review</button>
          <div class="gs-msg" hidden></div>
        </form>
      </div>
    `;
    document.body.appendChild(modalEl);

    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl || e.target.closest('[data-action="close"]')) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalEl.classList.contains('gs-open')) closeModal();
    });

    // Star rating: clicking star N fills 1..N
    const stars = modalEl.querySelector('.gs-stars');
    const ratingInput = modalEl.querySelector('input[name="rating"]');
    stars.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-v]');
      if (!btn) return;
      const v = Number(btn.dataset.v);
      currentRating = v;
      ratingInput.value = String(v);
      stars.querySelectorAll('button').forEach(b => {
        b.classList.toggle('gs-on', Number(b.dataset.v) <= v);
      });
    });

    modalEl.querySelector('.gs-form').addEventListener('submit', handleSubmit);
    return modalEl;
  }

  function openModal() {
    buildModal();
    modalEl.classList.add('gs-open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const f = modalEl.querySelector('#gs-name');
      if (f) f.focus();
    }, 80);
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('gs-open');
    document.body.style.overflow = '';
  }

  function showMsg(form, kind, text) {
    const m = form.querySelector('.gs-msg');
    m.hidden = false;
    m.className = 'gs-msg gs-' + (kind === 'ok' ? 'ok' : 'err');
    m.textContent = text;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    if (form._gotcha && form._gotcha.value) return;     // honeypot
    if (!form.checkValidity()) { form.reportValidity(); return; }

    if (!APPS_SCRIPT_URL) {
      showMsg(form, 'err', 'Submissions are not configured yet. Please email bridget directly.');
      return;
    }

    const submit = form.querySelector('.gs-submit');
    submit.disabled = true;
    submit.textContent = 'Sending…';

    const data = new FormData(form);
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: data    // no headers => simple request, no CORS preflight
    })
    .then(r => r.json().catch(() => ({ error: 'bad_response' })))
    .then(res => {
      if (res && res.error) {
        showMsg(form, 'err', String(res.error));
        submit.textContent = 'Submit review';
        submit.disabled = false;
        return;
      }
      form.reset();
      currentRating = 5;
      showMsg(form, 'ok', 'Thank you! Your review is now live on the site.');
      submit.textContent = 'Submitted ✓';
      loadAndRender();   // refresh the wall so the new card shows up
      setTimeout(closeModal, 1800);
    })
    .catch(() => {
      showMsg(form, 'err', "Sorry — couldn't send right now. Please try again in a minute.");
      submit.textContent = 'Submit review';
      submit.disabled = false;
    });
  }

  // --------------------------------------------------------------------------
  // Promo banner — "Read what travellers are saying about Bridget" link to /reviews.
  // Injected at the top of the SPA's main view (after the hero <section>).
  // --------------------------------------------------------------------------
  let promoStats = { count: 0, avg: 0 };
  function buildPromoMarkup() {
    const c = promoStats.count;
    const avg = promoStats.avg;
    if (!c) {
      return `
        <div class="gs-promo-inner">
          <span class="gs-promo-text">Read what travellers are saying about Bridget</span>
          <a href="${REVIEWS_URL}" class="gs-promo-link">See reviews →</a>
        </div>`;
    }
    const avgRounded = Math.round(avg);
    const stars = '★'.repeat(avgRounded) + '☆'.repeat(5 - avgRounded);
    const word = c === 1 ? 'review' : 'reviews';
    return `
      <div class="gs-promo-inner">
        <span class="gs-promo-text">
          <span class="gs-promo-stars">${stars}</span>
          <span><strong>${avg.toFixed(1)}</strong> from ${c} ${word}</span>
        </span>
        <a href="${REVIEWS_URL}" class="gs-promo-link">Read what travellers are saying →</a>
      </div>`;
  }
  function ensurePromoBanner() {
    if (document.getElementById('guest-stories-mount')) return; // skip on /reviews
    let banner = document.getElementById(PROMO_ID);
    const newHTML = buildPromoMarkup();
    if (!banner) {
      const root = document.getElementById('root');
      if (!root) return;
      const firstSection = root.querySelector('section');
      if (!firstSection || !firstSection.parentNode) return;
      banner = document.createElement('div');
      banner.id = PROMO_ID;
      banner.className = 'gs-promo';
      banner.innerHTML = newHTML;
      firstSection.parentNode.insertBefore(banner, firstSection.nextSibling);
    } else if (banner.innerHTML !== newHTML) {
      // only write if content actually changed — avoids feedback loop with MutationObserver
      banner.innerHTML = newHTML;
    }
  }

  // --------------------------------------------------------------------------
  // Boot
  // --------------------------------------------------------------------------
  function tryInsert() {
    if (document.getElementById(SECTION_ID)) return true;
    const anchor = findAnchor();
    if (!anchor || !anchor.parentNode) return false;
    injectStyles();
    const section = buildSection();
    anchor.parentNode.insertBefore(section, anchor);
    loadAndRender();
    return true;
  }

  // Fetch stats once for the promo banner (independent of section being mounted)
  function loadPromoStats() {
    if (!APPS_SCRIPT_URL) return;
    fetch(APPS_SCRIPT_URL, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then(list => {
        if (!Array.isArray(list) || list.length === 0) return;
        const avg = list.reduce((s, t) => s + (Number(t.rating) || 0), 0) / list.length;
        promoStats = { count: list.length, avg };
        ensurePromoBanner();
      })
      .catch(() => {});
  }

  function boot() {
    // Standalone page mode: a host element exists, mount full list directly.
    const explicitMount = document.getElementById('guest-stories-mount');
    if (explicitMount) {
      mountConfig = { limit: null, seeAllUrl: null };
      injectStyles();
      if (!document.getElementById(SECTION_ID)) {
        const section = buildSection();
        explicitMount.appendChild(section);
        loadAndRender();
      }
      return;
    }

    // SPA mode: inject section on About me + promo banner everywhere else.
    injectStyles();
    ensurePromoBanner();
    loadPromoStats();
    tryInsert();

    // React may re-render — keep section and banner in place across route changes.
    // Important: only react when our elements are MISSING, otherwise we'd loop
    // (DOM write -> observer fires -> DOM write -> ...). Also throttle to rAF.
    let scheduled = false;
    const obs = new MutationObserver(() => {
      if (scheduled) return;
      const promoMissing = !document.getElementById(PROMO_ID);
      const sectionMissing = !document.getElementById(SECTION_ID);
      if (!promoMissing && !sectionMissing) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        if (!document.getElementById(PROMO_ID)) ensurePromoBanner();
        if (!document.getElementById(SECTION_ID)) tryInsert();
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
