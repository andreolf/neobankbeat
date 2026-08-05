/* fit-wizard.mjs — stepped assessment UI for /fit/ (HTML + client script strings). */
import { FIT_COUNTRIES, NEEDS_OPTIONS } from './fit-score.mjs';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const FIT_STEP_COUNT = 8;

const FIT_COUNTRY_GROUPS = [
  { label: 'Americas', slugs: ['united-states', 'brazil', 'mexico', 'colombia', 'argentina'] },
  { label: 'Europe', slugs: ['united-kingdom', 'germany', 'france', 'switzerland'] },
  { label: 'Asia & Pacific', slugs: ['india', 'singapore', 'philippines', 'indonesia', 'vietnam', 'australia'] },
  { label: 'Middle East & Africa', slugs: ['uae', 'nigeria'] },
];

const NEED_ICONS = {
  travel: '✈', savings: '◔', crypto: '◇', business: '◫', kids: '◉', immigrants: '⇄',
  faith: '☪', underbanked: '◎', freelancers: '✎', licensed: '⌂',
};

const PROFILE_CARDS = [
  { id: 'personal', icon: '◐', title: 'Personal', sub: 'Everyday money' },
  { id: 'business', icon: '◫', title: 'Business', sub: 'SMB & startups' },
  { id: 'freelancer', icon: '✎', title: 'Freelancer', sub: 'Creators & gig work' },
  { id: 'underbanked', icon: '◎', title: 'Rebuild credit', sub: 'Thin or no file' },
];

const STYLE_CARDS = [
  { id: 'any', cls: '', icon: '◑', title: 'No preference', sub: 'Show me everything' },
  { id: 'traditional', cls: 't', icon: '◐', title: 'Traditional', sub: 'Fiat · custodial · licensed' },
  { id: 'hybrid', cls: 'h', icon: '◑', title: 'Hybrid', sub: 'Fiat + crypto in one app' },
  { id: 'web3-native', cls: 'w', icon: '◍', title: 'Web3-native', sub: 'Self-custodial · on-chain' },
];

export const fitWizardCss = () => `<style>
.fitwizard{margin:22px 0 28px}
.fitmeta{display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-family:var(--mono);font-size:11px;color:var(--dim);margin-bottom:8px;flex-wrap:wrap}
.fitmeta b{color:var(--text);font-weight:600}
.fitprogress{height:5px;background:var(--line);border-radius:999px;margin:0 0 18px;overflow:hidden}
.fitprogress>i{display:block;height:100%;width:12.5%;background:linear-gradient(90deg,var(--accent),#ff8f5c);border-radius:999px;transition:width .28s ease}
.fitstep{display:none;animation:fitin .22s ease}
.fitstep.active{display:block}
@keyframes fitin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.fitstep h3{margin:0 0 6px;font-size:18px;font-weight:600}
.fitstep .hint{font-size:12.5px;color:var(--muted);margin:0 0 14px;line-height:1.5}
.fitq{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px}
.fitopts{display:flex;flex-wrap:wrap;gap:8px}
.fitopts label{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:999px;padding:8px 12px;font-size:12.5px;cursor:pointer;transition:border-color .15s,background .15s}
.fitopts input{accent-color:var(--accent)}
.fitopts label:has(input:checked){border-color:var(--accent);color:var(--text);background:rgba(255,92,22,.1)}
.fitsearch{display:block;width:100%;max-width:360px;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:10px;color:var(--text);font-family:var(--mono);font-size:12.5px;padding:9px 12px;margin:0 0 14px}
.fitsearch::placeholder{color:var(--dim)}
.fitgroups{display:flex;flex-direction:column;gap:14px}
.fitglabel{font-family:var(--mono);font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--dim);margin:0 0 8px}
.fittiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:10px}
.fittile{position:relative;border:1px solid var(--line);border-radius:12px;padding:12px 10px;cursor:pointer;text-align:center;background:rgba(255,255,255,.02);transition:border-color .15s,background .15s,transform .12s}
.fittile:hover{transform:translateY(-1px)}
.fittile input{position:absolute;opacity:0;inset:0;cursor:pointer}
.fittile:has(input:checked){border-color:var(--accent);background:rgba(255,92,22,.1)}
.fittile .ico{font-size:20px;line-height:1;margin-bottom:6px}
.fittile .ttl{font-size:12.5px;font-weight:600;color:var(--text)}
.fittile .sub{font-size:10.5px;color:var(--dim);margin-top:3px;line-height:1.35}
.fittile.t{border-top:3px solid #89B0FF}.fittile.h{border-top:3px solid #D075FF}.fittile.w{border-top:3px solid #BAF24A}
.fitslider{margin:16px 0 6px;padding:0 2px}
.fitslider input[type=range]{width:100%;height:6px;accent-color:var(--accent);cursor:pointer}
.fitsliderout{font-family:var(--mono);font-size:13px;color:var(--accent);margin:8px 0 0}
.fitsliderlabels{display:flex;justify-content:space-between;font-size:10.5px;color:var(--dim);font-family:var(--mono);margin-top:6px}
.fitnav{display:flex;gap:10px;margin-top:20px;justify-content:space-between;align-items:center}
.fitnav button{font-family:var(--mono);font-size:12.5px;border-radius:10px;padding:10px 16px;cursor:pointer}
.fitback{background:transparent;border:1px solid var(--line);color:var(--muted)}
.fitback:disabled{opacity:.35;cursor:default}
.fitnext{background:var(--accent);border:0;color:#0A0A10;font-weight:700}
.fitdone{background:var(--accent);border:0;color:#0A0A10;font-weight:700}
.fitres{margin:26px 0 0}
.fitcard{border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:0 0 10px;background:rgba(255,255,255,.02)}
.fitcard h3{margin:0 0 8px;font-size:17px}
.fitcard h3 a{color:var(--text);text-decoration:none}
.fitcard h3 a:hover{color:var(--accent)}
.fitcard ul{margin:0;padding-left:18px;font-size:12.5px;color:var(--muted);line-height:1.55}
.fitcard .meta{font-size:11.5px;color:var(--dim);margin-top:8px}
.fitnote{font-size:12px;color:var(--dim);margin-top:10px}
</style>`;

