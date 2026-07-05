/* probe-ats.mjs — discover which tracked neobanks expose public ATS job APIs
   (Greenhouse / Lever / Ashby). Prints confirmed sources with live job counts. */
const CANDIDATES = [
  // [dataset name, [[ats, slug], ...guesses]]
  ['Revolut', [['gh', 'revolut'], ['lever', 'revolut'], ['ashby', 'revolut']]],
  ['Monzo', [['gh', 'monzo'], ['ashby', 'monzo']]],
  ['N26', [['gh', 'n26'], ['lever', 'n26']]],
  ['Starling Bank', [['gh', 'starlingbank'], ['lever', 'starlingbank']]],
  ['Chime', [['gh', 'chime'], ['ashby', 'chime']]],
  ['Nubank', [['gh', 'nubank'], ['lever', 'nubank'], ['ashby', 'nubank']]],
  ['Wise', [['gh', 'transferwise'], ['gh', 'wise']]],
  ['Mercury', [['gh', 'mercury'], ['ashby', 'mercury']]],
  ['Brex', [['gh', 'brex'], ['lever', 'brex'], ['ashby', 'brex']]],
  ['Ramp', [['ashby', 'ramp'], ['gh', 'ramp'], ['lever', 'ramp']]],
  ['Current', [['gh', 'current'], ['lever', 'current']]],
  ['Varo Bank', [['gh', 'varomoney'], ['gh', 'varobank'], ['lever', 'varomoney']]],
  ['Dave', [['gh', 'dave'], ['gh', 'davemoney'], ['lever', 'dave']]],
  ['SoFi', [['gh', 'sofi'], ['lever', 'sofi']]],
  ['MoneyLion', [['gh', 'moneylion'], ['lever', 'moneylion']]],
  ['Qonto', [['lever', 'qonto'], ['gh', 'qonto'], ['ashby', 'qonto']]],
  ['bunq', [['gh', 'bunq'], ['lever', 'bunq'], ['ashby', 'bunq']]],
  ['Kuda', [['lever', 'kuda'], ['gh', 'kuda'], ['ashby', 'kuda']]],
  ['TymeBank', [['gh', 'tymebank'], ['lever', 'tyme'], ['ashby', 'tyme']]],
  ['Moniepoint', [['gh', 'moniepoint'], ['lever', 'moniepoint'], ['ashby', 'moniepoint']]],
  ['OPay', [['gh', 'opay'], ['lever', 'opay']]],
  ['Tide', [['gh', 'tide'], ['lever', 'tide'], ['ashby', 'tide']]],
  ['Zopa', [['gh', 'zopa'], ['lever', 'zopa'], ['ashby', 'zopa']]],
  ['Allica Bank', [['gh', 'allicabank'], ['lever', 'allica'], ['ashby', 'allica-bank'], ['ashby', 'allicabank']]],
  ['Atom bank', [['gh', 'atombank'], ['lever', 'atombank']]],
  ['Lunar', [['gh', 'lunar'], ['lever', 'lunarway'], ['ashby', 'lunar']]],
  ['Vivid Money', [['gh', 'vivid'], ['lever', 'vivid'], ['ashby', 'vividmoney'], ['ashby', 'vivid-money']]],
  ['Bitpanda', [['gh', 'bitpanda'], ['lever', 'bitpanda']]],
  ['Kraken (Krak)', [['lever', 'kraken'], ['gh', 'kraken'], ['ashby', 'kraken.com'], ['ashby', 'kraken']]],
  ['Coinbase', [['gh', 'coinbase'], ['lever', 'coinbase']]],
  ['Crypto.com', [['lever', 'crypto'], ['gh', 'cryptocom'], ['ashby', 'crypto.com']]],
  ['Gemini', [['gh', 'gemini'], ['lever', 'gemini'], ['ashby', 'gemini']]],
  ['Uphold', [['gh', 'uphold'], ['lever', 'uphold'], ['ashby', 'uphold']]],
  ['Wirex', [['lever', 'wirex'], ['gh', 'wirex']]],
  ['Nexo', [['lever', 'nexo'], ['gh', 'nexo'], ['ashby', 'nexo']]],
  ['MetaMask', [['gh', 'consensys'], ['lever', 'consensys']]],
  ['Gnosis Pay', [['ashby', 'gnosis-pay'], ['ashby', 'gnosispay'], ['lever', 'gnosis'], ['gh', 'gnosispay']]],
  ['Phantom', [['ashby', 'phantom'], ['gh', 'phantom45'], ['lever', 'phantom']]],
  ['Robinhood', [['gh', 'robinhood'], ['ashby', 'robinhood']]],
  ['Greenlight', [['gh', 'greenlight'], ['lever', 'greenlight'], ['ashby', 'greenlight']]],
  ['Step', [['ashby', 'step'], ['gh', 'step'], ['lever', 'step']]],
  ['GoHenry', [['gh', 'gohenry'], ['lever', 'gohenry']]],
  ['Stori', [['gh', 'stori'], ['lever', 'stori'], ['ashby', 'stori']]],
  ['Ualá', [['gh', 'uala'], ['lever', 'uala'], ['ashby', 'uala']]],
  ['Klar', [['gh', 'klar'], ['lever', 'klar'], ['ashby', 'klar']]],
  ['Majority', [['gh', 'majority'], ['lever', 'majority'], ['ashby', 'majority']]],
  ['Zolve', [['gh', 'zolve'], ['lever', 'zolve'], ['ashby', 'zolve']]],
  ['Hnry', [['lever', 'hnry'], ['gh', 'hnry'], ['ashby', 'hnry']]],
  ['Mos', [['gh', 'mos'], ['ashby', 'mos'], ['lever', 'mos']]],
  ['Belvo', [['gh', 'belvo'], ['lever', 'belvo'], ['ashby', 'belvo']]],
  ['Jeeves', [['gh', 'jeeves'], ['lever', 'tryjeeves'], ['ashby', 'jeeves']]],
  ['Payoneer', [['gh', 'payoneer'], ['lever', 'payoneer']]],
  ['Airwallex', [['lever', 'airwallex'], ['gh', 'airwallex'], ['ashby', 'airwallex']]],
  ['Aspire', [['gh', 'aspire'], ['lever', 'aspire'], ['ashby', 'aspire']]],
  ['Jupiter', [['gh', 'jupiter'], ['lever', 'jupiter'], ['ashby', 'jupiter']]],
  ['Fi Money', [['gh', 'fimoney'], ['lever', 'epifi'], ['ashby', 'fi']]],
  ['Maya', [['gh', 'maya'], ['lever', 'paymaya'], ['ashby', 'maya']]],
  ['GCash', [['gh', 'gcash'], ['lever', 'mynt'], ['ashby', 'gcash']]],
  ['Toss', [['gh', 'toss'], ['lever', 'toss'], ['ashby', 'toss']]],
  ['KOHO', [['gh', 'koho'], ['lever', 'koho'], ['ashby', 'koho']]],
  ['Neo Financial', [['gh', 'neofinancial'], ['lever', 'neo'], ['ashby', 'neofinancial'], ['ashby', 'neo-financial']]],
  ['Wealthsimple', [['gh', 'wealthsimple'], ['lever', 'wealthsimple'], ['ashby', 'wealthsimple']]],
  ['Wio Bank', [['gh', 'wiobank'], ['lever', 'wio'], ['ashby', 'wio']]],
  ['Zand', [['gh', 'zand'], ['lever', 'zand'], ['ashby', 'zand']]],
  ['Papara', [['gh', 'papara'], ['lever', 'papara'], ['ashby', 'papara']]],
  ['Pleo', [['gh', 'pleo'], ['lever', 'pleo'], ['ashby', 'pleo']]],
  ['Monese', [['gh', 'monese'], ['lever', 'monese']]],
  ['Curve', [['gh', 'curve'], ['lever', 'curve'], ['ashby', 'curve']]],
  ['Zilch', [['gh', 'zilch'], ['lever', 'zilch'], ['ashby', 'zilch']]],
  ['Cleo', [['gh', 'cleo'], ['lever', 'cleoai'], ['ashby', 'cleo'], ['ashby', 'cleo-ai']]],
  ['Bilt', [['gh', 'bilt'], ['lever', 'bilt'], ['ashby', 'bilt'], ['ashby', 'biltrewards']]],
  ['One', [['gh', 'oneapp'], ['lever', 'one'], ['ashby', 'one']]],
  ['Found', [['gh', 'found'], ['lever', 'found'], ['ashby', 'found']]],
  ['Lili', [['gh', 'lili'], ['lever', 'lili'], ['ashby', 'lili']]],
  ['Relay', [['gh', 'relay'], ['lever', 'relayfi'], ['ashby', 'relay'], ['ashby', 'relayfi']]],
  ['NorthOne', [['gh', 'northone'], ['lever', 'northone'], ['ashby', 'northone']]],
  ['Grey', [['gh', 'grey'], ['lever', 'greyfinance'], ['ashby', 'grey']]],
  ['Djamo', [['gh', 'djamo'], ['lever', 'djamo'], ['ashby', 'djamo']]],
  ['FairMoney', [['gh', 'fairmoney'], ['lever', 'fairmoney'], ['ashby', 'fairmoney']]],
  ['Carbon', [['gh', 'carbon'], ['lever', 'carbon'], ['ashby', 'carbon']]],
  ['Sable', [['gh', 'sable'], ['lever', 'sable'], ['ashby', 'sable']]],
  ['Ether.Fi Cash', [['ashby', 'etherfi'], ['ashby', 'ether.fi'], ['lever', 'etherfi'], ['gh', 'etherfi']]],
  ['Bitwala', [['gh', 'bitwala'], ['lever', 'bitwala'], ['ashby', 'bitwala']]],
  ['Xapo Bank', [['gh', 'xapo'], ['lever', 'xapo'], ['ashby', 'xapo'], ['ashby', 'xapobank']]],
  ['Bitso', [['gh', 'bitso'], ['lever', 'bitso'], ['ashby', 'bitso']]],
  ['Lemon', [['gh', 'lemon'], ['lever', 'lemoncash'], ['ashby', 'lemon'], ['ashby', 'lemoncash']]],
  ['DolarApp', [['gh', 'dolarapp'], ['lever', 'dolarapp'], ['ashby', 'dolarapp']]],
  ['Belo', [['gh', 'belo'], ['lever', 'belo'], ['ashby', 'belo']]],
  ['Littio', [['gh', 'littio'], ['lever', 'littio'], ['ashby', 'littio']]],
  ['Onjuno', [['gh', 'onjuno'], ['lever', 'onjuno'], ['ashby', 'onjuno']]],
  ['Fold', [['gh', 'fold'], ['lever', 'foldapp'], ['ashby', 'fold'], ['ashby', 'foldapp']]],
  ['Strike', [['gh', 'strike'], ['lever', 'strike'], ['ashby', 'strike']]],
  ['Swan Bitcoin', [['gh', 'swanbitcoin'], ['lever', 'swanbitcoin'], ['ashby', 'swan'], ['ashby', 'swanbitcoin']]],
  ['River', [['gh', 'river'], ['lever', 'river'], ['ashby', 'river'], ['ashby', 'riverfinancial']]],
  ['Anchorage', [['gh', 'anchorage'], ['lever', 'anchorage'], ['ashby', 'anchorage'], ['ashby', 'anchoragedigital']]],
  ['Mercado Pago', [['gh', 'mercadolibre'], ['lever', 'mercadolibre']]],
];