export const fitWizardHtml = (presetCountry = '', escFn = esc) => {
  const e = escFn;
  const selected = presetCountry || 'united-states';
  const bySlug = new Map(FIT_COUNTRIES.map(c => [c.slug, c]));
  const countryGroups = FIT_COUNTRY_GROUPS.map(g => {
    const pills = g.slugs.map(slug => {
      const c = bySlug.get(slug);
      if (!c) return '';
      const q = `${c.bare} ${c.slug} ${c.region}`.toLowerCase();
      return `<label class="fitc" data-q="${e(q)}"><input type="radio" name="country" value="${e(c.slug)}"${c.slug === selected ? ' checked' : ''}> ${e(c.bare)}</label>`;
    }).join('');
    return `<div class="fitg"><div class="fitglabel">${e(g.label)}</div><div class="fitopts">${pills}</div></div>`;
  }).join('');

  const profileTiles = PROFILE_CARDS.map(p =>
    `<label class="fittile"><input type="radio" name="profile" value="${e(p.id)}"${p.id === 'personal' ? ' checked' : ''}><div class="ico">${p.icon}</div><div class="ttl">${e(p.title)}</div><div class="sub">${e(p.sub)}</div></label>`).join('');

  const needTiles = NEEDS_OPTIONS.map(n =>
    `<label class="fittile"><input type="checkbox" name="need" value="${e(n.id)}"><div class="ico">${NEED_ICONS[n.id] || '·'}</div><div class="ttl">${e(n.label)}</div></label>`).join('');

  const styleTiles = STYLE_CARDS.map(s =>
    `<label class="fittile ${e(s.cls)}"><input type="radio" name="style" value="${e(s.id)}"${s.id === 'any' ? ' checked' : ''}><div class="ico">${s.icon}</div><div class="ttl">${e(s.title)}</div><div class="sub">${e(s.sub)}</div></label>`).join('');

  return `
<div class="fitwizard" id="fitwizard">
  <div class="fitmeta"><span>Step <b id="fitstepn">1</b> of ${FIT_STEP_COUNT}</span><span id="fitlive">Loading matches…</span></div>
  <div class="fitprogress" aria-hidden="true"><i id="fitbar"></i></div>
  <form id="fitform" aria-label="Neobank fit check">
    <div class="fitstep active" data-step="1">
      <h3>Where do you bank?</h3>
      <p class="hint">Pick the country you need the app to work in — we match against verified availability, not HQ.</p>
      <div class="fitq">
        <input type="search" id="fitcountryq" class="fitsearch" placeholder="Filter countries…" aria-label="Filter countries">
        <div class="fitgroups">${countryGroups}</div>
      </div>
    </div>
    <div class="fitstep" data-step="2">
      <h3>Who is this for?</h3>
      <p class="hint">Tap the profile that fits best — niche apps score higher when they match.</p>
      <div class="fittiles">${profileTiles}</div>
    </div>
    <div class="fitstep" data-step="3">
      <h3>What matters most?</h3>
      <p class="hint">Pick up to four priorities — travel, yield, crypto, license type and more.</p>
      <div class="fittiles">${needTiles}</div>
    </div>
    <div class="fitstep" data-step="4">
      <h3>Who should hold the money?</h3>
      <p class="hint">Drag the slider — left is insured custodial banking, right is keys in your pocket.</p>
      <div class="fitq fitslider">
        <input type="range" name="custodyLevel" id="custodyLevel" min="0" max="100" value="50" aria-label="Custody preference">
        <div class="fitsliderout" id="custodyLabel">Balanced · no strong preference</div>
        <div class="fitsliderlabels"><span>Bank / app holds it</span><span>You hold the keys</span></div>
      </div>
    </div>
    <div class="fitstep" data-step="5">
      <h3>What kind of app?</h3>
      <p class="hint">Traditional challengers, hybrid crypto apps, or web3-native wallets — same spectrum as the directory.</p>
      <div class="fittiles">${styleTiles}</div>
    </div>
    <div class="fitstep" data-step="6">
      <h3>How much do you travel?</h3>
      <p class="hint">Higher travel boosts multi-currency apps, low FX markup and nomad-focused products.</p>
      <div class="fitq fitslider">
        <input type="range" name="travelLevel" id="travelLevel" min="0" max="100" value="25" aria-label="Travel frequency">
        <div class="fitsliderout" id="travelLabel">Occasional trips abroad</div>
        <div class="fitsliderlabels"><span>Mostly local</span><span>Digital nomad</span></div>
      </div>
    </div>
    <div class="fitstep" data-step="7">
      <h3>Cards &amp; crypto depth</h3>
      <p class="hint">Two sliders — must-have card and how central crypto is to your stack.</p>
      <div class="fitq fitslider" style="margin-bottom:14px">
        <div class="fitglabel">Debit / card in the app</div>
        <input type="range" name="cardLevel" id="cardLevel" min="0" max="100" value="50" aria-label="Card importance">
        <div class="fitsliderout" id="cardLabel">Nice to have</div>
        <div class="fitsliderlabels"><span>Don't need one</span><span>Must have</span></div>
      </div>
      <div class="fitq fitslider">
        <div class="fitglabel">Crypto features</div>
        <input type="range" name="cryptoLevel" id="cryptoLevel" min="0" max="100" value="10" aria-label="Crypto importance">
        <div class="fitsliderout" id="cryptoLabel">Not important</div>
        <div class="fitsliderlabels"><span>Fiat only</span><span>Crypto-native</span></div>
      </div>
    </div>
    <div class="fitstep" data-step="8">
      <h3>Trust &amp; verification</h3>
      <p class="hint">Last step — how much regulated structure and KYC you are comfortable with.</p>
      <div class="fitq" style="margin-bottom:12px">
        <div class="fitglabel">Regulation</div>
        <div class="fitopts">
          <label><input type="radio" name="license" value="any" checked> Any structure</label>
          <label><input type="radio" name="license" value="licensed"> Prefer full banking license</label>
          <label><input type="radio" name="license" value="emoney"> E-money / PI is fine</label>
        </div>
      </div>
      <div class="fitq">
        <div class="fitglabel">Identity checks (KYC)</div>
        <div class="fitopts">
          <label><input type="radio" name="kyc" value="any" checked> No preference</label>
          <label><input type="radio" name="kyc" value="minimal"> Minimal / card-only KYC</label>
          <label><input type="radio" name="kyc" value="full"> Full KYC is fine</label>
        </div>
      </div>
    </div>
    <div class="fitnav">
      <button type="button" class="fitback" id="fitback" disabled>← Back</button>
      <button type="button" class="fitnext" id="fitnext">Next →</button>
      <button type="submit" class="fitdone" id="fitdone" hidden>See my matches →</button>
    </div>
  </form>
</div>
<div id="fitres" class="fitres" aria-live="polite"></div>`;
};

export const fitWizardScript = (slugMapJson) => `<script type="module">
import { rankFit, countryBySlug, parseAnswers } from '/fit/score.js';
const form = document.getElementById('fitform');
const out = document.getElementById('fitres');
const steps = [...document.querySelectorAll('.fitstep')];
const bar = document.getElementById('fitbar');
const stepN = document.getElementById('fitstepn');
const live = document.getElementById('fitlive');
const back = document.getElementById('fitback');
const next = document.getElementById('fitnext');
const done = document.getElementById('fitdone');
let cur = 1;
let entities = null;
const SLUGS = ${slugMapJson};

function esc(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}
function chip(e){
  const m={traditional:'t',hybrid:'h','web3-native':'w'};
  const l={traditional:'traditional',hybrid:'hybrid','web3-native':'web3-native'};
  return '<span class="chip '+m[e.category]+'">'+l[e.category]+'</span>';
}
function readRaw(){ return parseAnswers(new FormData(form)); }
function custodyLabel(v){
  if(v<25) return 'Custodial · bank or app holds deposits';
  if(v>75) return 'Self-custodial · you hold the keys';
  return 'Balanced · no strong preference';
}
function travelLabel(v){
  if(v<34) return 'Mostly local spending';
  if(v<67) return 'Occasional trips abroad';
  return 'Frequent travel / digital nomad';
}
function cardLabel(v){
  if(v<34) return 'Prefer no card';
  if(v<67) return 'Nice to have';
  return 'Must have a card';
}
function cryptoLabel(v){
  if(v<34) return 'Not important';
  if(v<67) return 'Nice to have';
  return 'Core feature';
}
function syncSliderLabels(){
  const c=form.custodyLevel, t=form.travelLevel, cd=form.cardLevel, cr=form.cryptoLevel;
  if(c) document.getElementById('custodyLabel').textContent = custodyLabel(+c.value);
  if(t) document.getElementById('travelLabel').textContent = travelLabel(+t.value);
  if(cd) document.getElementById('cardLabel').textContent = cardLabel(+cd.value);
  if(cr) document.getElementById('cryptoLabel').textContent = cryptoLabel(+cr.value);
}
function showStep(n){
  cur = n;
  steps.forEach(s => s.classList.toggle('active', +s.dataset.step === n));
  stepN.textContent = String(n);
  bar.style.width = (n / ${FIT_STEP_COUNT} * 100) + '%';
  back.disabled = n === 1;
  next.hidden = n === ${FIT_STEP_COUNT};
  done.hidden = n !== ${FIT_STEP_COUNT};
  live.scrollIntoView?.({block:'nearest'});
}
function liveCount(){
  if(!entities){ live.textContent = 'Loading matches…'; return; }
  const a = readRaw();
  const n = rankFit(entities, a, a.country, 200).length;
  live.textContent = n ? n + ' apps match so far' : 'No matches yet — try loosening a slider';
}
function render(rows, country){
  if(!rows.length){ out.innerHTML = '<p class="fitnote">No matches — go back and relax a filter, or <a href="/browse/">browse the dataset</a>.</p>'; return; }
  out.innerHTML = '<h2 id="matches">Your top ' + rows.length + ' matches</h2>' + rows.map(({e}, i) => {
    const slug = SLUGS[e.name];
    return '<article class="fitcard"><h3><span style="color:var(--dim);font-family:var(--mono);font-size:12px;margin-right:8px">#'+(i+1)+'</span><a href="/n/'+slug+'/">'+esc(e.name)+'</a> '+chip(e)+'</h3><ul>'+
      (country ? '<li>Scored for '+esc(country.bare)+'</li>' : '') +
      '<li>'+esc(e.regulation_type||e.custody)+'</li><li>'+(e.card_network&&e.card_network!=='—'?esc(e.card_network)+' card':'No card')+'</li></ul>'+
      '<p class="meta"><a href="/n/'+slug+'/">full profile</a></p></article>';
  }).join('');
  try{nbevt('fit_result',{country:country?.slug||'',n:rows.length,steps:${FIT_STEP_COUNT}});}catch(_){}
  out.scrollIntoView({behavior:'smooth',block:'start'});
}
function runResults(){
  if(!entities) return;
  const a = readRaw();
  render(rankFit(entities, a, a.country, 5), countryBySlug(a.country));
}
back?.addEventListener('click', () => showStep(cur - 1));
next?.addEventListener('click', () => { if(cur < ${FIT_STEP_COUNT}) showStep(cur + 1); });
form?.addEventListener('change', e => {
  if(e.target.name === 'need'){
    const boxes = [...form.querySelectorAll('input[name="need"]:checked')];
    if(boxes.length > 4) e.target.checked = false;
  }
  syncSliderLabels();
  liveCount();
});
form?.addEventListener('input', e => {
  if(e.target.type === 'range'){ syncSliderLabels(); liveCount(); }
});
form?.addEventListener('submit', e => { e.preventDefault(); runResults(); });
const cq = document.getElementById('fitcountryq');
cq?.addEventListener('input', () => {
  const v = cq.value.toLowerCase().trim();
  form.querySelectorAll('.fitc').forEach(el => { el.style.display = !v || el.dataset.q.includes(v) ? '' : 'none'; });
  form.querySelectorAll('.fitg').forEach(g => {
    g.style.display = [...g.querySelectorAll('.fitc')].some(c => c.style.display !== 'none') ? '' : 'none';
  });
});
fetch('/data.json').then(r => r.json()).then(d => {
  entities = d.entities;
  syncSliderLabels();
  liveCount();
}).catch(() => { live.textContent = 'Could not load data.json'; });
if(location.search.includes('country=')){
  const c = new URLSearchParams(location.search).get('country');
  const inp = form?.querySelector('input[name="country"][value="'+c+'"]');
  if(inp){ inp.checked = true; liveCount(); }
}
showStep(1);
</script>`;