const urlFor = (ats, slug) => ats === 'gh'
  ? `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`
  : ats === 'lever'
    ? `https://api.lever.co/v0/postings/${slug}?mode=json`
    : `https://api.ashbyhq.com/posting-api/job-board/${slug}`;

async function probe(ats, slug) {
  try {
    const r = await fetch(urlFor(ats, slug), { signal: AbortSignal.timeout(9000), headers: { 'user-agent': 'neobankbeat-jobs/1.0' } });
    if (!r.ok) return null;
    const j = await r.json();
    const n = ats === 'gh' ? (j.jobs || []).length : ats === 'lever' ? (Array.isArray(j) ? j.length : 0) : (j.jobs || []).length;
    return n;
  } catch { return null; }
}

const results = await Promise.all(CANDIDATES.map(async ([name, tries]) => {
  for (const [ats, slug] of tries) {
    const n = await probe(ats, slug);
    if (n !== null && n > 0) return [name, ats, slug, n];
  }
  return [name, null, null, 0];
}));

let total = 0, hits = 0;
for (const [name, ats, slug, n] of results.sort((a, b) => b[3] - a[3])) {
  if (ats) { hits++; total += n; console.log(`OK   ${name.padEnd(18)} ${ats.padEnd(6)} ${slug.padEnd(16)} ${n} jobs`); }
  else console.log(`--   ${name}`);
}
console.log(`\n${hits}/${CANDIDATES.length} sources confirmed · ${total} live jobs`);
